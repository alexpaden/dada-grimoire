from .flags import runtime_value

EXAMPLE_FLAG = "flag{welcome_operator}"

CHALLENGES = [
    {"id": "EX", "title": "Warm-up", "tier": "intro", "points": 1, "flag": EXAMPLE_FLAG},
    {"id": "E2", "title": "Beacon", "tier": "easy", "points": 100, "lookup": "r8d01"},
    {"id": "E5", "title": "Oracle", "tier": "easy", "points": 100, "lookup": "c4a92"},
    {"id": "M2", "title": "Ledger", "tier": "medium", "points": 250, "lookup": "a19f4"},
    {"id": "M3", "title": "Relay", "tier": "medium", "points": 250, "lookup": "e0d53"},
    {"id": "M1", "title": "Sigil", "tier": "medium", "points": 250, "lookup": "n6b77"},
    {"id": "H1", "title": "Effigy", "tier": "hard", "points": 500, "lookup": "m2c88"},
    {"id": "H2", "title": "Warden", "tier": "hard", "points": 500, "lookup": "v7a30"},
]

CHALLENGES_BY_ID = {c["id"]: c for c in CHALLENGES}


def resolve_capture(submitted):
    submitted = (submitted or "").strip()
    if not submitted:
        return None
    for challenge in CHALLENGES:
        expected = challenge.get("flag") or runtime_value(challenge.get("lookup", ""))
        if expected and submitted == expected:
            return challenge
    return None
