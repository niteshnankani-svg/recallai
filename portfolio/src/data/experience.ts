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
    org: "iMarketlyze (sole proprietorship)",
    period: "Sept 2024 – Present · Pune",
    tag: "Conversational AI · RAG · Multi-Agent Systems",
    points: [
      "Built nine AI systems end-to-end — six live in production — across voice agents, RAG pipelines, and multi-agent orchestration, each backed by its own evaluation suite.",
      "Deployed a multi-agent support platform full-stack on AWS (ECS Fargate, EC2, S3 + CloudFront) with Amazon Bedrock for Claude inference and interrupt()-based human escalation.",
      "Benchmarked a fine-tuned DistilBERT router against a hosted classifier (macro-F1 0.89 vs 0.56, 15 ms vs 354 ms), then audited the labels — only 71% held up — and switched production routing on the evidence.",
      "Fine-tuned 7 BERT classifiers on 51K reviews; built DeepEval golden suites (Legal RAG: 0.97 faithfulness, 0.98 answer relevancy) and caught release blockers before shipping.",
      "Scoped the HR People-Analytics Agent directly with a client's HR team — requirements to text-to-SQL agent, kept employee data private on a public dataset.",
    ],
  },
  {
    role: "Performance Marketing & Growth Analyst",
    org: "Teespirit",
    period: "Jan 2022 – Mar 2024 · Pune",
    tag: "Meta Ads · Shopify Analytics · Power BI",
    points: [
      "Ran 140+ Meta ad campaigns on ₹29.5L of spend, driving ~3,966 orders, 24M+ reach, 47M+ impressions, and 160K+ link clicks.",
      "Built Shopify Analytics and Power BI dashboards tracking CPC, CPM, and add-to-cart funnels daily; paused underperformers within 48 hours and reallocated to top-quartile creative.",
      "Owned the full creative-to-conversion funnel: ad creative, A/B-tested visuals, audience targeting, landing-page optimization, and budget allocation.",
    ],
  },
  {
    role: "Business Head — B2B Apparel Wholesale",
    org: "Kishor & Company",
    period: "Jan 2012 – Jan 2022",
    tag: "KRYSTAL · FOXX · CUTEBOY",
    points: [
      "Grew wholesale distribution from 40 to 200+ accounts across 38 cities in three states, coordinating 4 field agents over ~2,000 km of territory.",
      "Built a Tableau dashboard on 3 years of SKU-level sales data; found plain shirts outperformed prints and shifted production to a high-margin line that became a regional category leader.",
      "Used seasonal demand analysis to pre-stock counter-intuitive winners, cutting peak-season stockouts and freeing working capital; retained 15 anchor accounts year after year.",
    ],
  },
  {
    role: "Senior Sales Executive",
    org: "Naukri.com",
    period: "Jan 2011 – Jan 2012 · Pune",
    tag: "B2B SaaS sales",
    points: [
      "Onboarded an average of 10 employer clients per month onto the recruitment portal by prospecting companies and HR teams.",
    ],
  },
];
