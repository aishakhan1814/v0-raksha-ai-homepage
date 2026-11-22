import json
import os
import sys

# Ensure local backend packages and app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guidelines_engine import get_guidelines_engine

def sync_guidelines_handler(event, context):
    """
    AWS Lambda entry point for /rag/sync or S3 document upload triggers.
    Ensures idempotent synchronization of approved guidelines into knowledge base manifest.
    Prevents repeated ingestion of unchanged documents via SHA-256 validation.
    """
    try:
        engine = get_guidelines_engine()
        manifest = engine.sync_manifest()

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization"
            },
            "body": json.dumps({
                "success": True,
                "message": "Clinical guidelines knowledge base synchronization completed successfully.",
                "sync_manifest": manifest
            })
        }
    except Exception as exc:
        print(f"Error in sync_guidelines_handler: {exc}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "success": False,
                "error": f"Guideline synchronization failed: {str(exc)}"
            })
        }
