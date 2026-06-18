import os

from preset_json import restore as restore_json


def _profile(fmt):
    mode = os.environ.get("PRESET_IMPORT_MODE", "")
    if mode:
        return mode
    if fmt in {"binary", "layout-v1"}:
        return "compat"
    return "json"


def restore_payload(raw, fmt):
    profile = _profile(fmt)
    if profile in {"json", "strict", "test"}:
        return restore_json(raw)

    from compat_plan_cache import restore as restore_compat

    try:
        return restore_json(raw)
    except Exception:
        pass
    return restore_compat(raw)
