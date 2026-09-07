import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.hosted_zone import HostedZone


@pytest.fixture()
def zone_id(auth_client: TestClient) -> str:
    response = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "records.example.com", "comment": "dns tests"},
    )
    assert response.status_code == 201
    return response.json()["id"]


def _create(auth_client: TestClient, zone_id: str, payload: dict) -> dict:
    response = auth_client.post(f"/api/v1/hosted-zones/{zone_id}/records", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.parametrize(
    ("payload", "expected_type"),
    [
        (
            {
                "type": "A",
                "name": "www.records.example.com.",
                "ttl": 300,
                "value": "1.2.3.4",
            },
            "A",
        ),
        (
            {
                "type": "AAAA",
                "name": "ipv6.records.example.com.",
                "ttl": 300,
                "value": "2001:db8::1",
            },
            "AAAA",
        ),
        (
            {
                "type": "CNAME",
                "name": "alias.records.example.com.",
                "ttl": 300,
                "value": "www.records.example.com.",
            },
            "CNAME",
        ),
        (
            {
                "type": "TXT",
                "name": "txt.records.example.com.",
                "ttl": 300,
                "value": "v=spf1 include:_spf.google.com ~all",
            },
            "TXT",
        ),
        (
            {
                "type": "NS",
                "name": "records.example.com.",
                "ttl": 172800,
                "value": "ns-1.awsdns.com.",
            },
            "NS",
        ),
        (
            {
                "type": "PTR",
                "name": "4.3.2.1.in-addr.arpa.",
                "ttl": 300,
                "value": "www.records.example.com.",
            },
            "PTR",
        ),
        (
            {
                "type": "MX",
                "name": "records.example.com.",
                "ttl": 300,
                "value": "mail.records.example.com.",
                "priority": 10,
            },
            "MX",
        ),
        (
            {
                "type": "SRV",
                "name": "_sip._tcp.records.example.com.",
                "ttl": 300,
                "value": "sip.records.example.com.",
                "priority": 10,
                "weight": 5,
                "port": 5060,
            },
            "SRV",
        ),
        (
            {
                "type": "CAA",
                "name": "records.example.com.",
                "ttl": 300,
                "value": "letsencrypt.org",
                "caa_flag": 0,
                "caa_tag": "issue",
            },
            "CAA",
        ),
    ],
)
def test_create_each_record_type(
    auth_client: TestClient,
    zone_id: str,
    payload: dict,
    expected_type: str,
    db_session: Session,
) -> None:
    body = _create(auth_client, zone_id, payload)
    assert body["type"] == expected_type
    assert body["hosted_zone_id"] == zone_id
    assert body["name"] == payload["name"]

    db_session.expire_all()
    zone = db_session.get(HostedZone, zone_id)
    assert zone is not None
    assert zone.record_count >= 1


def test_reject_mx_without_priority(auth_client: TestClient, zone_id: str) -> None:
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records",
        json={
            "type": "MX",
            "name": "records.example.com.",
            "ttl": 300,
            "value": "mail.records.example.com.",
        },
    )
    assert response.status_code == 422


def test_reject_srv_without_port(auth_client: TestClient, zone_id: str) -> None:
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records",
        json={
            "type": "SRV",
            "name": "_sip._tcp.records.example.com.",
            "ttl": 300,
            "value": "sip.records.example.com.",
            "priority": 10,
            "weight": 5,
        },
    )
    assert response.status_code == 422


def test_reject_caa_invalid_tag(auth_client: TestClient, zone_id: str) -> None:
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records",
        json={
            "type": "CAA",
            "name": "records.example.com.",
            "ttl": 300,
            "value": "letsencrypt.org",
            "caa_flag": 0,
            "caa_tag": "invalid",
        },
    )
    assert response.status_code == 422


def test_reject_priority_on_a_record(auth_client: TestClient, zone_id: str) -> None:
    response = auth_client.post(
        f"/api/v1/hosted-zones/{zone_id}/records",
        json={
            "type": "A",
            "name": "www.records.example.com.",
            "ttl": 300,
            "value": "1.2.3.4",
            "priority": 10,
        },
    )
    assert response.status_code == 422


def test_list_search_type_filter_and_pagination(
    auth_client: TestClient, zone_id: str
) -> None:
    _create(
        auth_client,
        zone_id,
        {
            "type": "A",
            "name": "www.records.example.com.",
            "ttl": 300,
            "value": "1.2.3.4",
        },
    )
    _create(
        auth_client,
        zone_id,
        {
            "type": "A",
            "name": "api.records.example.com.",
            "ttl": 60,
            "value": "5.6.7.8",
        },
    )
    _create(
        auth_client,
        zone_id,
        {
            "type": "TXT",
            "name": "txt.records.example.com.",
            "ttl": 300,
            "value": "hello-search",
        },
    )
    _create(
        auth_client,
        zone_id,
        {
            "type": "MX",
            "name": "records.example.com.",
            "ttl": 300,
            "value": "mail.records.example.com.",
            "priority": 10,
        },
    )

    by_type = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/records",
        params={"type": "A"},
    )
    assert by_type.status_code == 200
    assert by_type.json()["total"] == 2
    assert all(item["type"] == "A" for item in by_type.json()["items"])

    by_search = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/records",
        params={"search": "hello-search"},
    )
    assert by_search.status_code == 200
    assert by_search.json()["total"] == 1
    assert by_search.json()["items"][0]["type"] == "TXT"

    page1 = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/records",
        params={"page": 1, "page_size": 2},
    )
    page2 = auth_client.get(
        f"/api/v1/hosted-zones/{zone_id}/records",
        params={"page": 2, "page_size": 2},
    )
    assert page1.status_code == 200
    assert page2.status_code == 200
    assert page1.json()["total"] == 4
    assert len(page1.json()["items"]) == 2
    assert len(page2.json()["items"]) == 2
    page1_ids = {item["id"] for item in page1.json()["items"]}
    page2_ids = {item["id"] for item in page2.json()["items"]}
    assert page1_ids.isdisjoint(page2_ids)


def test_get_update_delete_record(auth_client: TestClient, zone_id: str) -> None:
    created = _create(
        auth_client,
        zone_id,
        {
            "type": "A",
            "name": "edit.records.example.com.",
            "ttl": 300,
            "value": "9.9.9.9",
        },
    )
    record_id = created["id"]

    fetched = auth_client.get(f"/api/v1/records/{record_id}")
    assert fetched.status_code == 200
    assert fetched.json()["value"] == "9.9.9.9"

    updated = auth_client.put(
        f"/api/v1/records/{record_id}",
        json={
            "type": "A",
            "name": "edit.records.example.com.",
            "ttl": 60,
            "value": "8.8.8.8",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["ttl"] == 60
    assert updated.json()["value"] == "8.8.8.8"

    deleted = auth_client.delete(f"/api/v1/records/{record_id}")
    assert deleted.status_code == 204

    missing = auth_client.get(f"/api/v1/records/{record_id}")
    assert missing.status_code == 404


def test_create_record_zone_not_found(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/hosted-zones/ZDOESNOTEXIST1/records",
        json={
            "type": "A",
            "name": "www.example.com.",
            "ttl": 300,
            "value": "1.2.3.4",
        },
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Hosted zone not found"}
