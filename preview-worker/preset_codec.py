import os

from preset_json import restore as restore_json


def _profile(fmt):
    # PREVIEW_IMPORT_MODE pins the codec for this instance; "legacy" selects the
    # binary-compatible plan reader, anything else uses the json reader.
    mode = os.environ.get("PREVIEW_IMPORT_MODE", "")
    if mode == "legacy":
        return "compat"
    return "json"


def restore_payload(raw, fmt):
    if _profile(fmt) == "json":
        return restore_json(raw)

    from compat_plan_cache import restore as restore_compat

    return restore_compat(raw)
