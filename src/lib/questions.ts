export type QuestionTier = "RED" | "AMBER" | "GREEN";
export type SectionId = "user" | "problem" | "solution" | "distribution" | "metrics";

export type ProductCategory =
  | "consumer_app"
  | "b2b_saas"
  | "marketplace"
  | "developer_tool"
  | "internal_tool"
  | "other";

export type ProductStage = "idea" | "building" | "mvp_launched" | "post_launch";

export interface ProjectContext {
  productName: string;
  productUrl?: string;
  category: ProductCategory;
  stage: ProductStage;
  oneLiner: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  consumer_app: "Consumer app",
  b2b_saas: "B2B SaaS",
  marketplace: "Marketplace",
  developer_tool: "Developer tool",
  internal_tool: "Internal tool",
  other: "Other",
};

export const STAGE_LABELS: Record<ProductStage, string> = {
  idea: "Idea - nothing built yet",
  building: "Building - in development",
  mvp_launched: "MVP launched - first users",
  post_launch: "Post-launch - iterating",
};

export interface Question {
  id: string;
  sectionId: SectionId;
  index: number;
  question: string;
  subtext: string;
  placeholder: string;
  weight: number;
}

export const SECTIONS: Record<SectionId, { label: string; description: string; weight: number }> = {
  user: {
    label: "Your User",
    description: "Who specifically is this for?",
    weight: 0.2,
  },
  problem: {
    label: "The Problem",
    description: "What pain are you solving?",
    weight: 0.25,
  },
  solution: {
    label: "Your Solution",
    description: "What you built and why it works",
    weight: 0.25,
  },
  distribution: {
    label: "Getting Users",
    description: "How the first 100 users find you",
    weight: 0.2,
  },
  metrics: {
    label: "Measuring Success",
    description: "How you know it worked",
    weight: 0.1,
  },
};

export const SECTION_ORDER: SectionId[] = ["user", "problem", "solution", "distribution", "metrics"];

export const QUESTIONS: Question[] = [
  {
    id: "u1",
    sectionId: "user",
    index: 0,
    question: "Describe your target user in one sentence - job title, context, and the one thing they care most about.",
    subtext: "Not \"anyone who wants to be more productive.\" A specific human in a specific situation.",
    placeholder: "e.g. \"A solo founder building their first SaaS who is terrified of shipping something nobody wants.\"",
    weight: 3,
  },
  {
    id: "u2",
    sectionId: "user",
    index: 1,
    question: "Have you talked to at least 3 people who match that description - not friends, not family - in the last 30 days?",
    subtext: "If yes, what was the single most surprising thing they said? If no, why not?",
    placeholder: "e.g. \"Yes. Most surprising: they do not care about the feature I built - they care about the 10 minutes they spend explaining their problem to their manager every week.\"",
    weight: 2,
  },
  {
    id: "u3",
    sectionId: "user",
    index: 2,
    question: "What does your user do today instead of using your product?",
    subtext: "The current alternative is your real competitor, not another app.",
    placeholder: "e.g. \"They use a spreadsheet shared over Slack, with three people editing simultaneously and no version history.\"",
    weight: 2,
  },
  {
    id: "u4",
    sectionId: "user",
    index: 3,
    question: "Why would your user trust a product they found on the internet - made by you - over the thing they are doing today?",
    subtext: "This is a trust question, not a feature question.",
    placeholder: "e.g. \"Because I am one of them. I have been a solo PM for 4 years and I built this to solve my own problem.\"",
    weight: 2,
  },
  {
    id: "p1",
    sectionId: "problem",
    index: 4,
    question: "Describe the problem in the user's words - not yours.",
    subtext: "Paste a real quote from a user interview or review if you have one. If not, write what you think they would say.",
    placeholder: "e.g. \"I spend half my day in meetings about meetings. By the time I get to actual product work it is 4pm and I am useless.\"",
    weight: 3,
  },
  {
    id: "p2",
    sectionId: "problem",
    index: 5,
    question: "How often does this problem occur for your target user?",
    subtext: "Daily problems beat weekly beats monthly. Be honest.",
    placeholder: "e.g. \"Every time they open their laptop on Monday morning. So 52 times a year, minimum.\"",
    weight: 2,
  },
  {
    id: "p3",
    sectionId: "problem",
    index: 6,
    question: "What is the cost of this problem - in time, money, stress, or opportunity - if left unsolved for a year?",
    subtext: "Quantify it even roughly. Vague pain is hard to sell.",
    placeholder: "e.g. \"Roughly 3 hours/week x 50 weeks = 150 hours/year. At $100/hr that is $15,000 in wasted PM time.\"",
    weight: 3,
  },
  {
    id: "p4",
    sectionId: "problem",
    index: 7,
    question: "Why has not someone already solved this well?",
    subtext: "If the answer is \"no one thought of it,\" think harder. What actually made it hard?",
    placeholder: "e.g. \"Existing tools solve it for enterprise teams with 10+ people. The solo builder with no budget and no Jira admin has been ignored.\"",
    weight: 2,
  },
  {
    id: "p5",
    sectionId: "problem",
    index: 8,
    question: "On a scale of 1-10, how urgent is this problem for your user - where 10 means they are actively searching for a solution right now?",
    subtext: "Be honest. Explain your number.",
    placeholder: "e.g. \"7. They are not searching Google for a solution, but the moment I show them mine they immediately get it.\"",
    weight: 2,
  },
  {
    id: "s1",
    sectionId: "solution",
    index: 9,
    question: "What is the one thing your product does that nothing else does in exactly the same way?",
    subtext: "One thing. Not five. If you cannot say it in one sentence, the product is not focused enough.",
    placeholder: "e.g. \"It forces you to answer 20 uncomfortable questions before you ship - and scores your readiness with AI feedback on every weak answer.\"",
    weight: 3,
  },
  {
    id: "s2",
    sectionId: "solution",
    index: 10,
    question: "Can a complete stranger land on your URL right now and get value without reading any documentation?",
    subtext: "If the answer is \"mostly\" or \"they would need to watch the Loom first,\" that is a no.",
    placeholder: "e.g. \"Yes. The landing page has one button: Check your product. They are in the wizard in 3 seconds.\"",
    weight: 3,
  },
  {
    id: "s3",
    sectionId: "solution",
    index: 11,
    question: "What is the single biggest thing missing from your v1 that you know users will ask for?",
    subtext: "Naming it shows product maturity. Not naming it suggests you have not thought past launch.",
    placeholder: "e.g. \"Team sharing - right now reports are single-player. Multiple people on the same project cannot both contribute answers.\"",
    weight: 2,
  },
  {
    id: "s4",
    sectionId: "solution",
    index: 12,
    question: "What would a user have to believe is true about the world to find your product obviously valuable?",
    subtext: "This is your insight. If it is not contrarian or surprising, your product may not be differentiated.",
    placeholder: "e.g. \"That most products fail not because of bad execution, but because the builder never pressure-tested the basic product logic before shipping.\"",
    weight: 2,
  },
  {
    id: "s5",
    sectionId: "solution",
    index: 13,
    question: "How long does it take a new user to reach their first aha moment - the moment they get why this exists?",
    subtext: "Shorter is better. Measure it, do not guess.",
    placeholder: "e.g. \"About 4 minutes in, when they hit question 3 and realize they have never actually answered it out loud before.\"",
    weight: 2,
  },
  {
    id: "d1",
    sectionId: "distribution",
    index: 14,
    question: "Who are the first 10 users, and how exactly will you reach each of them?",
    subtext: "\"Post it on Twitter\" is not a plan. Name the channel, community, or specific person.",
    placeholder: "e.g. \"5 from the MtP Slack #side-projects channel, 3 from personal DMs to PM friends building side projects, 2 from a ProductHunt teaser post.\"",
    weight: 3,
  },
  {
    id: "d2",
    sectionId: "distribution",
    index: 15,
    question: "What makes someone share your product with a colleague without being asked to?",
    subtext: "If you do not have an answer, you do not have a growth loop.",
    placeholder: "e.g. \"The shareable report URL. You run ShipCheck and then send the report to your co-founder or investor to show your thinking.\"",
    weight: 2,
  },
  {
    id: "d3",
    sectionId: "distribution",
    index: 16,
    question: "Where does your target user already hang out online - communities, newsletters, or events - that you could reach them without paid ads?",
    subtext: "Distribution is a product decision. You should have 3 specific channels.",
    placeholder: "e.g. \"Mind the Product Slack, Lenny's Newsletter community, ProductHunt, and the Build in Public Twitter/X community.\"",
    weight: 2,
  },
  {
    id: "d4",
    sectionId: "distribution",
    index: 17,
    question: "What is your Day 7 retention plan - what brings a user back after their first session?",
    subtext: "If it is a one-shot tool with no reason to return, say so - and explain why that is OK for your model.",
    placeholder: "e.g. \"It is deliberately one-shot per project. But users return when they start a new project. We track re-engagement via email digest.\"",
    weight: 2,
  },
  {
    id: "m1",
    sectionId: "metrics",
    index: 18,
    question: "What is the single metric that tells you, unambiguously, whether your product is working?",
    subtext: "Not signups. Not traffic. The metric that connects directly to user value delivered.",
    placeholder: "e.g. \"Percentage of users who complete all 20 questions. Below 60% means the friction is too high.\"",
    weight: 3,
  },
  {
    id: "m2",
    sectionId: "metrics",
    index: 19,
    question: "What does your Novus / analytics data show about how users actually behave vs. how you expected them to behave?",
    subtext: "If you have not looked at behavioral data yet, say so - and explain what you will look for first.",
    placeholder: "e.g. \"Novus shows 43% of users drop off at question 12. We rewrote it and drop-off fell to 21%.\"",
    weight: 2,
  },
];

export function getQuestionByIndex(index: number): Question | undefined {
  return QUESTIONS.find((question) => question.index === index);
}

export function getSectionQuestions(sectionId: SectionId): Question[] {
  return QUESTIONS.filter((question) => question.sectionId === sectionId);
}
