"""Shared utility functions for execution scripts."""

import json
from datetime import datetime, timezone
from pathlib import Path


def load_directive(path: str) -> dict:
    """Parse a directive markdown file with YAML front matter."""
    import yaml

    text = Path(path).read_text()
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            front_matter = yaml.safe_load(parts[1])
            body = parts[2].strip()
            return {"metadata": front_matter, "body": body}
    return {"metadata": {}, "body": text}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def safe_json(obj: object) -> str:
    return json.dumps(obj, default=str, indent=2)
