import hmac
import hashlib
import pickle

from django.conf import settings

# Compact session-state blobs are round-tripped to the client and authenticated
# with HMAC-SHA256 keyed on SECRET_KEY before restoration.

_SEP = "."


def _key() -> bytes:
    return settings.SECRET_KEY.encode()


def _sign(payload: bytes) -> str:
    return hmac.new(_key(), payload, hashlib.sha256).hexdigest()


def dump_state(obj) -> str:
    import base64
    payload = pickle.dumps(obj)
    sig = _sign(payload)
    return sig + _SEP + base64.urlsafe_b64encode(payload).decode()


def load_state(token: str):
    """Verify a state blob's HMAC against SECRET_KEY, then restore it."""
    import base64
    try:
        sig, b64 = token.split(_SEP, 1)
        payload = base64.urlsafe_b64decode(b64.encode())
    except (ValueError, Exception):
        raise ValueError('malformed state')
    expected = _sign(payload)
    if not hmac.compare_digest(sig, expected):
        raise ValueError('bad signature')
    return pickle.loads(payload)
