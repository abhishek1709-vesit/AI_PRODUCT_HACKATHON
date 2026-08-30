import os
import sys

# Add the parent directory to the system path so 'backend' module can be resolved
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import get_supabase_client

try:
    client = get_supabase_client()
    print("Successfully connected to Supabase client!")
    
    # Simple query to verify connection
    # Note: Requires tables to be created first
    response = client.table("users").select("*").limit(1).execute()
    print("Successfully executed a test query against the 'users' table.")
    print("Response data:", response.data)
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
