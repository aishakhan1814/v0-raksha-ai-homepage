import sys
import os
import json
import time
import unittest
from unittest.mock import patch, MagicMock
import numpy as np

# Add backend and scratch lib paths
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
scratch_lib = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "scratch", "lib"))
if os.path.exists(scratch_lib) and scratch_lib not in sys.path:
    sys.path.insert(0, scratch_lib)

from guidelines_engine import get_guidelines_engine, ClinicalGuidelinesEngine
from rag_query import rag_query_handler
from sync_guidelines import sync_guidelines_handler

class TestClinicalGuidelinesRAG(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = get_guidelines_engine()
        cls.api_key = "test-rag-synthetic-key"
        os.environ["RAKSHAI_ML_API_KEY"] = cls.api_key

    @classmethod
    def tearDownClass(cls):
        os.environ.pop("RAKSHAI_ML_API_KEY", None)

    # 1. Corpus integrity tests
    def test_01_corpus_ingestion_counts(self):
        """Verify correct number of approved documents and chunks are indexed."""
        self.assertEqual(len(self.engine.documents), 3, "Expected exactly 3 approved guideline documents.")
        self.assertEqual(len(self.engine.chunks), 11, "Expected exactly 11 structured sections/chunks.")

    def test_02_chunk_metadata_completeness(self):
        """Verify all chunks have complete source metadata (doc title, org, version, page, section)."""
        for chunk in self.engine.chunks:
            self.assertTrue(chunk["document_title"], "Missing document title.")
            self.assertTrue(chunk["issuing_organization"], "Missing issuing organization.")
            self.assertTrue(chunk["version"], "Missing version.")
            self.assertTrue(chunk["section_id"], "Missing section ID.")
            self.assertTrue(chunk["section_title"], "Missing section title.")
            self.assertGreater(chunk["page"], 0, "Invalid page number.")
            self.assertTrue(chunk["content_hash"], "Missing SHA-256 content hash.")

    # 2. 24 Representative Coordinator Evaluation Questions
    def test_03_execute_24_coordinator_evaluation_suite(self):
        """
        Executes a 24-question clinical evaluation suite:
        - 22 domain-specific queries on Thalassemia, transfusion, and blood banking
        - 2 out-of-domain queries to test abstention behavior
        Measures retrieval success, citation accuracy, abstention rate, and latencies.
        """
        eval_cases = [
            # Group 1: Thalassemia Care & Regimens
            {"q": "What is the pre-transfusion hemoglobin target for Thalassemia Major?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-2.1", "should_answer": True},
            {"q": "How often should transfusions be scheduled for Beta-Thalassemia Major?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-2.1", "should_answer": True},
            {"q": "When should iron chelation therapy with Deferasirox be initiated?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-5.2", "should_answer": True},
            {"q": "How often should serum ferritin be monitored in Thalassemia patients?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-5.2", "should_answer": True},
            {"q": "What are the first-line oral iron chelators and their dosages?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-5.2", "should_answer": True},
            {"q": "Why is extended red cell phenotyping necessary before the first transfusion?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-3.4", "should_answer": True},
            {"q": "Which minor antigens must be matched to prevent alloimmunization?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-3.4", "should_answer": True},
            {"q": "What blood component specifications are required regarding leukoreduction?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-4.1", "should_answer": True},
            {"q": "What is the maximum recommended age of red blood cells for Thalassemia transfusions?", "expected_doc": "IAP-NTWS-THAL-2021", "expected_sec": "SEC-4.1", "should_answer": True},

            # Group 2: National Blood Transfusion Standards & Donors
            {"q": "What is the minimum whole blood donation interval for female donors?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-4.2", "should_answer": True},
            {"q": "What is the minimum donation interval for male whole blood donors?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-4.2", "should_answer": True},
            {"q": "What are the minimum weight and hemoglobin requirements for blood donors?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-4.2", "should_answer": True},
            {"q": "How must ABO and RhD blood grouping be performed?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-5.1", "should_answer": True},
            {"q": "What protocol applies when weak D (Du) is suspected in a donor?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-5.1", "should_answer": True},
            {"q": "What is the emergency uncrossmatched blood release protocol?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-5.7", "should_answer": True},
            {"q": "When can O-Positive blood be used in emergency uncrossmatched release?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-5.7", "should_answer": True},
            {"q": "What is the immediate action required during an acute transfusion reaction?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-6.3", "should_answer": True},
            {"q": "To which organization must acute adverse transfusion reactions be reported in India?", "expected_doc": "NBTC-DGHS-BTS-2022", "expected_sec": "SEC-6.3", "should_answer": True},

            # Group 3: Immunohematology & Complex Antibodies (AABB Standards)
            {"q": "What cross-match method is required when a patient has documented alloantibodies?", "expected_doc": "AABB-TM-ANTIGEN-2020", "expected_sec": "SEC-14.3", "should_answer": True},
            {"q": "What are the indications for irradiated blood components?", "expected_doc": "AABB-TM-ANTIGEN-2020", "expected_sec": "SEC-15.1", "should_answer": True},
            {"q": "What are the clinical indications for washed red blood cells?", "expected_doc": "AABB-TM-ANTIGEN-2020", "expected_sec": "SEC-15.1", "should_answer": True},
            {"q": "What is the protocol for delayed hemolytic transfusion reaction and hyperhemolysis?", "expected_doc": "AABB-TM-ANTIGEN-2020", "expected_sec": "SEC-16.2", "should_answer": True},

            # Group 4: Out-of-Domain Questions (Mandatory Abstention)
            {"q": "What is the surgical protocol for laparoscopic cholecystectomy?", "expected_doc": None, "expected_sec": None, "should_answer": False},
            {"q": "What chemotherapy regimen is recommended for stage IV lung adenocarcinoma?", "expected_doc": None, "expected_sec": None, "should_answer": False}
        ]

        latencies = []
        retrieval_successes = 0
        citation_correctness = 0
        abstentions_correct = 0

        print(f"\n--- Executing {len(eval_cases)} RAG Evaluation Cases ---")
        for idx, case in enumerate(eval_cases):
            t0 = time.perf_counter()
            res = self.engine.query(case["q"], top_k=3, min_score_threshold=0.25)
            dt_ms = (time.perf_counter() - t0) * 1000.0
            latencies.append(dt_ms)

            if case["should_answer"]:
                self.assertEqual(res["status"], "ANSWERED_GROUNDED", f"Case {idx+1} failed to answer grounded query: {case['q']}")
                self.assertGreater(len(res["citations"]), 0, f"Case {idx+1} missing citations.")
                retrieval_successes += 1

                # Verify citation matches expected document or section
                found_match = any(
                    (case["expected_doc"] and case["expected_doc"] in c["document_title"]) or
                    (case["expected_sec"] and case["expected_sec"] in c["section"])
                    for c in res["citations"]
                )
                if found_match:
                    citation_correctness += 1
            else:
                # Expect abstention
                self.assertEqual(res["status"], "ABSTAINED_NO_CONTEXT", f"Case {idx+1} should have abstained: {case['q']}")
                self.assertEqual(len(res["citations"]), 0, "Abstained query should return 0 citations.")
                abstentions_correct += 1

        # Summary statistics
        in_domain_total = sum(1 for c in eval_cases if c["should_answer"])
        out_domain_total = sum(1 for c in eval_cases if not c["should_answer"])

        ret_rate = (retrieval_successes / in_domain_total) * 100.0
        cit_rate = (citation_correctness / in_domain_total) * 100.0
        abs_rate = (abstentions_correct / out_domain_total) * 100.0

        p50 = float(np.median(latencies))
        p95 = float(np.percentile(latencies, 95))
        mean_lat = float(np.mean(latencies))

        print(f"Total Evaluation Questions: {len(eval_cases)}")
        print(f"Retrieval Success Rate: {ret_rate:.1f}% ({retrieval_successes}/{in_domain_total})")
        print(f"Citation Correctness Rate: {cit_rate:.1f}% ({citation_correctness}/{in_domain_total})")
        print(f"Abstention Correctness Rate: {abs_rate:.1f}% ({abstentions_correct}/{out_domain_total})")
        print(f"Latency: Mean = {mean_lat:.2f} ms | P50 = {p50:.2f} ms | P95 = {p95:.2f} ms")

        self.assertGreaterEqual(ret_rate, 95.0, "Retrieval success rate below 95%.")
        self.assertGreaterEqual(cit_rate, 90.0, "Citation correctness below 90%.")
        self.assertEqual(abs_rate, 100.0, "Abstention correctness was not 100%.")

    # 3. Robustness & Safety Edge Cases
    def test_04_empty_and_whitespace_query(self):
        """Verify empty and whitespace queries fail validation safely."""
        res_empty = self.engine.query("")
        self.assertEqual(res_empty["status"], "INVALID_INPUT")
        self.assertEqual(len(res_empty["citations"]), 0)

        res_spaces = self.engine.query("     ")
        self.assertEqual(res_spaces["status"], "INVALID_INPUT")

    def test_05_gibberish_query_abstention(self):
        """Verify random characters abstain cleanly."""
        res = self.engine.query("xyzqwerty1234567890 nonexistingterm")
        self.assertEqual(res["status"], "ABSTAINED_NO_CONTEXT")
        self.assertIn("sufficient clinical guidance", res["answer"])
        self.assertEqual(len(res["citations"]), 0)

    def test_06_clinical_disclaimer_present(self):
        """Verify mandatory clinical safety disclaimer is attached to every response."""
        res = self.engine.query("What is the pre-transfusion hemoglobin target?")
        self.assertTrue(res["disclaimer"])
        self.assertIn("DISCLAIMER", res["disclaimer"])
        self.assertIn("decision support only", res["disclaimer"])

    # 4. Lambda & API Integration Tests
    def test_07_rag_query_lambda_authorized(self):
        """Test rag_query_handler with valid API key."""
        event = {
            "headers": {"X-API-Key": self.api_key},
            "body": json.dumps({"query": "What is the female whole blood donation interval?"})
        }
        resp = rag_query_handler(event, None)
        self.assertEqual(resp["statusCode"], 200)
        body = json.loads(resp["body"])
        self.assertTrue(body["success"])
        self.assertEqual(body["status"], "ANSWERED_GROUNDED")
        self.assertGreater(len(body["citations"]), 0)

    def test_08_rag_query_lambda_unauthorized(self):
        """Test rag_query_handler fails closed with 401 when key is invalid."""
        event = {
            "headers": {"X-API-Key": "wrong-key"},
            "body": json.dumps({"query": "Any query"})
        }
        resp = rag_query_handler(event, None)
        self.assertEqual(resp["statusCode"], 401)

    def test_09_sync_guidelines_lambda_idempotency(self):
        """Test sync_guidelines_handler runs idempotently and produces valid manifest."""
        resp = sync_guidelines_handler({}, None)
        self.assertEqual(resp["statusCode"], 200)
        data = json.loads(resp["body"])
        self.assertTrue(data["success"])
        manifest = data["sync_manifest"]
        self.assertEqual(manifest["total_documents"], 3)
        self.assertEqual(manifest["total_chunks"], 11)
        for doc in manifest["documents"]:
            self.assertEqual(doc["sync_status"], "INDEXED_UP_TO_DATE")
            self.assertTrue(doc["composite_sha256"])

    # 5. AWS Bedrock & CloudWatch Integration Tests (Task 22 Requirements)
    def test_10_bedrock_live_credential_blocker_detection(self):
        """
        Verify live Bedrock runtime invocation properly detects missing AWS credentials,
        captures exact error details, sets bedrock_status='CREDENTIALS_UNAVAILABLE',
        and falls back cleanly to local grounded synthesis without crashing.
        """
        res = self.engine.query("What is the pre-transfusion hemoglobin target for Thalassemia Major?")
        self.assertTrue(res["success"])
        self.assertEqual(res["status"], "ANSWERED_GROUNDED")
        self.assertIn("bedrock_metadata", res)
        bm = res["bedrock_metadata"]
        self.assertTrue(bm["attempted"], "Bedrock invocation should be attempted.")
        self.assertIn("CREDENTIALS_UNAVAILABLE", bm["status"], "Should detect missing credentials.")
        self.assertIn("NoCredentialsError", bm["error"])
        self.assertEqual(res["generation_mode"], "LOCAL_GROUNDED_SYNTHESIS")

    def test_11_bedrock_mocked_claude_generation_success(self):
        """
        Verify that when AWS Bedrock returns a successful Claude response,
        the answer is updated to the Bedrock generation, generation_mode is 'AWS_BEDROCK_GENERATION',
        and citations remain strictly tied to the verified BM25 retrieved metadata.
        """
        mock_response_body = json.dumps({
            "id": "msg_12345",
            "type": "message",
            "role": "assistant",
            "content": [{"type": "text", "text": "According to IAP 2021 guidelines, the pre-transfusion hemoglobin target is 9.5-10.5 g/dL."}],
            "usage": {"input_tokens": 150, "output_tokens": 30}
        }).encode("utf-8")

        mock_body_stream = MagicMock()
        mock_body_stream.read.return_value = mock_response_body

        mock_client = MagicMock()
        mock_client.invoke_model.return_value = {"body": mock_body_stream}

        with patch.dict(os.environ, {"AWS_ACCESS_KEY_ID": "mock-test-key", "AWS_SECRET_ACCESS_KEY": "mock-secret"}):
            with patch("boto3.client", return_value=mock_client):
                res = self.engine.query(
                    "What is the pre-transfusion hemoglobin target for Thalassemia Major?",
                    model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"
                )
                self.assertTrue(res["success"])
                self.assertEqual(res["status"], "ANSWERED_GROUNDED")
                self.assertEqual(res["generation_mode"], "AWS_BEDROCK_GENERATION")
                self.assertIn("9.5-10.5 g/dL", res["answer"])
                self.assertEqual(res["bedrock_metadata"]["status"], "SUCCESS")
                self.assertIn("anthropic.claude-3-5-sonnet-20241022-v2:0", res["bedrock_metadata"]["model_id"])
                # Verify citations are intact and cannot be altered by LLM
                self.assertGreater(len(res["citations"]), 0)
                self.assertIn("Thalassemia", res["citations"][0]["document_title"])

    def test_12_bedrock_abstention_never_invokes_bedrock(self):
        """
        Verify that out-of-domain queries abstain at retrieval stage
        and NEVER call Bedrock (preventing hallucination and saving API cost).
        """
        with patch.object(self.engine, "invoke_bedrock_generation") as mock_invoke:
            res = self.engine.query("What is the surgical resection protocol for pancreatic adenocarcinoma?")
            self.assertEqual(res["status"], "ABSTAINED_NO_CONTEXT")
            mock_invoke.assert_not_called()
            self.assertEqual(res["bedrock_metadata"]["status"], "SKIPPED_ABSTAINED")

    def test_13_cloudwatch_metrics_emission(self):
        """Verify emit_cloudwatch_metrics runs safely without unhandled exceptions."""
        result = self.engine.emit_cloudwatch_metrics({
            "RetrievalLatency": 0.25,
            "CitationsGenerated": 2,
            "AbstentionCount": 0
        })
        self.assertIn("emitted", result)
        self.assertIn("error", result)

    def test_14_s3_sync_attempt_reporting(self):
        """Verify sync_manifest records S3 synchronization status safely."""
        manifest = self.engine.sync_manifest(s3_bucket="raksha-clinical-guidelines-dev")
        self.assertTrue(manifest["s3_sync"]["attempted"])
        self.assertIn(manifest["s3_sync"]["status"], ["SUCCESS", "FAILED"])

if __name__ == "__main__":
    unittest.main()
