// Work-experience timeline entries (from the résumé). Newest first.
export interface Experience {
  role: string;
  org: string;
  period: string;
  tag: string;
  points: string[];
}

export const experience: Experience[] = [
  {
    role: "Independent AI Engineer",
    org: "Freelance",
    period: "Feb 2025 – Present",
    tag: "AI / ML · Agents · Voice AI · RAG",
    points: [
      "Designed and deployed 5 production AI systems spanning voice agents, RAG pipelines, multi-agent orchestration, and Indian-language NLP.",
      "Built a complete voice AI architecture: Twilio + Deepgram + LLM + Sarvam AI — full loop from inbound call to Hindi spoken response.",
      "Fine-tuned 7 BERT classification models on domain-specific datasets; deployed to the HuggingFace Model Hub.",
      "All projects publicly verifiable: live demos on HuggingFace Spaces, full source on GitHub.",
    ],
  },
  {
    role: "Founder & Growth Manager",
    org: "Teespirit · BlinkMart",
    period: "2023 – 2024",
    tag: "E-commerce · AI tools adoption",
    points: [
      "Built and operated a lean print-on-demand e-commerce brand, running every function solo.",
      "Early adopter of AI in operations: Midjourney, InVideo/Runway, ChatGPT, and Canva Pro across design, video, and workflow automation.",
      "Ran Meta advertising with ROAS and CAC tracking; owned customer acquisition end-to-end.",
    ],
  },
  {
    role: "Business Head — Sales & Operations",
    org: "Kishor & Company",
    period: "2012 – 2022",
    tag: "Apparel manufacturing · KRYSTAL · FOXX · CUTEBOY",
    points: [
      "Led B2B sales, client relationships, and supply-chain operations across three apparel brands.",
      "Managed end-to-end production cycles, vendor negotiations, and multi-city distribution.",
      "A decade of operational experience that informs how my AI systems must perform in real business environments.",
    ],
  },
];
