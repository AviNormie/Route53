"""Hosted zone export + BIND round-trip tests."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.services.bind_parser import parse_zone_file
from app.services.bind_validator import normalize_and_validate
from app.services.zone_export_service import escape_txt_rdata, zone_to_bind


def _create_zone(auth_client: TestClient, name: str = "export.example.com") -> str:
    response = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": name, "comment": "export suite"},
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


def _seed_records(auth_client: TestClient, zone_id: str) -> list[dict]:
    payloads = [
        {
            "type": "A",
            "name": "export.example.com.",
            "ttl": 300,
            "value": "192.0.2.10",
        },
        {
            "type": "AAAA",
            "name": "ipv6.export.example.com.",
            "ttl": 300,
            "value": "2001:db8::10",
        },
        {
            "type": "CNAME",
            "name": "www.export.example.com.",
            "ttl": 300,
            "value": "export.example.com.",
        },
        {
            "type": "MX",
            "name": "export.example.com.",
            "ttl": 300,
            "value": "mail.export.example.com.",
            "priority": 10,
        },
        {
            "type": "TXT",
            "name": "export.example.com.",
            "ttl": 300,
            "value": 'v=spf1 include:example.com "quoted" ~all',
        },
        {
            "type": "NS",
            "name": "export.example.com.",
            "ttl": 172800,
            "value": "ns-1.awsdns.com.",
        },
        {
            "type": "SOA",
            "name": "export.example.com.",
            "ttl": 900,
            "value": (
                "ns-1.awsdns.com. awsdns-hostmaster.amazon.com. "
                "1 7200 900 1209600 86400"
            ),
        },
        {
            "type": "SRV",
            "name": "_sip._tcp.export.example.com.",
            "ttl": 300,
            "value": "sip.export.example.com.",
            "priority": 10,
            "weight": 5,
            "port": 5060,
        },
        {
            "type": "CAA",
            "name": "export.example.com.",
            "ttl": 300,
            "value": "letsencrypt.org",
            "caa_flag": 0,
            "caa_tag": "issue",
        },
        {
            "type": "PTR",
            "name": "10.2.0.192.in-addr.arpa.",
            "ttl": 300,
            "value": "export.example.com.",
        },
    ]
    created = []
    for payload in payloads:
        response = auth_client.post(
            f"/api/v1/hosted-zones/{zone_id}/records",
            json=payload,
        )
        assert response.status_code == 201, response.text
        created.append(response.json())
    return created


def _record_key(record: dict) -> tuple:
    return (
        record["name"].lower(),
        record["type"].upper(),
        record["value"],
        record.get("priority"),
        record.get("weight"),
        record.get("port"),
        record.get("caa_flag"),
        record.get("caa_tag"),
        record["ttl"],
    )


def test_escape_txt() -> None:
    assert escape_txt_rdata('a"b\\c') == '"a\\"b\\\\c"'


def test_export_json_schema(auth_client: TestClient) -> None:
    zone_id = _create_zone(auth_client)
    _seed_records(auth_client, zone_id)

    response = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/export",
        params={"format": "json"},
    )
    assert response.status_code == 200
    assert "attachment" in response.headers.get("content-disposition", "")
    assert "export.example.com.json" in response.headers.get("content-disposition", "")

    data = response.json()
    assert data["name"] == "export.example.com."
    assert data["zoneId"] == zone_id
    assert data["type"] == "PUBLIC"
    assert data["description"] == "export suite"
    assert data["tags"] == []
    assert "created_at" not in data
    assert "id" not in data["records"][0]
    assert "hosted_zone_id" not in data["records"][0]

    mx = next(r for r in data["records"] if r["type"] == "MX")
    assert mx["priority"] == 10
    assert mx["value"] == "mail.export.example.com."

    srv = next(r for r in data["records"] if r["type"] == "SRV")
    assert srv["priority"] == 10
    assert srv["weight"] == 5
    assert srv["port"] == 5060


def test_export_json_round_trip_compare(auth_client: TestClient) -> None:
    zone_id = _create_zone(auth_client)
    seeded = _seed_records(auth_client, zone_id)

    response = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/export",
        params={"format": "json"},
    )
    exported = response.json()
    original_keys = {
        (
            r["name"].lower(),
            r["type"].upper(),
            r["value"],
            r.get("priority"),
            r.get("weight"),
            r.get("port"),
            r.get("caa_flag"),
            r.get("caa_tag"),
            r["ttl"],
        )
        for r in seeded
    }
    export_keys = {
        (
            r["name"].lower(),
            r["type"].upper(),
            r["value"],
            r.get("priority"),
            r.get("weight"),
            r.get("port"),
            r.get("caa_flag"),
            r.get("caa_tag"),
            r["ttl"],
        )
        for r in exported["records"]
    }
    assert original_keys == export_keys


def test_export_bind_and_round_trip_import(auth_client: TestClient) -> None:
    zone_id = _create_zone(auth_client)
    seeded = _seed_records(auth_client, zone_id)

    export_resp = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/export",
        params={"format": "bind"},
    )
    assert export_resp.status_code == 200
    assert "export.example.com.zone" in export_resp.headers.get(
        "content-disposition", ""
    )
    bind_text = export_resp.text
    assert "$ORIGIN export.example.com." in bind_text
    assert 'IN TXT "' in bind_text

    # Wipe records by deleting individually, then re-import
    for record in seeded:
        deleted = auth_client.delete(f"/api/v1/records/{record['id']}")
        assert deleted.status_code == 204

    listed = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/records",
        params={"page_size": 100},
    )
    assert listed.json()["total"] == 0

    commit = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import",
        json={
            "content": bind_text,
            "filename": "export.example.com.zone",
            "duplicate_mode": "skip",
        },
    )
    assert commit.status_code == 200, commit.text
    assert commit.json()["imported"] == len(seeded)
    assert commit.json()["failed"] == 0

    after = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/records",
        params={"page_size": 100},
    )
    assert after.status_code == 200
    imported = after.json()["items"]
    assert len(imported) == len(seeded)

    def identity(record: dict) -> tuple:
        return (
            record["name"].lower(),
            record["type"].upper(),
            record["value"],
            record.get("priority"),
            record.get("weight"),
            record.get("port"),
            record.get("caa_flag"),
            record.get("caa_tag"),
        )

    assert {identity(r) for r in seeded} == {identity(r) for r in imported}


def test_bulk_export_json(auth_client: TestClient) -> None:
    zone_a = _create_zone(auth_client, "a-export.example.com")
    zone_b = _create_zone(auth_client, "b-export.example.com")
    auth_client.post(
        f"/api/v1/hosted-zones/{zone_a}/records",
        json={
            "type": "A",
            "name": "a-export.example.com.",
            "ttl": 300,
            "value": "192.0.2.1",
        },
    )

    response = auth_client.post(
        "/api/v1/hosted-zones/export",
        json={"zone_ids": [zone_a, zone_b], "format": "json"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "zones" in data
    assert len(data["zones"]) == 2
    names = {z["name"] for z in data["zones"]}
    assert "a-export.example.com." in names
    assert "b-export.example.com." in names


def test_bind_parser_accepts_exported_txt_escaping() -> None:
    """Unit-level: exported TXT with quotes re-parses to original value."""
    from app.models.dns_record import DnsRecord
    from app.models.hosted_zone import HostedZone

    zone = HostedZone(
        id="ZTEST",
        name="example.com.",
        type="Public",
        comment=None,
        record_count=1,
        created_by=1,
    )
    record = DnsRecord(
        id="r1",
        hosted_zone_id="ZTEST",
        name="example.com.",
        type="TXT",
        ttl=300,
        value='say "hello" \\world',
    )
    # Bypass ORM init defaults by setting attrs on a simple namespace-like object
    class R:
        name = record.name
        type = record.type
        ttl = record.ttl
        value = record.value
        priority = None
        weight = None
        port = None
        caa_flag = None
        caa_tag = None

    class Z:
        name = zone.name

    bind = zone_to_bind(Z(), [R()])  # type: ignore[arg-type]
    parsed = parse_zone_file(bind, default_origin="example.com.")
    assert len(parsed.records) == 1
    normalized = normalize_and_validate(parsed.records[0])
    assert normalized.status == "valid"
    assert normalized.value == 'say "hello" \\world'
