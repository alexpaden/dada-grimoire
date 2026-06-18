import os


def _db_value(name):
    try:
        from search.models import KV

        return (
            KV.objects.filter(label=f"runtime:{name.lower()}")
            .values_list("value", flat=True)
            .first()
        )
    except Exception:
        return None


def runtime_option(name, default="", choices=None):
    # Deployment knobs the operator pins per instance. Resolution order:
    # explicit run-command override (env) -> instance policy (db) -> baseline default.
    value = os.environ.get(name) or _db_value(name) or default
    if choices and value not in choices:
        return default
    return value
