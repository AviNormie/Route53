"""Unit tests for the BIND zone-file parser and validator."""

from __future__ import annotations

import pytest

from app.services.bind_parser import BindParseError, parse_zone_file, qualify_name
from app.services.bind_validator import normalize_and_validate


SAMPLE = """
$ORIGIN example.com.
$TTL 3600

; comment line
@ IN A 192.0.2.1
www IN A 192.0.2.2
ipv6 IN AAAA 2001:db8::1
alias IN CNAME www.example.com.
mail IN MX 10 mail.example.com.
@ IN TXT "v=spf1 include:example.com ~all"
@ IN NS ns-1.awsdns.com.
@ IN SOA ns-1.awsdns.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400
_sip._tcp IN SRV 10 5 5060 sip.example.com.
@ IN CAA 0 issue "letsencrypt.org"
4.3.2.1.in-addr.arpa. IN PTR www.example.com.
"""


def test_qualify_relative_and_absolute() -> None:
    assert qualify_name("www", "example.com.") == "www.example.com."
    assert qualify_name("@", "example.com.") == "example.com."
    assert qualify_name("www.example.com.", "other.com.") == "www.example.com."


def test_parse_common_types() -> None:
    result = parse_zone_file(SAMPLE)
    types = {r.type for r in result.records}
    assert types >= {
        "A",
        "AAAA",
        "CNAME",
        "MX",
        "TXT",
        "NS",
        "SOA",
        "SRV",
        "CAA",
        "PTR",
    }
    www = next(r for r in result.records if r.name == "www.example.com." and r.type == "A")
    assert www.ttl == 3600
    assert www.rdata == "192.0.2.2"


def test_origin_and_ttl_directives() -> None:
    result = parse_zone_file(SAMPLE)
    assert result.origin == "example.com."
    assert result.default_ttl == 3600
    apex = next(r for r in result.records if r.name == "example.com." and r.type == "A")
    assert apex.rdata == "192.0.2.1"


def test_comments_and_blank_lines() -> None:
    text = """
$ORIGIN example.com.
$TTL 300

; this is a comment

www IN A 1.2.3.4
"""
    result = parse_zone_file(text)
    assert len(result.records) == 1


def test_multiline_parentheses() -> None:
    text = """
$ORIGIN example.com.
$TTL 300
@ IN SOA ns1.example.com. hostmaster.example.com. (
        2024010101 ; serial
        7200       ; refresh
        900        ; retry
        1209600    ; expire
        86400      ; minimum
        )
"""
    result = parse_zone_file(text)
    assert len(result.records) == 1
    assert result.records[0].type == "SOA"
    assert "2024010101" in result.records[0].rdata


def test_quoted_txt() -> None:
    text = """
$ORIGIN example.com.
$TTL 300
@ IN TXT "v=spf1 include:example.com ~all"
"""
    result = parse_zone_file(text)
    assert result.records[0].rdata == "v=spf1 include:example.com ~all"


def test_blank_owner_inherits_previous() -> None:
    text = """
$ORIGIN example.com.
$TTL 300
www IN A 1.2.3.4
    IN AAAA 2001:db8::1
"""
    result = parse_zone_file(text)
    assert len(result.records) == 2
    assert all(r.name == "www.example.com." for r in result.records)


def test_unsupported_type_flagged() -> None:
    text = """
$ORIGIN example.com.
$TTL 300
@ IN NAPTR 100 10 "S" "SIP+D2U" "" _sip._udp.example.com.
"""
    result = parse_zone_file(text)
    assert result.records[0].supported is False
    normalized = normalize_and_validate(result.records[0])
    assert normalized.status == "unsupported"


def test_invalid_a_record() -> None:
    text = """
$ORIGIN example.com.
$TTL 300
www IN A not-an-ip
"""
    result = parse_zone_file(text)
    normalized = normalize_and_validate(result.records[0])
    assert normalized.status == "invalid"


def test_malformed_mx() -> None:
    text = """
$ORIGIN example.com.
$TTL 300
@ IN MX mail.example.com.
"""
    result = parse_zone_file(text)
    normalized = normalize_and_validate(result.records[0])
    assert normalized.status == "invalid"


def test_reject_include_directive() -> None:
    with pytest.raises(BindParseError, match="INCLUDE"):
        parse_zone_file("$INCLUDE other.zone\n")


def test_reject_binary_null() -> None:
    with pytest.raises(BindParseError, match="Binary"):
        parse_zone_file("www IN A 1.2.3.4\x00")


def test_empty_records() -> None:
    result = parse_zone_file("; only comments\n\n")
    assert result.records == []


def test_validate_caa_and_srv() -> None:
    text = """
$ORIGIN example.com.
$TTL 300
@ IN CAA 0 issue "letsencrypt.org"
_sip._tcp IN SRV 10 5 5060 sip.example.com.
"""
    result = parse_zone_file(text)
    caa = normalize_and_validate(result.records[0])
    srv = normalize_and_validate(result.records[1])
    assert caa.status == "valid"
    assert caa.caa_tag == "issue"
    assert caa.value == "letsencrypt.org"
    assert srv.status == "valid"
    assert srv.priority == 10
    assert srv.weight == 5
    assert srv.port == 5060
