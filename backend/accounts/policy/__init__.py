from core.runtime_options import runtime_option


def identity_serializer():
    profile = runtime_option(
        "IDENTITY_PROFILE",
        default="strict",
        choices={"compat", "strict", "test"},
    )
    if profile in {"strict", "test"}:
        from accounts.serializers import IdentitySerializer
    else:
        from .row_shape import IdentitySerializer
    return IdentitySerializer
