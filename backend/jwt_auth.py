import base64
import binascii
import hashlib
import hmac
import json
import os
import sqlite3
import time
import uuid


class TokenError(ValueError):
    pass


class RevocationStoreError(RuntimeError):
    pass


def _revocation_db_path():
    path = os.getenv("AUTH_REVOCATION_DB", "").strip()
    if path == ":memory:":
        raise RevocationStoreError("Token revocation store must be persistent")
    if not path:
        path = os.path.join(
            os.path.dirname(os.path.abspath(__file__)),
            "token_revocations.sqlite3",
        )
    elif not os.path.isabs(path):
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), path)
    return path


def _connect_revocation_store():
    path = _revocation_db_path()
    connection = None
    try:
        if path != ":memory:":
            os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        connection = sqlite3.connect(path, timeout=5)
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS revoked_tokens (
                jti TEXT PRIMARY KEY,
                expires_at INTEGER NOT NULL
            )
            """
        )
        if path != ":memory:":
            os.chmod(path, 0o600)
        return connection
    except (OSError, sqlite3.Error) as error:
        if connection is not None:
            connection.close()
        raise RevocationStoreError("Token revocation store is unavailable") from error


def ensure_revocation_store():
    connection = _connect_revocation_store()
    connection.close()


def _is_revoked(jti):
    try:
        connection = _connect_revocation_store()
        try:
            row = connection.execute(
                "SELECT 1 FROM revoked_tokens WHERE jti = ? AND expires_at > ?",
                (jti, int(time.time())),
            ).fetchone()
            return row is not None
        finally:
            connection.close()
    except sqlite3.Error as error:
        raise RevocationStoreError("Token revocation store is unavailable") from error


def _validated_claims(token, expected_type):
    return _decode_token(token, expected_type, check_revocation=False)


def revoke_session_tokens(access_token=None, refresh_token=None):
    tokens = ((access_token, "access"), (refresh_token, "refresh"))
    claims_to_revoke = []
    for token, expected_type in tokens:
        if not token:
            continue
        try:
            claims_to_revoke.append(_validated_claims(token, expected_type))
        except TokenError:
            continue

    if not claims_to_revoke:
        ensure_revocation_store()
        return

    try:
        connection = _connect_revocation_store()
        try:
            with connection:
                connection.executemany(
                    "INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)",
                    ((claims["jti"], claims["exp"]) for claims in claims_to_revoke),
                )
                connection.execute(
                    "DELETE FROM revoked_tokens WHERE expires_at <= ?",
                    (int(time.time()),),
                )
        finally:
            connection.close()
    except sqlite3.Error as error:
        raise RevocationStoreError("Token revocation store is unavailable") from error


def rotate_refresh_token(refresh_token, access_token=None):
    refresh_claims = _validated_claims(refresh_token, "refresh")
    claims_to_revoke = [refresh_claims]
    if access_token:
        try:
            claims_to_revoke.append(_validated_claims(access_token, "access"))
        except TokenError:
            pass

    try:
        connection = _connect_revocation_store()
        try:
            with connection:
                cursor = connection.execute(
                    "INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)",
                    (refresh_claims["jti"], refresh_claims["exp"]),
                )
                if cursor.rowcount != 1:
                    raise TokenError("Refresh token has already been used")
                connection.executemany(
                    "INSERT OR IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)",
                    ((claims["jti"], claims["exp"]) for claims in claims_to_revoke[1:]),
                )
                connection.execute(
                    "DELETE FROM revoked_tokens WHERE expires_at <= ?",
                    (int(time.time()),),
                )
        finally:
            connection.close()
    except sqlite3.Error as error:
        raise RevocationStoreError("Token revocation store is unavailable") from error
    return refresh_claims


def _encode_segment(value):
    encoded = base64.urlsafe_b64encode(value).decode("ascii")
    return encoded.rstrip("=")


def _decode_segment(value):
    try:
        padding = "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode(value + padding)
    except (ValueError, binascii.Error) as error:
        raise TokenError("Malformed token") from error


def _get_secret():
    secret = os.getenv("JWT_SECRET", "").strip()
    if len(secret.encode("utf-8")) < 32:
        raise RuntimeError("JWT_SECRET must contain at least 32 bytes")
    return secret.encode("utf-8")


def _create_token(username, role, token_type, lifetime_env):
    try:
        lifetime = int(os.getenv(lifetime_env, "300"))
    except ValueError as error:
        raise RuntimeError(f"{lifetime_env} must be an integer") from error
    if lifetime <= 0:
        raise RuntimeError(f"{lifetime_env} must be greater than zero")

    issued_at = int(time.time())
    expires_at = issued_at + lifetime
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": username,
        "role": role,
        "token_type": token_type,
        "jti": uuid.uuid4().hex,
        "iat": issued_at,
        "exp": expires_at,
    }
    signing_input = ".".join(
        (
            _encode_segment(json.dumps(header, separators=(",", ":")).encode()),
            _encode_segment(json.dumps(payload, separators=(",", ":")).encode()),
        )
    )
    signature = hmac.new(
        _get_secret(), signing_input.encode("ascii"), hashlib.sha256
    ).digest()
    return f"{signing_input}.{_encode_segment(signature)}", expires_at


def create_access_token(username, role):
    return _create_token(username, role, "access", "JWT_EXPIRY_SECONDS")


def create_refresh_token(username, role):
    return _create_token(
        username, role, "refresh", "JWT_REFRESH_EXPIRY_SECONDS"
    )


def _decode_token(token, expected_type, check_revocation=True):
    if not isinstance(token, str):
        raise TokenError("Malformed token")
    parts = token.split(".")
    if len(parts) != 3 or not all(parts):
        raise TokenError("Malformed token")
    if any(
        character not in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-"
        for part in parts
        for character in part
    ):
        raise TokenError("Malformed token")

    try:
        header = json.loads(_decode_segment(parts[0]))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise TokenError("Malformed token") from error
    if not isinstance(header, dict) or header.get("alg") != "HS256":
        raise TokenError("Unsupported token algorithm")

    signing_input = f"{parts[0]}.{parts[1]}"
    expected_signature = hmac.new(
        _get_secret(), signing_input.encode("ascii"), hashlib.sha256
    ).digest()
    supplied_signature = _decode_segment(parts[2])
    if not hmac.compare_digest(expected_signature, supplied_signature):
        raise TokenError("Invalid token signature")

    try:
        claims = json.loads(_decode_segment(parts[1]))
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        raise TokenError("Malformed token") from error

    if not isinstance(claims, dict):
        raise TokenError("Malformed token")
    if not isinstance(claims.get("sub"), str) or not claims["sub"]:
        raise TokenError("Invalid token subject")
    if claims.get("role") not in {"admin", "user"}:
        raise TokenError("Invalid token role")
    if claims.get("token_type") != expected_type:
        raise TokenError("Invalid token type")
    jti = claims.get("jti")
    if not isinstance(jti, str) or not jti:
        raise TokenError("Invalid token identifier")
    expires_at = claims.get("exp")
    issued_at = claims.get("iat")
    if (
        not isinstance(expires_at, int)
        or isinstance(expires_at, bool)
        or not isinstance(issued_at, int)
        or isinstance(issued_at, bool)
        or expires_at <= int(time.time())
        or issued_at > int(time.time())
    ):
        raise TokenError("Token expired or invalid")
    if check_revocation and _is_revoked(jti):
        raise TokenError("Token has been revoked")
    return claims


def decode_access_token(token):
    return _decode_token(token, "access")


def decode_refresh_token(token):
    return _decode_token(token, "refresh")
