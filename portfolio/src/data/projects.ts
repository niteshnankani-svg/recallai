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
  /** Deeper detail (metrics / architecture) shown under the blurb. */
  details?: string[];
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
    details: [
      "India's first Hindi voice wellness companion: full STT → LLM → TTS loop over live phone calls.",
      "Twilio telephony + real-time Deepgram Hindi STT + Claude for intent/emotion + Sarvam AI for natural Hindi TTS.",
      "ChromaDB memory persists emotional context across sessions; a fine-tuned BERT model reads valence/arousal in real time.",
      "Fallback flows for silence, interruptions, and low-confidence transcription; FastAPI + async WebSocket pipeline.",
    ],
    link: "https://recallai.vercel.app", // TODO: confirm Vercel URL
    github: "https://github.com/niteshnankani-svg/recallai",
  },
  {
    id: "bargainai",
    title: "BargainAI",
    blurb: "A WhatsApp bot that negotiates in Hinglish like a real shopkeeper.",
    tags: ["MuRIL", "Claude Haiku", "Shopify", "Twilio"],
    details: [
      "Handles real Hindi + English code-switching mid-sentence using Google's MuRIL multilingual embeddings.",
      "Fast, cost-efficient inference via LLaMA 3.1 on Groq; hierarchical RAG for product-level pricing context.",
      "Integrated with WhatsApp through a Twilio webhook — production-deployed on HuggingFace Spaces.",
    ],
    link: "https://bargainai.vercel.app", // TODO: confirm Vercel URL
  },
  {
    id: "niryatai",
    title: "NiryatAI",
    blurb:
      "Export intelligence for Indian businesses — real trade data, HS codes, and government schemes, in one platform.",
    tags: ["FastAPI", "Railway", "Vercel"],
    details: [
      "Unifies live trade data, HS-code lookup, and government export schemes into a single decision surface.",
      "FastAPI backend on Railway, front-end on Vercel — built for Indian exporters, not generic dashboards.",
    ],
    link: "https://niryatai.vercel.app", // TODO: confirm Vercel URL
  },
  {
    id: "legal-rag",
    title: "Legal RAG Chatbot",
    blurb:
      "Ask it about Indian law. It answers from BNS, BNSS, BSA, and the DPDP Act — not guesswork.",
    tags: ["RAG", "PageIndex", "BERT reranking"],
    details: [
      "Grounded in India's new criminal codes — BNS, BNSS, BSA — and the DPDP Act 2023.",
      "PageIndex + GPT-4o retrieval with BERT classification/reranking; Redis + Docker. Live on HuggingFace.",
    ],
    link: "https://legal-rag.vercel.app", // TODO: confirm Vercel URL
  },
  {
    id: "complaint-intelligence",
    title: "AI Complaint Intelligence Agent",
    blurb:
      "Seven fine-tuned classifiers and a four-agent pipeline turn raw customer complaints into structured insight.",
    tags: ["BERT", "CrewAI"],
    details: [
      "A 4-agent CrewAI pipeline backed by 7 fine-tuned BERT models.",
      "Trained on 51,000 Flipkart reviews at 95–99% accuracy; FastAPI + Gradio, live on HuggingFace.",
    ],
    link: "https://complaint-intelligence.vercel.app", // TODO: confirm Vercel URL
  },
];
