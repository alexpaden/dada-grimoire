import hashlib

import jwt
from django.conf import settings


def _signing_key():
    seed = getattr(settings, "GRIMOIRE_SALT", "")
    return hashlib.sha256(("grimoire.identity.v1:" + seed).encode()).hexdigest()


def make_token(sub, role="user"):
    return jwt.encode({"sub": str(sub), "role": role}, _signing_key(), algorithm="HS256")


def read_token(tok):
    return jwt.decode(tok, _signing_key(), algorithms=["HS256"])
