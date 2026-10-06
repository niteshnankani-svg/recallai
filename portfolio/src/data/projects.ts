// ---------------------------------------------------------------------------
// Data-file separation (adapted from the reference portfolio's src/data pattern):
// edit project details here WITHOUT touching components. `pipeline` powers the
// animated architecture diagram that lights up on hover.
//
// Nine systems built end-to-end; the six flagged `production: true` are live.
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  title: string;
  blurb: string;
  /** Ordered pipeline nodes — rendered as the flowing architecture diagram. */
  pipeline: string[];
  /** Primary click-through — live demo or source. */
  link: string;
  /** Optional secondary link (source). */
  github?: string;
  /** Whether the system is live in production (vs. built/evaluated). */
  production?: boolean;
}

export const projects: Project[] = [
  {
    id: "recallai",
    title: "RecallAI",
    blurb:
      "A phone-based wellness companion that calls, listens for how you feel, and remembers — with Hindi support.",
    pipeline: [
      "Twilio call",
      "Deepgram STT",
      "BERT emotion",
      "ChromaDB memory",
      "Claude",
      "ElevenLabs · Sarvam (Hindi)",
    ],
    link: "https://frontend-rouge-six-10.vercel.app",
    github: "https://github.com/niteshnankani-svg/recallai",
    production: true,
  },
  {
    id: "multi-agent-support",
    title: "Multi-Agent Customer Support Platform",
    blurb:
      "Classifies support tickets and routes them to department agents, with human escalation — deployed full-stack on AWS.",
    pipeline: [
      "LangGraph supervisor-router",
      "DistilBERT vs Jev routing",
      "interrupt() human escalation",
      "Amazon Bedrock · Claude",
      "ECS Fargate · EC2",
      "S3 + CloudFront",
    ],
    link: "https://github.com/niteshnankani-svg/Multi_agent_ticketing_system",
    github: "https://github.com/niteshnankani-svg/Multi_agent_ticketing_system",
    production: true,
  },
  {
    id: "bargainai",
    title: "BargainAI",
    blurb:
      "A Hinglish bargaining agent that negotiates abandoned carts like a real shopkeeper — with hard price guardrails.",
    pipeline: [
      "MuRIL intent · 51K reviews",
      "PageIndex over 10 books",
      "price floor + regex guardrail",
      "two-stage close detect",
      "Shopify discount code",
    ],
    link: "https://bargainai-demo.vercel.app",
    production: true,
  },
  {
    id: "niryatai",
    title: "NiryatAI",
    blurb:
      "Export intelligence for Indian businesses — real trade data, HS codes, and schemes, replacing 5+ government portals.",
    pipeline: [
      "114 files · ~20k chunks",
      "UN Comtrade + DGFT",
      "multimodal RAG",
      "Whisper audio queries",
      "Apify buyer leads · 41 countries",
    ],
    link: "https://niryat-ai-frontend.vercel.app",
    production: true,
  },
  {
    id: "legal-rag",
    title: "Legal RAG Chatbot",
    blurb:
      "Answers questions on Indian law (BNS, BNSS, BSA, DPDP Act) from the statutes themselves — 0.97 faithfulness, not guesswork.",
    pipeline: [
      "Act router",
      "PageIndex retrieval",
      "BERT re-ranker",
      "GPT-4o",
      "37-case DeepEval · 0.97 faithfulness",
    ],
    link: "https://web-mocha-seven-1bs97919gq.vercel.app",
    production: true,
  },
  {
    id: "complaint-intelligence",
    title: "AI Complaint Intelligence Agent",
    blurb:
      "Seven fine-tuned classifiers and a four-agent CrewAI pipeline turn raw customer reviews into prioritized business intelligence.",
    pipeline: [
      "7 fine-tuned BERT classifiers",
      "4-agent CrewAI pipeline",
      "8-part DeepEval readiness",
    ],
    link: "https://huggingface.co/spaces/nitz0219",
    production: true,
  },
  {
    id: "dependency-rescue",
    title: "Dependency Rescue",
    blurb:
      "A LangGraph agent that repairs broken dependency upgrades in a sandbox and stops at a human-approval gate with a reviewable diff.",
    pipeline: [
      "sandboxed repro",
      "atomic fix proposal",
      "test-suite rerun",
      "human-approval gate",
      "DepBench · pass@3",
    ],
    link: "https://github.com/niteshnankani-svg",
    github: "https://github.com/niteshnankani-svg",
  },
  {
    id: "hr-people-analytics",
    title: "HR People-Analytics Agent",
    blurb:
      "A text-to-SQL agent that answers an HR team's ad-hoc questions — benchmarked Claude Haiku against a fine-tuned Qwen 0.5B.",
    pipeline: [
      "text-to-SQL",
      "Claude Haiku · 73%",
      "Qwen 0.5B baseline · 47%",
      "prompt-injection guardrail",
    ],
    link: "https://github.com/niteshnankani-svg",
    github: "https://github.com/niteshnankani-svg",
  },
  {
    id: "company-architecture",
    title: "Multi-Agent Company Architecture",
    blurb:
      "Unifies the systems above as department agents under one orchestrator, with a verifier that checks grounding before it responds.",
    pipeline: [
      "LangGraph orchestrator",
      "Finance · HR · Ticketing · Export · Legal",
      "grounding verifier",
      "human escalation",
    ],
    link: "https://github.com/niteshnankani-svg",
    github: "https://github.com/niteshnankani-svg",
  },
];
