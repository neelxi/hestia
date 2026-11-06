"""Shared Supabase client for execution scripts."""

import os
import sys
from functools import lru_cache
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# The repo has a supabase/ folder (migrations) that shadows the pip package.
# Temporarily remove repo root from path so we load the real package.
_repo_root = Path(__file__).resolve().parents[2]
_removed = [p for p in sys.path if Path(p or ".").resolve() == _repo_root]
for p in _removed:
    sys.path.remove(p)
try:
    from supabase import create_client, Client
finally:
    for p in _removed:
        sys.path.insert(0, p)


@lru_cache(maxsize=1)
def get_supabase() -> Client:
    url = os.environ.get("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", ""))
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_SERVICE_KEY", ""))
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(url, key)


