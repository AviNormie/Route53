"""BIND zone-file parser.

Treats input strictly as text. Does not execute, include, or fetch remote files.
``$INCLUDE`` / ``$GENERATE`` are rejected as unsupported directives.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

SUPPORTED_TYPES = frozenset(
    {"A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA", "SRV", "CAA", "PTR"}
)
DNS_CLASSES = frozenset({"IN", "CH", "HS", "CS"})

_MAX_TTL = 2_147_483_647


class BindParseError(Exception):
    """Raised when the zone file cannot be parsed as text BIND content."""


@dataclass
class ParsedBindRecord:
    """One RR after resolving origin / TTL / relative names."""

    name: str
    type: str
    ttl: int
    rdata: str
    line: int
    raw_type: str
    supported: bool


@dataclass
class BindParseResult:
    origin: str | None
    default_ttl: int | None
    records: list[ParsedBindRecord] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


def _strip_comments(line: str) -> str:
    """Remove BIND ``;`` comments, respecting quoted strings."""
    out: list[str] = []
    in_quote = False
    i = 0
    while i < len(line):
        ch = line[i]
        if ch == "\\" and in_quote and i + 1 < len(line):
            out.append(ch)
            out.append(line[i + 1])
            i += 2
            continue
        if ch == '"':
            in_quote = not in_quote
            out.append(ch)
            i += 1
            continue
        if ch == ";" and not in_quote:
            break
        out.append(ch)
        i += 1
    return "".join(out)


def _remove_parens(text: str) -> str:
    out: list[str] = []
    in_quote = False
    i = 0
    while i < len(text):
        ch = text[i]
        if ch == "\\" and in_quote and i + 1 < len(text):
            out.append(ch)
            out.append(text[i + 1])
            i += 2
            continue
        if ch == '"':
            in_quote = not in_quote
            out.append(ch)
            i += 1
            continue
        if not in_quote and ch in "()":
            out.append(" ")
            i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def _join_continuations(text: str) -> list[tuple[int, str, bool]]:
    """Flatten parenthesized multilines.

    Returns (start_line, logical_text, blank_owner) where blank_owner means the
    first physical line of the RR began with whitespace (BIND blank owner).
    """
    logical: list[tuple[int, str, bool]] = []
    buf: list[str] = []
    start_line = 1
    blank_owner = False
    paren_depth = 0
    collecting = False

    for idx, raw in enumerate(text.splitlines(), start=1):
        had_leading_ws = bool(raw) and raw[0].isspace()
        cleaned = _strip_comments(raw)
        if not collecting and not cleaned.strip():
            continue

        if not collecting:
            start_line = idx
            blank_owner = had_leading_ws
            collecting = True

        in_quote = False
        i = 0
        while i < len(cleaned):
            ch = cleaned[i]
            if ch == "\\" and in_quote and i + 1 < len(cleaned):
                i += 2
                continue
            if ch == '"':
                in_quote = not in_quote
            elif not in_quote:
                if ch == "(":
                    paren_depth += 1
                elif ch == ")":
                    paren_depth = max(0, paren_depth - 1)
            i += 1

        piece = _remove_parens(cleaned).strip()
        if piece:
            buf.append(piece)

        if paren_depth == 0 and collecting:
            if buf:
                logical.append((start_line, " ".join(buf), blank_owner))
            buf = []
            collecting = False

    if paren_depth != 0:
        raise BindParseError("Unbalanced parentheses in zone file")
    if buf:
        logical.append((start_line, " ".join(buf), blank_owner))
    return logical


def tokenize(line: str) -> list[str]:
    """Split a logical BIND line into tokens, keeping quoted strings intact."""
    tokens: list[str] = []
    i = 0
    n = len(line)
    while i < n:
        while i < n and line[i].isspace():
            i += 1
        if i >= n:
            break
        if line[i] == '"':
            i += 1
            chunk: list[str] = []
            while i < n:
                if line[i] == "\\" and i + 1 < n:
                    chunk.append(line[i + 1])
                    i += 2
                    continue
                if line[i] == '"':
                    i += 1
                    break
                chunk.append(line[i])
                i += 1
            tokens.append("".join(chunk))
            continue
        start = i
        while i < n and not line[i].isspace():
            i += 1
        tokens.append(line[start:i])
    return tokens


def qualify_name(name: str, origin: str | None) -> str:
    """Resolve relative names against ``$ORIGIN``; leave absolute names alone."""
    name = name.strip()
    if not name:
        raise BindParseError("Empty owner name")
    if name == "@":
        if not origin:
            raise BindParseError("@ used before $ORIGIN is set")
        return origin if origin.endswith(".") else f"{origin}."
    if name.endswith("."):
        return name.lower()
    if not origin:
        return f"{name.lower()}."
    origin_q = origin if origin.endswith(".") else f"{origin}."
    return f"{name.lower()}.{origin_q.lower()}"


def _parse_ttl(token: str) -> int | None:
    if re.fullmatch(r"\d+", token):
        value = int(token)
        if 0 <= value <= _MAX_TTL:
            return value
    return None


def _is_class(token: str) -> bool:
    return token.upper() in DNS_CLASSES


def _is_type_token(token: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z][A-Za-z0-9]*", token))


def parse_zone_file(
    text: str,
    *,
    default_origin: str | None = None,
) -> BindParseResult:
    """Parse BIND zone text into normalized records."""
    if "\x00" in text:
        raise BindParseError("Binary content is not allowed")

    origin = default_origin
    if origin and not origin.endswith("."):
        origin = f"{origin}."
    if origin:
        origin = origin.lower()

    default_ttl: int | None = None
    last_name: str | None = None
    records: list[ParsedBindRecord] = []
    warnings: list[str] = []

    for line_no, logical, blank_owner in _join_continuations(text):
        tokens = tokenize(logical)
        if not tokens:
            continue

        first = tokens[0]
        if first.startswith("$"):
            directive = first.upper()
            if directive == "$ORIGIN":
                if len(tokens) < 2:
                    raise BindParseError(f"Line {line_no}: $ORIGIN requires a name")
                origin = tokens[1]
                if not origin.endswith("."):
                    origin = f"{origin}."
                origin = origin.lower()
                continue
            if directive == "$TTL":
                if len(tokens) < 2:
                    raise BindParseError(f"Line {line_no}: $TTL requires a value")
                ttl_val = _parse_ttl(tokens[1])
                if ttl_val is None:
                    raise BindParseError(f"Line {line_no}: invalid $TTL")
                default_ttl = ttl_val
                continue
            if directive in {"$INCLUDE", "$GENERATE"}:
                raise BindParseError(
                    f"Line {line_no}: {directive} is not allowed for security reasons"
                )
            raise BindParseError(f"Line {line_no}: unsupported directive {directive}")

        idx = 0
        if blank_owner:
            if last_name is None:
                raise BindParseError(f"Line {line_no}: blank owner name with no prior name")
        else:
            try:
                last_name = qualify_name(tokens[0], origin)
            except BindParseError as exc:
                raise BindParseError(f"Line {line_no}: {exc}") from exc
            idx = 1

        if last_name is None:
            raise BindParseError(f"Line {line_no}: missing owner name")

        ttl: int | None = None
        while idx < len(tokens):
            tok = tokens[idx]
            parsed_ttl = _parse_ttl(tok)
            if parsed_ttl is not None and ttl is None:
                ttl = parsed_ttl
                idx += 1
                continue
            if _is_class(tok):
                idx += 1
                continue
            break

        if idx >= len(tokens):
            raise BindParseError(f"Line {line_no}: missing record type")

        record_type = tokens[idx].upper()
        idx += 1
        if not _is_type_token(record_type):
            raise BindParseError(f"Line {line_no}: invalid record type {record_type!r}")

        rdata_tokens = tokens[idx:]
        if not rdata_tokens:
            raise BindParseError(f"Line {line_no}: missing rdata for {record_type}")

        # Quoted TXT segments were unquoted by tokenize; re-join with spaces.
        rdata = " ".join(rdata_tokens)

        # Qualify hostnames inside rdata for types that use domain names
        rdata = _normalize_rdata(record_type, rdata, origin)

        effective_ttl = (
            ttl if ttl is not None else (default_ttl if default_ttl is not None else 300)
        )
        supported = record_type in SUPPORTED_TYPES
        if not supported:
            warnings.append(f"Line {line_no}: unsupported record type {record_type}")

        records.append(
            ParsedBindRecord(
                name=last_name,
                type=record_type,
                ttl=effective_ttl,
                rdata=rdata,
                line=line_no,
                raw_type=record_type,
                supported=supported,
            )
        )

    return BindParseResult(
        origin=origin,
        default_ttl=default_ttl,
        records=records,
        warnings=warnings,
    )


def _normalize_rdata(record_type: str, rdata: str, origin: str | None) -> str:
    """Qualify relative domain names that appear in RDATA where appropriate."""
    if record_type in {"A", "AAAA", "TXT", "CAA"}:
        return rdata

    tokens = rdata.split()
    if not tokens:
        return rdata

    def q(name: str) -> str:
        try:
            return qualify_name(name, origin)
        except BindParseError:
            return name

    if record_type in {"CNAME", "NS", "PTR"}:
        return q(tokens[0])
    if record_type == "MX" and len(tokens) >= 2:
        return f"{tokens[0]} {q(tokens[1])}"
    if record_type == "SRV" and len(tokens) >= 4:
        return f"{tokens[0]} {tokens[1]} {tokens[2]} {q(tokens[3])}"
    if record_type == "SOA" and len(tokens) >= 2:
        rest = " ".join(tokens[2:])
        return f"{q(tokens[0])} {q(tokens[1])} {rest}".strip()
    return rdata
