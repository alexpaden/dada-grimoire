import os
import json

from django.core import signing

PRESET_SALT = "grimoire.preset"


class PrefSerializer:
    """Wire codec for a saved-view preset."""

    def dumps(self, obj):
        return json.dumps(obj, separators=(",", ":")).encode()

    def loads(self, data):
        return json.loads(data.decode())


def _key():
    return os.environ.get("GRIMOIRE_SALT", "")


def dump_preset(view):
    """Hand a client a signed token for its saved view."""
    return signing.dumps(
        view, key=_key(), salt=PRESET_SALT, serializer=PrefSerializer, compress=False
    )


def open_preset_payload(token):
    """Return a preset token's inner bytes after signature verification."""
    b64 = signing.TimestampSigner(key=_key(), salt=PRESET_SALT).unsign(token)
    return signing.b64_decode(b64.encode())
