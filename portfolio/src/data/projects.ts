// ---------------------------------------------------------------------------
// Data-file separation (adapted from the reference portfolio's src/data pattern):
// edit project details here WITHOUT touching components. `pipeline` powers the
// animated architecture diagram that lights up on hover.
//
// Nine systems built end-to-end; the six flagged `production: true` are live.
// `details` powers the click-to-expand deep-dive modal.
// ---------------------------------------------------------------------------

export interface ProjectDetails {
  /** 1–2 sentence framing of the problem + approach. */
  overview: string;
  /** Meaty, metric-backed bullets (from the résumé). */
  highlights: string[];
}

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
  /** Deep-dive content for the expand modal. */
  details: ProjectDetails;
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
    details: {
      overview:
        "A phone-based wellness companion: you call in, it hears how you're feeling, recalls past conversations, and responds in your voice — in English or Hindi.",
      highlights: [
        "Full voice loop: Twilio → Deepgram STT → BERT emotion detection → ChromaDB retrieval over therapy books → Claude → ElevenLabs playback, with Hindi support via Sarvam AI.",
        "Traced distorted audio to ElevenLabs ignoring the requested output format and fixed it.",
        "Measured ~1–2 s sequential-API latency per turn; prototyping a PipeCat streaming pipeline to cut it.",
      ],
    },
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
    details: {
      overview:
        "A LangGraph supervisor-router that classifies support tickets and delegates them to specialist department agents, escalating to a human when it should — deployed full-stack on AWS.",
      highlights: [
        "Supervisor-router with interrupt()-based human escalation, SQLite checkpointing and semantic caching; deployed on AWS (ECS Fargate, EC2, S3, CloudFront, Bedrock).",
        "Benchmarked a fine-tuned DistilBERT router against Jev: DistilBERT led on macro-F1 (0.89 vs 0.56) and median latency (15 ms vs 354 ms), but an LLM-judge rated Jev's routing defensible 93% of the time vs 73%.",
        "Audited the training data — only 71% of ground-truth labels held up — switched production routing to Jev on the evidence, and caught a style shortcut with handwritten counter-example tickets.",
      ],
    },
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
    details: {
      overview:
        "Cart abandonment is often a wish to bargain. BargainAI replaces generic abandoned-cart discounts with shopkeeper-style Hinglish negotiation — and can't be talked into a loss.",
      highlights: [
        "A MuRIL intent classifier trained on 51,000 Flipkart reviews detects hesitation type (price, quality, comparison, fit) before PageIndex retrieval over 10 sales & negotiation books.",
        "Hardened for production with a fixed-price placeholder and regex guardrail so the LLM cannot invent prices.",
        "Shopify webhook deduplication, two-stage close detection, and single-use 24-hour discount codes.",
      ],
    },
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
    details: {
      overview:
        "One platform for Indian exporters — HS codes, government schemes, costing, documentation and buyer leads — replacing 5+ government and trade portals.",
      highlights: [
        "Multimodal RAG over 114 files (~20,000 chunks) answering exporters' questions; Whisper handles audio queries.",
        "Fixed data-integrity issues in the UN Comtrade pipeline with customs and transport-mode filters.",
        "Reverse-engineered DGFT TradeStat (no official API) via CSRF-token GET and form POST; added Apify buyer leads across 41 countries behind an email-capture gate.",
      ],
    },
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
    details: {
      overview:
        "An assistant for Indian legal acts (BNS, BNSS, BSA, DPDP Act 2023) that answers from the statutes themselves rather than the model's memory.",
      highlights: [
        "Pipeline: an Act router, then PageIndex hierarchical retrieval, BERT re-ranking and GPT-4o generation.",
        "A 37-case DeepEval golden suite with a Bedrock Claude judge: Faithfulness 0.97 and Answer Relevancy 0.98 (36/37 pass each).",
        "Plus retriever, safety, latency, cost and reliability evals — so answers are grounded and defensible.",
      ],
    },
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
    details: {
      overview:
        "Turns raw customer reviews into prioritized business intelligence — what's wrong, how urgent, what's trending, and a report leadership can act on.",
      highlights: [
        "Four CrewAI agents (classifier, priority ranker, trend detector, report generator) over 7 fine-tuned BERT classifiers trained on 51K reviews.",
        "An 8-part DeepEval readiness suite found 3 release blockers, all fixed: truncated reports from an unset token limit, a prompt-injection surface, and model reloads on every call.",
        "Migrating to LangGraph with a typed state schema and CI-integrated evals.",
      ],
    },
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
    details: {
      overview:
        "A LangGraph agent that repairs broken dependency upgrades: reproduce, fix, re-test, and hand a human a reviewable diff — never an unsupervised commit.",
      highlights: [
        "Reproduces the failure in an isolated sandbox, proposes an atomic fix, rejects unsafe or duplicate edits, reruns the test suite, and stops at a human-approval gate with a reviewable diff.",
        "Evaluated on real breaking upgrades from DepBench, 3 runs per case: 2 of 5 dev cases fixed (pass@3) at ~$0.05 per run; held-out evaluation in progress.",
        "The eval harness itself exposed 3 bugs, all fixed: a mislabeled integrity failure, a substring match flagging source files as tests, and unreported run-to-run variance (now reported as pass@3).",
      ],
    },
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
    details: {
      overview:
        "Scoped directly with an HR team: a text-to-SQL agent that answers their ad-hoc people questions in plain language — safely, without exposing employee data.",
      highlights: [
        "Scoped requirements with the HR team and prototyped on a public 5,000-row dataset to keep real employee data private.",
        "On 15 golden questions, Claude Haiku reached 73% execution accuracy vs 47% for a fine-tuned Qwen 0.5B.",
        "Across 12 prompt-injection tests, rewrote a flawed safety oracle and closed the one schema-exposure breach with a shared guardrail: zero breaches, no accuracy drop.",
      ],
    },
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
    details: {
      overview:
        "The capstone: the systems above, unified as department agents under a single orchestrator — a company you can talk to.",
      highlights: [
        "Unifies the systems above as department agents (Finance, HR, Ticketing, Export, Legal) under one orchestrator.",
        "A verifier checks grounding before responding or escalating to a human — so the org answers accountably.",
      ],
    },
  },
];
