from django.core import signing


_SALT = "grimoire.identity.local"


def make_token(sub, role="user"):
    return signing.dumps({"sub": str(sub), "role": role}, salt=_SALT)


def read_token(tok):
    return signing.loads(tok, salt=_SALT)
