import os

os.environ.setdefault("TV_RENDER_PROFILE", "test")
os.environ.setdefault("IDENTITY_PROFILE", "test")
os.environ.setdefault("TOKEN_PROFILE", "test")

from .settings import *  # noqa: F401,F403


RUNTIME_PROFILE = "test"
