"use client";

import React, { useState } from "react";
import { BookOpen, Search, AlertTriangle, ShieldCheck, FileText, ChevronRight, Sparkles, HelpCircle } from "lucide-react";

interface Citation {
  document_title: string;
  issuing_organization: string;
  version: string;
  publication_date: string;
  section: string;
  page: number;
  relevance_score: number;
}

interface RagResponse {
  success: boolean;
  status: string;
  generation_mode?: string;
  retrieval_engine?: string;
  query?: string;
  answer: string;
  citations: Citation[];
  retrieved_chunks_count: number;
  bedrock_metadata?: {
    attempted: boolean;
    status: string;
    model_id?: string;
    region?: string;
    latency_ms?: number;
    error?: string;
  };
  disclaimer: string;
  error?: string;
}

const SAMPLE_QUESTIONS = [
  "What is the pre-transfusion hemoglobin target for Thalassemia Major?",
  "When should iron chelation therapy with Deferasirox be initiated?",
  "What is the minimum whole blood donation interval for female donors?",
  "What is the protocol for emergency release of uncrossmatched blood?",
  "How should acute adverse transfusion reactions be managed?",
  "What is the recommended treatment for pediatric appendicitis?" // Expect abstention
];

export default function ClinicalGuidelinesAssistant() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RagResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/rag/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim(), top_k: 3, min_score_threshold: 0.25 }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "RAG query failed.");
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Network error querying guidelines.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-raksha-navy/40 border border-raksha-teal/30 rounded-xl p-5 text-raksha-white space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-raksha-teal/20 pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-raksha-teal" />
          <h2 className="text-base font-semibold text-raksha-white">Clinical Guidelines Decision Support (RAG)</h2>
          <span className="text-[10px] bg-raksha-teal/20 text-raksha-teal px-2 py-0.5 rounded font-mono">
            AWS Bedrock Grounded
          </span>
        </div>
        <span className="text-xs text-raksha-muted">Official NBTC / DGHS / AABB Standards</span>
      </div>

      {/* Query Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-raksha-muted" />
          <input
            type="text"
            className="w-full bg-black/40 border border-raksha-teal/30 rounded-lg pl-9 pr-4 py-2 text-sm text-raksha-white placeholder-raksha-muted focus:outline-none focus:border-raksha-teal"
            placeholder="Ask a clinical transfusion guideline or Thalassemia care question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
          />
        </div>
        <button
          onClick={() => handleSearch(query)}
          disabled={loading || !query.trim()}
          className="bg-raksha-teal text-raksha-navy font-semibold px-4 py-2 rounded-lg text-sm hover:bg-raksha-teal/90 disabled:opacity-50 transition flex items-center gap-1.5 shrink-0"
        >
          {loading ? (
            <span>Retrieving...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Query RAG</span>
            </>
          )}
        </button>
      </div>

      {/* Sample Question Pills */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="text-raksha-muted text-[11px] self-center mr-1">Sample clinical queries:</span>
        {SAMPLE_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(q);
              handleSearch(q);
            }}
            className="bg-raksha-navy/60 hover:bg-raksha-teal/20 border border-raksha-teal/20 hover:border-raksha-teal/40 rounded px-2 py-1 text-[11px] text-raksha-white/80 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Error View */}
      {error && (
        <div className="p-3 bg-raksha-blood/15 border border-raksha-blood/40 rounded-lg text-xs text-raksha-blood flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Retrieval Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* RAG Answer Display */}
      {result && (
        <div className="space-y-3 bg-black/30 border border-raksha-teal/30 rounded-lg p-4 animate-fade-in">
          {/* Status Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span
              className={`text-xs px-2.5 py-0.5 rounded font-semibold flex items-center gap-1 ${
                result.status === "ANSWERED_GROUNDED"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              }`}
            >
              {result.status === "ANSWERED_GROUNDED" ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" /> Grounded in Verified Guidelines ({result.retrieved_chunks_count} source chunks)
                </>
              ) : (
                <>
                  <HelpCircle className="w-3.5 h-3.5" /> Abstention: Insufficient Clinical Context
                </>
              )}
            </span>

            {result.status === "ANSWERED_GROUNDED" && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-raksha-teal/10 text-raksha-teal border border-raksha-teal/30">
                {result.generation_mode === "AWS_BEDROCK_GENERATION"
                  ? `AWS Bedrock (${result.bedrock_metadata?.model_id || "LLM"})`
                  : "BM25 Grounded (AWS Bedrock Fallback)"}
              </span>
            )}
          </div>

          {/* Answer Body */}
          <div className="text-sm text-raksha-white leading-relaxed whitespace-pre-line bg-black/20 p-3 rounded border border-white/5 font-sans">
            {result.answer}
          </div>

          {/* Source Citations */}
          {result.citations && result.citations.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-raksha-teal/20">
              <span className="text-xs font-semibold text-raksha-teal flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Source Citations & References:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {result.citations.map((c, idx) => (
                  <div key={idx} className="bg-raksha-navy/60 border border-raksha-teal/20 p-2 rounded text-xs space-y-0.5">
                    <p className="font-semibold text-raksha-white truncate">{c.document_title}</p>
                    <p className="text-raksha-muted text-[11px] truncate">{c.issuing_organization}</p>
                    <div className="flex justify-between text-[11px] text-raksha-teal pt-0.5">
                      <span>{c.section} (Page {c.page})</span>
                      <span className="font-mono text-[10px] bg-raksha-teal/10 px-1 rounded">Score: {(c.relevance_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mandatory Clinical Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded text-[11px] text-amber-200/90 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
            <p>{result.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
