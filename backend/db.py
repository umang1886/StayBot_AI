"""
StayBot AI – Supabase Client Singleton
Initialises the supabase-py client once and exports it for use by all routes/services.
"""
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase: Client | None = None


def get_supabase() -> Client:
    """Return the shared Supabase client, initialising it on first call."""
    global _supabase
    if _supabase is None:
        url = os.environ.get("SUPABASE_URL", "")
        key = os.environ.get("SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in the environment."
            )
        _supabase = create_client(url, key)
    return _supabase


# Convenience alias used by route/service modules
supabase: Client = None  # type: ignore[assignment]


def init_db() -> None:
    """Called by the app factory after config is loaded."""
    global supabase
    supabase = get_supabase()
