// ---------------------------------------------------------------------------
// Data-file separation (adapted from the reference portfolio's src/data pattern):
// edit project details here WITHOUT touching components. `pipeline` powers the
// animated architecture diagram that lights up on hover.
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  title: string;
  blurb: string;
  /** Ordered pipeline nodes — rendered as the flowing architecture diagram. */
  pipeline: string[];
  /** Primary click-through — live demo. */
  link: string;
  /** Optional secondary link (source). */
  github?: string;
}

export const projects: Project[] = [
  {
    id: "recallai",
    title: "RecallAI",
    blurb: "A voice wellness agent that calls, listens, and remembers.",
    pipeline: [
      "Twilio call",
      "Deepgram STT",
      "BERT emotion",
      "ChromaDB memory",
      "Claude",
      "ElevenLabs voice",
    ],
    link: "https://frontend-rouge-six-10.vercel.app",
    github: "https://github.com/niteshnankani-svg/recallai",
  },
  {
    id: "bargainai",
    title: "BargainAI",
    blurb: "A WhatsApp bot that negotiates in Hinglish like a real shopkeeper.",
    pipeline: [
      "MuRIL intent",
      "price state machine · floor clamp",
      "Claude Haiku close-detect",
      "Shopify discount code",
    ],
    link: "https://bargainai-demo.vercel.app",
  },
  {
    id: "niryatai",
    title: "NiryatAI",
    blurb:
      "Export intelligence for Indian businesses — real trade data, HS codes, and government schemes, in one platform.",
    pipeline: [
      "UN Comtrade + DGFT pipelines",
      "FastAPI",
      "RAG retrieval",
      "Railway / Vercel",
    ],
    link: "https://niryat-ai-frontend.vercel.app",
  },
  {
    id: "legal-rag",
    title: "Legal RAG Chatbot",
    blurb:
      "Ask it about Indian law. It answers from BNS, BNSS, BSA, and the DPDP Act — not guesswork.",
    pipeline: ["PageIndex retrieval", "reranking", "grounded citations"],
    link: "https://web-mocha-seven-1bs97919gq.vercel.app",
  },
  {
    id: "complaint-intelligence",
    title: "AI Complaint Intelligence Agent",
    blurb:
      "Seven fine-tuned classifiers and a four-agent pipeline turn raw customer complaints into structured insight.",
    pipeline: ["7 fine-tuned BERT classifiers", "4-agent CrewAI pipeline"],
    link: "https://huggingface.co/spaces/nitz0219",
  },
];
