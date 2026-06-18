from collections import defaultdict


_handlers = defaultdict(list)


def on_event(name):
    def register(fn):
        _handlers[name].append(fn)
        return fn

    return register


def emit(name, **payload):
    for fn in tuple(_handlers.get(name, ())):
        fn(**payload)
