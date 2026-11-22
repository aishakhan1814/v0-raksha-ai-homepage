import json
import os
import sys

# Ensure local backend packages and app can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guidelines_engine import get_guidelines_engine

def rag_query_handler(event, context):
    """
    AWS Lambda entry point for /rag/query endpoint.
    Handles coordinator question, retrieves verified guideline context,
    synthesizes grounded response with full citations, and abstains when ungrounded.
    """
    try:
        # 1. Parse body from API Gateway event or direct invocation
        if isinstance(event, dict) and "body" in event:
            body_raw = event.get("body")
            body = json.loads(body_raw) if isinstance(body_raw, str) else (body_raw or {})
            headers = event.get("headers") or {}
        elif isinstance(event, dict):
            body = event
            headers = {}
        else:
            body = {}
            headers = {}

        # 2. Authentication check: Verify coordinator authorization or internal API key
        expected_api_key = os.environ.get("RAKSHAI_ML_API_KEY", "")
        req_api_key = headers.get("x-api-key") or headers.get("X-API-Key") or body.get("api_key")

        # In production, require API key or coordinator JWT claim
        if expected_api_key and req_api_key != expected_api_key:
            return {
                "statusCode": 401,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization"
                },
                "body": json.dumps({
                    "success": False,
                    "error": "Unauthorized: Coordinator authorization or valid API key required."
                })
            }

        # 3. Extract query parameters
        query_text = body.get("query", "").strip()
        top_k = int(body.get("top_k", 3))
        min_threshold = float(body.get("min_score_threshold", 0.25))

        # Check for empty query
        if not query_text:
            return {
                "statusCode": 400,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps({
                    "success": False,
                    "error": "Query string is required and cannot be empty."
                })
            }

        # 4. Execute RAG query against Guidelines Engine
        engine = get_guidelines_engine()
        result = engine.query(query_text=query_text, top_k=top_k, min_score_threshold=min_threshold)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization"
            },
            "body": json.dumps(result)
        }

    except Exception as exc:
        print(f"Error in rag_query_handler: {exc}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "success": False,
                "error": f"RAG query execution failed: {str(exc)}"
            })
        }
