import os

_SLOTS = {
    "r8d01": "GRIMOIRE_SLOT_A",
    "c4a92": "GRIMOIRE_SLOT_B",
    "n6b77": "GRIMOIRE_SLOT_C",
    "a19f4": "GRIMOIRE_SLOT_D",
    "e0d53": "GRIMOIRE_SLOT_E",
    "m2c88": "GRIMOIRE_SLOT_F",
    "v7a30": "GRIMOIRE_SLOT_G",
}


def runtime_value(key):
    return os.environ.get(_SLOTS.get(key, ""), "")
