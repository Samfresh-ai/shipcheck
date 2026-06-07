import { z } from "zod";

export const projectContextSchema = z.object({
  productName: z.string().trim().min(1).max(60),
  productUrl: z.string().trim().url().optional().or(z.literal("")).transform((value) => value || undefined),
  category: z.enum(["consumer_app", "b2b_saas", "marketplace", "developer_tool", "internal_tool", "other"]),
  stage: z.enum(["idea", "building", "mvp_launched", "post_launch"]),
  oneLiner: z.string().trim().min(1).max(120),
});

export const answersSchema = z.record(z.string().min(1), z.string());
