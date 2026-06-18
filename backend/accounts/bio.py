import re


def clean_bio(raw: str) -> str:
    return re.sub(r'(?is)<\s*script.*?>.*?<\s*/\s*script\s*>', '', raw)
