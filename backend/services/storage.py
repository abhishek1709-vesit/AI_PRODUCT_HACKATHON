import os
from supabase import create_client, Client
from backend.config import settings

def get_supabase_storage_client() -> Client:
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        raise ValueError("Supabase URL and Key must be configured for storage.")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

class StorageService:
    def __init__(self, bucket_name: str = "proposals"):
        self.supabase = get_supabase_storage_client()
        self.bucket = bucket_name
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        # We try to get the bucket. If it fails or doesn't exist, we create it.
        try:
            buckets = self.supabase.storage.list_buckets()
            if not any(b.name == self.bucket for b in buckets):
                self.supabase.storage.create_bucket(self.bucket, {"public": False})
        except Exception as e:
            print(f"Warning checking/creating bucket {self.bucket}: {e}")

    def upload_file(self, path: str, file_bytes: bytes, content_type: str) -> str:
        """
        Uploads a file to Supabase storage.
        Returns the path if successful.
        """
        response = self.supabase.storage.from_(self.bucket).upload(
            path=path,
            file=file_bytes,
            file_options={"content-type": content_type}
        )
        return path

    def delete_file(self, path: str):
        self.supabase.storage.from_(self.bucket).remove([path])

    def create_signed_url(self, path: str, expires_in: int = 3600) -> str:
        """
        Returns a signed URL for secure temporary access.
        """
        response = self.supabase.storage.from_(self.bucket).create_signed_url(path, expires_in)
        return response.get("signedURL")
