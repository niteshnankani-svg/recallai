// Core-skill categories (from the résumé). Edit freely — the Skills grid
// renders straight from this list.
export interface SkillGroup {
  title: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages",
    items: ["Python", "SQL"],
  },
  {
    title: "Agent & LLM Frameworks",
    items: [
      "LangGraph (supervisor-router)",
      "interrupt() escalation",
      "checkpointing",
      "CrewAI",
      "PageIndex",
      "PipeCat",
    ],
  },
  {
    title: "Models",
    items: [
      "Claude (Sonnet · Haiku · Bedrock)",
      "GPT-4o",
      "BERT / DistilBERT (fine-tuned)",
      "MuRIL (multilingual intent)",
      "Qwen 0.5B (fine-tuned)",
      "Jev (hosted classifier)",
    ],
  },
  {
    title: "Retrieval & Storage",
    items: [
      "ChromaDB",
      "BERT re-ranking",
      "PageIndex (hierarchical)",
      "SQLite",
      "semantic caching",
    ],
  },
  {
    title: "Evaluation & Safety",
    items: [
      "DeepEval",
      "golden test sets",
      "LLM-as-judge",
      "macro-F1 · latency · pass@k",
      "label-quality audits",
      "prompt-injection testing",
      "output guardrails",
    ],
  },
  {
    title: "Cloud & Deployment",
    items: [
      "AWS (ECS Fargate · EC2 · S3 · CloudFront · Bedrock)",
      "Azure",
      "Railway",
      "Vercel",
      "HuggingFace Spaces",
    ],
  },
  {
    title: "Integrations & APIs",
    items: [
      "Twilio",
      "Deepgram",
      "ElevenLabs · Whisper",
      "Sarvam AI",
      "Shopify API & webhooks",
      "Apify · UN Comtrade",
      "REST (CSRF-token flows)",
    ],
  },
  {
    title: "Analytics",
    items: ["Power BI", "Tableau", "Shopify Analytics", "Meta Ads Manager"],
  },
];
