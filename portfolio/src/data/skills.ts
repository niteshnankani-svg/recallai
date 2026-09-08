// Core-skill categories (from the résumé). Edit freely — the Skills grid
// renders straight from this list.
export interface SkillGroup {
  title: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    title: "Voice AI Stack",
    items: ["Twilio", "Deepgram (STT)", "Sarvam AI (Hindi TTS)", "ElevenLabs", "Whisper"],
  },
  {
    title: "LLM & Agents",
    items: ["Claude", "Amazon Bedrock", "GPT-4o", "LLaMA 3.1 (Groq)", "LangChain", "CrewAI", "LangGraph", "Function Calling"],
  },
  {
    title: "Indian-Language NLP",
    items: ["MuRIL embeddings", "Hinglish code-switching", "Hindi STT/TTS pipelines", "BERT fine-tuning"],
  },
  {
    title: "RAG & Memory",
    items: ["ChromaDB", "FAISS", "Redis caching", "Hierarchical RAG", "Retrieval pipelines"],
  },
  {
    title: "Cloud & AWS",
    items: ["AWS EC2", "S3", "CloudFront", "Amazon Bedrock", "Security Groups", "AWS CLI"],
  },
  {
    title: "Backend & Deployment",
    items: ["FastAPI", "Docker", "Redis", "SQLite", "WebSockets", "REST APIs"],
  },
  {
    title: "ML & Fine-tuning",
    items: ["BERT (7 models fine-tuned)", "HuggingFace Transformers", "scikit-learn", "PyTorch"],
  },
];
