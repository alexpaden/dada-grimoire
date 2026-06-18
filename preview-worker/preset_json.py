import json


def restore(raw):
    return json.loads(raw.decode("utf-8"))
