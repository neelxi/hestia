"""Configuration for the MCP server."""

import os
from dataclasses import dataclass


@dataclass
class HestiaConfig:
    supabase_url: str
    supabase_service_key: str
    directives_path: str

    @classmethod
    def from_env(cls) -> "HestiaConfig":
        return cls(
            supabase_url=os.environ.get("SUPABASE_URL", os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")),
            supabase_service_key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_SERVICE_KEY", "")),
            directives_path=os.environ.get("HESTIA_DIRECTIVES_PATH", "./directives"),
        )
