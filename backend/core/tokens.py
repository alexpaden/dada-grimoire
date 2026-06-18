from core.runtime_options import runtime_option


def _backend():
    profile = runtime_option(
        "TOKEN_PROFILE",
        default="session",
        choices={"claim-cache", "session", "test"},
    )
    if profile in {"session", "test"}:
        from core.token_backends import session_keys as mod
    else:
        from core.token_backends import claim_cache as mod
    return mod


def make_token(sub, role='user'):
    return _backend().make_token(sub, role)


def read_token(tok):
    return _backend().read_token(tok)
