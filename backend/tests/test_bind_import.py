"""API tests for BIND zone-file import preview and commit."""

from __future__ import annotations

from fastapi.testclient import TestClient

ZONE = """
$ORIGIN import.example.com.
$TTL 3600

@ IN A 192.0.2.10
www IN A 192.0.2.11
mail IN MX 10 mail.import.example.com.
@ IN TXT "hello world"
www IN AAAA 2001:db8::10
alias IN CNAME www.import.example.com.
@ IN NS ns-1.awsdns.com.
@ IN SOA ns-1.awsdns.com. hostmaster.import.example.com. 1 7200 900 1209600 86400
_sip._tcp IN SRV 10 5 5060 sip.import.example.com.
@ IN CAA 0 issue "letsencrypt.org"
bad IN A not-an-ip
@ IN NAPTR 100 10 "S" "SIP+D2U" "" _sip._udp.import.example.com.
"""


def _zone_id(auth_client: TestClient) -> str:
    response = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "import.example.com", "comment": "import tests"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_preview_json(auth_client: TestClient) -> None:
    zone_id = _zone_id(auth_client)
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import/preview-json",
        json={"content": ZONE, "filename": "demo.zone"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["summary"]["total"] >= 10
    assert data["summary"]["valid"] >= 8
    assert data["summary"]["invalid"] >= 1
    assert data["summary"]["unsupported"] >= 1
    statuses = {row["status"] for row in data["records"]}
    assert "valid" in statuses
    assert "invalid" in statuses
    assert "unsupported" in statuses


def test_preview_empty_file(auth_client: TestClient) -> None:
    zone_id = _zone_id(auth_client)
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import/preview-json",
        json={"content": "; empty\n", "filename": "empty.zone"},
    )
    assert response.status_code == 400


def test_preview_multipart(auth_client: TestClient) -> None:
    zone_id = _zone_id(auth_client)
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import/preview",
        files={"file": ("demo.zone", ZONE.encode("utf-8"), "text/plain")},
    )
    assert response.status_code == 200, response.text
    assert response.json()["summary"]["valid"] >= 1


def test_import_skip_duplicates(auth_client: TestClient) -> None:
    zone_id = _zone_id(auth_client)
    # Seed one overlapping record
    create = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records",
        json={
            "type": "A",
            "name": "www.import.example.com.",
            "ttl": 300,
            "value": "192.0.2.11",
        },
    )
    assert create.status_code == 201

    preview = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import/preview-json",
        json={"content": ZONE, "filename": "demo.zone"},
    )
    assert preview.status_code == 200
    assert preview.json()["summary"]["duplicate"] >= 1

    commit = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import",
        json={
            "content": ZONE,
            "filename": "demo.zone",
            "duplicate_mode": "skip",
        },
    )
    assert commit.status_code == 200, commit.text
    result = commit.json()
    assert result["imported"] >= 1
    assert result["skipped"] >= 1

    listed = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/records",
        params={"page_size": 100},
    )
    assert listed.status_code == 200
    names = {(r["name"], r["type"]) for r in listed.json()["items"]}
    assert ("www.import.example.com.", "A") in names
    assert ("mail.import.example.com.", "MX") in names


def test_import_replace_duplicates(auth_client: TestClient) -> None:
    zone_id = _zone_id(auth_client)
    create = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records",
        json={
            "type": "A",
            "name": "www.import.example.com.",
            "ttl": 60,
            "value": "192.0.2.11",
        },
    )
    assert create.status_code == 201
    record_id = create.json()["id"]

    commit = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import",
        json={
            "content": "www.import.example.com. 3600 IN A 192.0.2.11\n",
            "filename": "one.zone",
            "duplicate_mode": "replace",
        },
    )
    assert commit.status_code == 200, commit.text
    assert commit.json()["imported"] == 1

    got = auth_client.get(f"/api/v1/records/{record_id}")
    assert got.status_code == 200
    assert got.json()["ttl"] == 3600


def test_reject_wrong_extension(auth_client: TestClient) -> None:
    zone_id = _zone_id(auth_client)
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records/import/preview-json",
        json={"content": "www IN A 1.2.3.4\n", "filename": "evil.exe"},
    )
    assert response.status_code == 400
