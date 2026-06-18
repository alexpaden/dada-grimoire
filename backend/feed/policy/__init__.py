from core.runtime_options import runtime_option


def sanitize_post(raw):
    profile = runtime_option(
        "TV_RENDER_PROFILE",
        default="strict",
        choices={"mounted", "compat", "strict", "test"},
    )
    if profile in {"strict", "test"}:
        from feed.sanitizers import sanitize_post as renderer
    else:
        from .sanitizer import sanitize_post as renderer
    return renderer(raw)
