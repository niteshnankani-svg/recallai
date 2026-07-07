// ---------------------------------------------------------------------------
// Data-file separation pattern (adapted from the reference portfolio's
// src/data/boneData.ts): edit project details here WITHOUT touching components.
//
// TODO(nitesh): all five demos are deployed on Vercel. Replace each `link`
// below with the exact Vercel subdomain (and/or GitHub repo) for that project.
// The RecallAI GitHub link is already correct.
// ---------------------------------------------------------------------------

export interface Project {
  id: string;
  title: string;
  blurb: string;
  tags: string[];
  /** Primary click-through — live demo (Vercel). */
  link: string;
  /** Optional secondary link (source). */
  github?: string;
}

export const projects: Project[] = [
  {
    id: "recallai",
    title: "RecallAI",
    blurb: "A voice wellness agent that calls, listens, and remembers.",
    tags: ["Twilio", "Deepgram", "BERT", "ChromaDB", "Claude", "ElevenLabs"],
    link: "https://recallai.vercel.app", // TODO: confirm Vercel URL
    github: "https://github.com/niteshnankani-svg/recallai",
  },
  {
    id: "bargainai",
    title: "BargainAI",
    blurb: "A WhatsApp bot that negotiates in Hinglish like a real shopkeeper.",
    tags: ["MuRIL", "Claude Haiku", "Shopify", "Twilio"],
    link: "https://bargainai.vercel.app", // TODO: confirm Vercel URL
  },
  {
    id: "niryatai",
    title: "NiryatAI",
    blurb:
      "Export intelligence for Indian businesses — real trade data, HS codes, and government schemes, in one platform.",
    tags: ["FastAPI", "Railway", "Vercel"],
    link: "https://niryatai.vercel.app", // TODO: confirm Vercel URL
  },
  {
    id: "legal-rag",
    title: "Legal RAG Chatbot",
    blurb:
      "Ask it about Indian law. It answers from BNS, BNSS, BSA, and the DPDP Act — not guesswork.",
    tags: ["RAG", "PageIndex", "BERT reranking"],
    link: "https://legal-rag.vercel.app", // TODO: confirm Vercel URL
  },
  {
    id: "complaint-intelligence",
    title: "AI Complaint Intelligence Agent",
    blurb:
      "Seven fine-tuned classifiers and a four-agent pipeline turn raw customer complaints into structured insight.",
    tags: ["BERT", "CrewAI"],
    link: "https://complaint-intelligence.vercel.app", // TODO: confirm Vercel URL
  },
];
