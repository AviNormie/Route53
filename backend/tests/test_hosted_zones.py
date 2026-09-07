from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.dns_record import DnsRecord
from app.models.hosted_zone import HostedZone
from app.models.user import User


def test_create_hosted_zone(auth_client: TestClient, demo_user: User) -> None:
    response = auth_client.post(
        "/api/v1/hosted-zones",
        json={
            "name": "example.com",
            "comment": "Primary zone",
            "type": "Public",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "example.com."
    assert body["comment"] == "Primary zone"
    assert body["type"] == "Public"
    assert body["record_count"] == 0
    assert body["created_by"] == demo_user.id
    assert body["id"].startswith("Z")
    assert len(body["id"]) == 14


def test_create_requires_auth(client: TestClient) -> None:
    response = client.post(
        "/api/v1/hosted-zones",
        json={"name": "example.com"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


def test_create_duplicate_name_conflict(auth_client: TestClient) -> None:
    first = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "dup.example.com"},
    )
    assert first.status_code == 201

    second = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "DUP.example.com."},
    )
    assert second.status_code == 409
    assert "already exists" in second.json()["detail"]


def test_list_with_search(auth_client: TestClient) -> None:
    auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "alpha.example.com", "comment": "alpha zone"},
    )
    auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "beta.example.com", "comment": "other"},
    )

    response = auth_client.get(
        "/api/v1/hosted-zones",
        params={"search": "alpha", "sort_by": "name", "sort_order": "asc"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert body["page_size"] == 20
    assert len(body["items"]) == 1
    assert body["items"][0]["name"] == "alpha.example.com."


def test_get_by_id_not_found(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/hosted-zones/ZDOESNOTEXIST1")
    assert response.status_code == 404
    assert response.json() == {"detail": "Hosted zone not found"}


def test_update_hosted_zone(auth_client: TestClient) -> None:
    created = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "update.example.com", "comment": "before"},
    )
    zone_id = created.json()["id"]

    updated = auth_client.put(
        f"/api/v1/hosted-zones/{zone_id}",
        json={"comment": "after"},
    )
    assert updated.status_code == 200
    assert updated.json()["comment"] == "after"
    assert updated.json()["name"] == "update.example.com."


def test_delete_cascades_to_records(
    auth_client: TestClient,
    db_session: Session,
) -> None:
    created = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "cascade.example.com"},
    )
    assert created.status_code == 201
    zone_id = created.json()["id"]

    record = DnsRecord(
        hosted_zone_id=zone_id,
        name="www.cascade.example.com.",
        type="A",
        value="1.2.3.4",
    )
    db_session.add(record)
    db_session.commit()
    record_id = record.id

    deleted = auth_client.delete(f"/api/v1/hosted-zones/{zone_id}")
    assert deleted.status_code == 204

    db_session.expire_all()
    assert db_session.get(HostedZone, zone_id) is None
    assert db_session.get(DnsRecord, record_id) is None
    assert (
        db_session.scalar(select(DnsRecord).where(DnsRecord.hosted_zone_id == zone_id))
        is None
    )


def test_invalid_domain_returns_422(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/hosted-zones",
        json={"name": "not a domain"},
    )
    assert response.status_code == 422
