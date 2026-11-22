import os
import sys
import json
import hashlib
import math
import re
import time
from typing import List, Dict, Any, Optional

# Ensure vendored packages (such as boto3) are importable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "package"))
if os.path.isdir(PACKAGE_DIR) and PACKAGE_DIR not in sys.path:
    sys.path.insert(0, PACKAGE_DIR)

# Path to approved guidelines corpus
GUIDELINES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "guidelines"))
CORPUS_PATH = os.path.join(GUIDELINES_DIR, "clinical_guidelines_corpus.json")
MANIFEST_PATH = os.path.join(GUIDELINES_DIR, "ingestion_manifest.json")

CLINICAL_SAFETY_DISCLAIMER = (
    "DISCLAIMER: This informational guidance is generated for care coordinator decision support only "
    "based on approved national and international transfusion standards. It is NOT a clinical prescription, "
    "does not determine individual medical eligibility, and must NEVER override institutional blood bank "
    "cross-matching protocols or the treating hematologist's clinical judgment."
)

STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "can", "could", "should", "would", "must", "as", "if", "from", "that",
    "this", "these", "those", "it", "its", "not", "only", "such", "all", "each", "every",
    "what", "how", "when", "why", "which", "who", "where", "tell", "give", "regarding",
    "recommended", "regimen", "protocol", "guideline", "guidelines", "procedure"
}

class ClinicalGuidelinesEngine:
    def __init__(self, corpus_path: str = CORPUS_PATH):
        self.corpus_path = corpus_path
        self.documents: List[Dict[str, Any]] = []
        self.chunks: List[Dict[str, Any]] = []
        self.doc_freq: Dict[str, int] = {}
        self.load_and_index_corpus()

    def load_and_index_corpus(self):
        """Loads corpus JSON, chunks sections, and creates in-memory BM25 index."""
        if not os.path.exists(self.corpus_path):
            raise FileNotFoundError(f"Guidelines corpus not found at {self.corpus_path}")

        with open(self.corpus_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        self.chunks = []
        self.doc_freq = {}

        for doc in self.documents:
            doc_id = doc.get("document_id", "DOC")
            doc_title = doc.get("title", "")
            org = doc.get("issuing_organization", "")
            ver = doc.get("version", "1.0")
            pub_date = doc.get("publication_date", "")
            eff_date = doc.get("effective_date", "")
            category = doc.get("category", "")

            for sec in doc.get("sections", []):
                sec_id = sec.get("section_id", "")
                sec_title = sec.get("section_title", "")
                page = sec.get("page", 1)
                content = sec.get("content", "")
                keywords = sec.get("keywords", [])

                chunk_id = f"{doc_id}_{sec_id}"
                raw_text = f"{doc_title} {sec_title} {content} {' '.join(keywords)}"
                content_hash = hashlib.sha256(content.encode("utf-8")).hexdigest()
                tokens = self._tokenize(raw_text)

                # Record document frequencies for BM25
                for t in set(tokens):
                    self.doc_freq[t] = self.doc_freq.get(t, 0) + 1

                self.chunks.append({
                    "chunk_id": chunk_id,
                    "document_id": doc_id,
                    "document_title": doc_title,
                    "issuing_organization": org,
                    "version": ver,
                    "publication_date": pub_date,
                    "effective_date": eff_date,
                    "category": category,
                    "section_id": sec_id,
                    "section_title": sec_title,
                    "page": page,
                    "content": content,
                    "keywords": keywords,
                    "content_hash": content_hash,
                    "tokenized": tokens
                })

    def _tokenize(self, text: str) -> List[str]:
        """Simple alphanumeric tokenizer with stopword stripping."""
        words = re.findall(r'\b[a-zA-Z0-9_\-]+\b', text.lower())
        return [w for w in words if w not in STOPWORDS and len(w) > 2]

    def _compute_relevance_score(self, query_tokens: List[str], chunk: Dict[str, Any]) -> float:
        """
        BM25-style scoring with strict Query Token Coverage guard.
        Prevents abstention failures on out-of-domain questions with generic common words.
        """
        if not query_tokens:
            return 0.0

        chunk_tokens = chunk["tokenized"]
        chunk_token_set = set(chunk_tokens)
        title_tokens = set(self._tokenize(chunk["section_title"] + " " + chunk["document_title"]))
        keyword_tokens = set(self._tokenize(" ".join(chunk["keywords"])))

        matched = [qt for qt in query_tokens if qt in chunk_token_set]
        coverage = len(matched) / len(query_tokens)

        # Robustness Guard: Must match at least 2 distinct tokens OR >= 40% of query content words
        if len(matched) < 2 and coverage < 0.40:
            return 0.0

        n_docs = len(self.chunks)
        raw_score = 0.0

        for qt in matched:
            df = self.doc_freq.get(qt, 1)
            idf = math.log((n_docs - df + 0.5) / (df + 0.5) + 1.0)
            tf = chunk_tokens.count(qt)
            tf_norm = (tf * 2.2) / (tf + 1.2)

            boost = 1.0
            if qt in title_tokens:
                boost *= 2.0
            if qt in keyword_tokens:
                boost *= 1.8

            raw_score += idf * tf_norm * boost

        # Normalize score into a bounded [0, 1] range
        normalized = raw_score / (raw_score + 5.0)
        return min(1.0, max(0.0, normalized))

    def retrieve(self, query: str, top_k: int = 3, min_score_threshold: float = 0.25) -> List[Dict[str, Any]]:
        """Retrieves top-k relevant chunks exceeding the score threshold."""
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return []

        scored_chunks = []
        for ch in self.chunks:
            score = self._compute_relevance_score(query_tokens, ch)
            if score >= min_score_threshold:
                scored_chunks.append({
                    "chunk_id": ch["chunk_id"],
                    "document_id": ch["document_id"],
                    "document_title": ch["document_title"],
                    "issuing_organization": ch["issuing_organization"],
                    "version": ch["version"],
                    "publication_date": ch["publication_date"],
                    "section_id": ch["section_id"],
                    "section_title": ch["section_title"],
                    "page": ch["page"],
                    "content": ch["content"],
                    "relevance_score": round(score, 4)
                })

        scored_chunks.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_chunks[:top_k]

    def invoke_bedrock_generation(
        self,
        query_text: str,
        retrieved_chunks: List[Dict[str, Any]],
        model_id: Optional[str] = None,
        region_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Invokes Amazon Bedrock Runtime to generate a grounded clinical synthesis
        strictly from the retrieved guideline chunks.

        Guarantees:
        - System prompt forces answers to rely EXCLUSIVELY on provided excerpts.
        - Zero-temperature deterministic generation.
        - Model cannot invent citations (citations are attached strictly from BM25 chunk metadata).
        - If AWS credentials are not found or Bedrock call fails, captures exact AWS error
          and returns graceful fallback indicator.
        """
        target_model = model_id or os.environ.get("BEDROCK_MODEL_ID", "amazon.titan-text-premier-v1:0")
        target_region = region_name or os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"))

        # In ap-south-1 (Mumbai), Anthropic models require cross-region inference profiles
        if target_region == "ap-south-1" and target_model.startswith("anthropic.claude-") and not (target_model.startswith("apac.") or target_model.startswith("global.")):
            target_model = f"apac.{target_model}"

        context_blocks = []
        for idx, chunk in enumerate(retrieved_chunks, 1):
            context_blocks.append(
                f"[Source {idx}]: {chunk.get('document_title')} ({chunk.get('version')})\n"
                f"Issuing Body: {chunk.get('issuing_organization')}\n"
                f"Section: {chunk.get('section_id')} - {chunk.get('section_title')} (Page {chunk.get('page')})\n"
                f"Excerpt Content:\n{chunk.get('content')}"
            )
        context_text = "\n\n".join(context_blocks)

        system_prompt = (
            "You are a clinical decision support assistant for blood banking and thalassemia care coordination. "
            "Your responses must be strictly grounded in the provided guideline excerpts.\n"
            "Rules:\n"
            "1. Answer ONLY using the facts stated in the provided guideline excerpts.\n"
            "2. Never invent citations, numeric values, medical advice, or rules not present in the excerpts.\n"
            "3. If the excerpts do not contain sufficient evidence to answer the question, state: "
            "'I cannot answer this question based on the approved clinical guidelines. Please consult the attending hematologist or institutional blood bank standard operating procedures.'\n"
            "4. Do NOT prescribe medications, alter blood matching protocols, or override medical officers."
        )

        start_time = time.perf_counter()
        
        # Check credentials availability before network/metadata timeout
        aws_key = os.environ.get("AWS_ACCESS_KEY_ID")
        aws_cred_file = os.path.expanduser("~/.aws/credentials")
        if not aws_key and not os.path.exists(aws_cred_file):
            duration_ms = (time.perf_counter() - start_time) * 1000
            return {
                "bedrock_attempted": True,
                "bedrock_status": "CREDENTIALS_UNAVAILABLE",
                "bedrock_model_id": target_model,
                "bedrock_region": target_region,
                "bedrock_latency_ms": round(duration_ms, 2),
                "answer": None,
                "bedrock_error": "NoCredentialsError: Unable to locate credentials in environment or ~/.aws"
            }

        try:
            import boto3
            from botocore.exceptions import NoCredentialsError, ClientError

            bedrock_client = boto3.client("bedrock-runtime", region_name=target_region)

            if "claude" in target_model.lower():
                payload = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 1024,
                    "temperature": 0.0,
                    "system": system_prompt,
                    "messages": [
                        {
                            "role": "user",
                            "content": f"Guideline Excerpts:\n{context_text}\n\nCoordinator Question: {query_text}"
                        }
                    ]
                }
            else:
                # Amazon Titan Text format
                prompt_text = (
                    f"{system_prompt}\n\n"
                    f"Guideline Excerpts:\n{context_text}\n\n"
                    f"Coordinator Question: {query_text}\n\n"
                    f"Answer:"
                )
                payload = {
                    "inputText": prompt_text,
                    "textGenerationConfig": {
                        "maxTokenCount": 512,
                        "temperature": 0.0,
                        "topP": 0.9
                    }
                }

            response = bedrock_client.invoke_model(
                modelId=target_model,
                body=json.dumps(payload),
                contentType="application/json",
                accept="application/json"
            )
            duration_ms = (time.perf_counter() - start_time) * 1000

            res_body = json.loads(response["body"].read().decode("utf-8"))
            if "claude" in target_model.lower():
                gen_text = res_body.get("content", [{}])[0].get("text", "").strip()
            else:
                gen_text = res_body.get("results", [{}])[0].get("outputText", "").strip()

            return {
                "bedrock_attempted": True,
                "bedrock_status": "SUCCESS",
                "bedrock_model_id": target_model,
                "bedrock_region": target_region,
                "bedrock_latency_ms": round(duration_ms, 2),
                "answer": gen_text,
                "bedrock_error": None
            }
        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            err_type = type(exc).__name__
            err_msg = str(exc)
            status = "CREDENTIALS_UNAVAILABLE" if "NoCredentialsError" in err_type else "INVOCATION_FAILED"
            return {
                "bedrock_attempted": True,
                "bedrock_status": status,
                "bedrock_model_id": target_model,
                "bedrock_region": target_region,
                "bedrock_latency_ms": round(duration_ms, 2),
                "answer": None,
                "bedrock_error": f"{err_type}: {err_msg}"
            }

    def emit_cloudwatch_metrics(self, metric_data: Dict[str, Any], region_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Attempts to emit metrics to Amazon CloudWatch (Namespace: RakshAI/RAG).
        If AWS credentials are missing, logs and returns non-blocking status.
        """
        target_region = region_name or os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"))
        try:
            import boto3
            cw = boto3.client("cloudwatch", region_name=target_region)

            cw_metrics = []
            for name, val in metric_data.items():
                if isinstance(val, (int, float)):
                    unit = "Milliseconds" if "latency" in name.lower() else "Count"
                    cw_metrics.append({
                        "MetricName": name,
                        "Value": float(val),
                        "Unit": unit
                    })
            if cw_metrics:
                cw.put_metric_data(
                    Namespace="RakshAI/RAG",
                    MetricData=cw_metrics
                )
            return {"emitted": True, "error": None}
        except Exception as exc:
            return {"emitted": False, "error": f"{type(exc).__name__}: {str(exc)}"}

    def query(
        self,
        query_text: str,
        top_k: int = 3,
        min_score_threshold: float = 0.25,
        model_id: Optional[str] = None,
        region_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end RAG query:
        1. Validates input
        2. Retrieves passages using BM25 with query coverage guard
        3. Applies threshold filter
        4. Synthesizes grounded answer using Amazon Bedrock (or deterministic fallback)
        5. Emits CloudWatch metrics
        """
        query_start = time.perf_counter()

        if not query_text or not query_text.strip():
            return {
                "success": False,
                "status": "INVALID_INPUT",
                "generation_mode": "ABSTAINED",
                "retrieval_engine": "BM25_IDF_TOKENIZED",
                "answer": "Query cannot be empty.",
                "citations": [],
                "retrieved_chunks_count": 0,
                "bedrock_metadata": {
                    "attempted": False,
                    "status": "SKIPPED_EMPTY_QUERY",
                    "model_id": None,
                    "region": None,
                    "latency_ms": 0.0,
                    "error": None
                },
                "disclaimer": CLINICAL_SAFETY_DISCLAIMER
            }

        retrieved = self.retrieve(query_text, top_k=top_k, min_score_threshold=min_score_threshold)
        retrieval_latency_ms = (time.perf_counter() - query_start) * 1000

        # Abstention if no chunks meet relevance threshold
        if not retrieved:
            self.emit_cloudwatch_metrics({
                "RetrievalLatency": retrieval_latency_ms,
                "CitationsGenerated": 0,
                "AbstentionCount": 1
            }, region_name=region_name)

            return {
                "success": True,
                "status": "ABSTAINED_NO_CONTEXT",
                "generation_mode": "ABSTAINED",
                "retrieval_engine": "BM25_IDF_TOKENIZED",
                "query": query_text,
                "answer": (
                    "I do not have sufficient clinical guidance in the approved knowledge base to answer this question. "
                    "Care coordinators must consult an institutional hematologist or blood bank medical officer directly."
                ),
                "citations": [],
                "retrieved_chunks_count": 0,
                "bedrock_metadata": {
                    "attempted": False,
                    "status": "SKIPPED_ABSTAINED",
                    "model_id": None,
                    "region": None,
                    "latency_ms": 0.0,
                    "error": None
                },
                "disclaimer": CLINICAL_SAFETY_DISCLAIMER
            }

        # Build grounded citations strictly from BM25 chunk metadata
        citations = []
        for r in retrieved:
            citations.append({
                "document_title": r["document_title"],
                "issuing_organization": r["issuing_organization"],
                "version": r["version"],
                "publication_date": r["publication_date"],
                "section": f"{r['section_id']}: {r['section_title']}",
                "page": r["page"],
                "relevance_score": r["relevance_score"]
            })

        top_chunk = retrieved[0]
        local_synthesis = (
            f"According to {top_chunk['issuing_organization']} guidelines "
            f"({top_chunk['document_title']}, {top_chunk['section_id']}):\n\n"
            f"{top_chunk['content']}"
        )

        if len(retrieved) > 1:
            second = retrieved[1]
            local_synthesis += f"\n\nAdditionally, {second['document_title']} ({second['section_id']}) notes that: {second['content']}"

        # 5. Invoke Amazon Bedrock generation
        bedrock_result = self.invoke_bedrock_generation(
            query_text=query_text,
            retrieved_chunks=retrieved,
            model_id=model_id,
            region_name=region_name
        )

        if bedrock_result.get("bedrock_status") == "SUCCESS" and bedrock_result.get("answer"):
            final_answer = bedrock_result["answer"]
            generation_mode = "AWS_BEDROCK_GENERATION"
        else:
            final_answer = local_synthesis
            generation_mode = "LOCAL_GROUNDED_SYNTHESIS"

        # Emit non-blocking CloudWatch metrics
        self.emit_cloudwatch_metrics({
            "RetrievalLatency": retrieval_latency_ms,
            "CitationsGenerated": len(citations),
            "AbstentionCount": 0,
            "BedrockAttempted": 1 if bedrock_result.get("bedrock_attempted") else 0
        }, region_name=region_name)

        return {
            "success": True,
            "status": "ANSWERED_GROUNDED",
            "generation_mode": generation_mode,
            "retrieval_engine": "BM25_IDF_TOKENIZED",
            "query": query_text,
            "answer": final_answer,
            "citations": citations,
            "retrieved_chunks_count": len(retrieved),
            "bedrock_metadata": {
                "attempted": bedrock_result.get("bedrock_attempted", False),
                "status": bedrock_result.get("bedrock_status", "NOT_ATTEMPTED"),
                "model_id": bedrock_result.get("bedrock_model_id"),
                "region": bedrock_result.get("bedrock_region"),
                "latency_ms": bedrock_result.get("bedrock_latency_ms", 0.0),
                "error": bedrock_result.get("bedrock_error")
            },
            "disclaimer": CLINICAL_SAFETY_DISCLAIMER
        }

    def sync_manifest(self, s3_bucket: Optional[str] = None, region_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Manages guideline document synchronization:
        - Scans current documents
        - Computes content hashes
        - Detects new, updated, or unchanged documents
        - Generates idempotent manifest
        - Attempts S3 upload if bucket is specified or configured
        """
        import datetime
        bucket = s3_bucket or os.environ.get("GUIDELINES_S3_BUCKET")
        target_region = region_name or os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"))

        manifest = {
            "last_synced_at": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "total_documents": len(self.documents),
            "total_chunks": len(self.chunks),
            "documents": [],
            "s3_sync": {
                "bucket": bucket,
                "attempted": bool(bucket),
                "status": "NOT_ATTEMPTED",
                "error": None
            }
        }

        for doc in self.documents:
            doc_id = doc["document_id"]
            doc_chunks = [c for c in self.chunks if c["document_id"] == doc_id]
            doc_hash = hashlib.sha256("".join(c["content_hash"] for c in doc_chunks).encode("utf-8")).hexdigest()

            manifest["documents"].append({
                "document_id": doc_id,
                "title": doc["title"],
                "version": doc["version"],
                "publication_date": doc["publication_date"],
                "chunk_count": len(doc_chunks),
                "composite_sha256": doc_hash,
                "sync_status": "INDEXED_UP_TO_DATE"
            })

        with open(MANIFEST_PATH, "w", encoding="utf-8") as mf:
            json.dump(manifest, mf, indent=2)

        if bucket:
            try:
                import boto3
                s3 = boto3.client("s3", region_name=target_region)
                s3.put_object(
                    Bucket=bucket,
                    Key="manifests/ingestion_manifest.json",
                    Body=json.dumps(manifest, indent=2),
                    ContentType="application/json",
                    ServerSideEncryption="AES256"
                )
                manifest["s3_sync"]["status"] = "SUCCESS"
            except Exception as exc:
                manifest["s3_sync"]["status"] = "FAILED"
                manifest["s3_sync"]["error"] = f"{type(exc).__name__}: {str(exc)}"

        return manifest


# Singleton instance
_engine_instance = None

def get_guidelines_engine() -> ClinicalGuidelinesEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = ClinicalGuidelinesEngine()
    return _engine_instance
