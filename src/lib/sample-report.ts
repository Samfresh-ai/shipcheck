import type { AiFeedback, ShipReport } from "./report-types";

export const SAMPLE_REPORT_ID = "00000000-0000-4000-8000-000000000067";

const baseFeedback: AiFeedback = {
  d1: {
    score: 3,
    tier: "RED",
    feedback:
      "This names four channels but does not specify sequence, message, or named contacts. Post to MTP Slack and tweet to Build in Public are intentions, not a plan. For a developer tool at MVP stage, distribution needs to start with direct personal outreach before public posting.",
    action: "Write the exact DM message you will send to 5 specific people this week.",
  },
  d4: {
    score: 4,
    tier: "RED",
    feedback:
      "Accepting that a tool is one-shot is honest, but users return when they start a new project is not a retention plan. For a developer tool, the lack of any re-engagement mechanism means growth relies entirely on word of mouth from first-time users.",
    action:
      "Identify one concrete touchpoint that brings a user back for their second project.",
  },
  p5: {
    score: 6,
    tier: "AMBER",
    feedback:
      "The honesty of latent urgency is right. But for a developer tool targeting builders, a 6 is a positioning problem: if users are not searching for this, distribution must create demand rather than capture it.",
  },
  m1: {
    score: 7,
    tier: "AMBER",
    feedback:
      "Completion rate is the right north star for a wizard-based product. The 60% threshold is a reasonable hypothesis. What is missing is a secondary metric for whether completing the wizard led to behavior change.",
  },
  u1: {
    score: 9,
    tier: "GREEN",
    feedback:
      "Specific role, specific moment, specific psychological state: has not yet been forced. This user definition would survive a research interview. The framing makes the product value proposition self-evident without needing an explanation.",
  },
  u3: {
    score: 9,
    tier: "GREEN",
    feedback:
      "Naming nothing as the real alternative is the most insightful answer in this section. It correctly identifies that the competitive threat is default behavior, not another app. That framing has direct implications for messaging and distribution.",
  },
  s2: {
    score: 9,
    tier: "GREEN",
    feedback:
      "This answer demonstrates product maturity because it says what a stranger can do without documentation. The specific 30 seconds to question 1 detail shows the first-use path has been measured.",
  },
  m2: {
    score: 10,
    tier: "GREEN",
    feedback:
      "This is the strongest answer in the report. It names a specific metric, a specific question, a specific intervention, and a specific result. This is what product thinking with behavioral data looks like.",
  },
};

export const SAMPLE_REPORT: ShipReport = {
  id: process.env.SEED_REPORT_ID || SAMPLE_REPORT_ID,
  sessionId: "00000000-0000-4000-8000-000000000001",
  createdAt: "2026-06-07T00:00:00.000Z",
  projectName: "ShipCheck",
  projectUrl: "https://shipcheck.vercel.app",
  projectContext: {
    productName: "ShipCheck",
    category: "developer_tool",
    stage: "mvp_launched",
    oneLiner: "ShipCheck is a pre-launch readiness tool for builders - 20 questions, honest AI scoring.",
  },
  overallScore: 67,
  scoreTier: "ALMOST",
  overallInsight:
    "The product thinking on user definition and problem clarity is strong and specific. The critical gap is distribution - the current plan names channels but not sequences, people, or messages. A product about product thinking needs a distribution plan that demonstrates product thinking. Fix that section and this is ready.",
  answers: {
    u1: "A solo builder or PM who has an idea or MVP and is about to ship - and has not yet been forced to articulate the uncomfortable basics: who it is for, whether the problem is real, and whether anyone will find it.",
    u2: "Yes. Most surprising: the builders I talked to know they are skipping steps. They are not oblivious - they are optimistic and under time pressure. The shame of skipping is not the problem. The absence of a fast forcing function is.",
    u3: "They ship anyway. They move from idea to build without the middle step. The alternative to ShipCheck is not another tool - it is nothing, and shipping with nothing is the default behavior of 90% of builders.",
    u4: "Because I built it to solve my own problem. I shipped three things without running them past basic product logic checks. All three taught me expensive lessons. This is the tool I needed before I built them.",
    p1: "\"I know I should validate this before building but I just want to ship it and see what happens.\" That is the real sentence. It is not that builders do not know about product thinking - it is that there is no fast, honest way to do it in under an hour.",
    p2: "Every time someone has an idea they want to ship. For prolific builders, that is weekly. For first-timers, it is the one moment they need it most and have the least infrastructure for.",
    p3: "Hard to quantify precisely. Proxy: if a builder spends 3 months on something nobody uses, the cost is 3 months of nights and weekends, plus the motivation hit that delays the next attempt. ShipCheck is 10 minutes of friction against months of wrong-direction effort.",
    p4: "The existing options are either too academic or too heavyweight. The gap is a fast, opinionated, AI-powered check that a solo builder can run alone in one sitting.",
    p5: "6. They are not searching for this product by name. But when shown it, the recognition is instant and the use is immediate. The urgency is latent - it becomes acute the moment they try it.",
    s1: "It forces you to answer 20 uncomfortable questions before you ship - and scores your readiness with AI feedback that is specific to your product type and stage, not generic PM advice.",
    s2: "Yes. One headline, one button: Check your product. No signup. No documentation. You are answering question 1 within 30 seconds of landing.",
    s3: "Team mode - right now it is single-player. A co-founder or PM team cannot contribute to the same report together. That is the first request every user will make.",
    s4: "That most products fail not because of bad execution, but because the builder never pressure-tested the basic product logic before shipping. If you believe that, ShipCheck is obviously useful.",
    s5: "Around question 3 or 4 - when users realize they do not have a clean answer to a question they thought was obvious. That moment of friction is the product's entire value proposition.",
    d1: "Post to Mind the Product Slack #building channel. Tweet to Build in Public community. Share in Lenny's Newsletter Slack. DM 5 PM friends who are actively building side projects with a personal ask.",
    d2: "The shareable report URL. You run ShipCheck, get a score of 67, and the natural move is to send it to your co-founder or post it publicly. The report is designed to be shared - it shows your thinking, not just your score.",
    d3: "Mind the Product community. Lenny's Newsletter Slack. Build in Public on Twitter/X. ProductHunt when we launch formally.",
    d4: "ShipCheck is deliberately one-shot per project. Users return when they start a new project. There is no artificial retention mechanic - return visits reflect genuine new building activity.",
    m1: "Wizard completion rate: the percentage of users who start question 1 and submit all 20. Below 60% means the friction is too high somewhere. Novus drop-off data tells us exactly where.",
    m2: "Novus showed 43% of users dropped off at question 12 - what would a user have to believe is true to find your product valuable? The subtext was too abstract. We rewrote it with a concrete example. Drop-off at that question fell from 43% to 21%.",
  },
  aiFeedback: baseFeedback,
  sectionScores: {
    user: 82,
    problem: 74,
    solution: 78,
    distribution: 41,
    metrics: 72,
  },
  isPublic: true,
};
