import { pgTable, text, serial, integer, real, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status").default("inactive"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  fullName: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Stock pipe definition schema
export const stockPipes = pgTable("stock_pipes", {
  id: serial("id").primaryKey(),
  length: real("length").notNull(), // in meters
  diameter: real("diameter").notNull(), // in mm
  kerfWidth: real("kerf_width").notNull(), // in mm
  count: integer("count").notNull(),
});

export const insertStockPipeSchema = createInsertSchema(stockPipes).pick({
  length: true,
  diameter: true,
  kerfWidth: true,
  count: true,
});

export type InsertStockPipe = z.infer<typeof insertStockPipeSchema>;
export type StockPipe = typeof stockPipes.$inferSelect;

// Cutting requirements schema
export const cuttingRequirements = pgTable("cutting_requirements", {
  id: serial("id").primaryKey(),
  length: real("length").notNull(), // in meters
  quantity: integer("quantity").notNull(),
  jobId: integer("job_id").notNull(), // to group requirements by job
});

export const insertCuttingRequirementSchema = createInsertSchema(cuttingRequirements).pick({
  length: true,
  quantity: true,
  jobId: true,
});

export type InsertCuttingRequirement = z.infer<typeof insertCuttingRequirementSchema>;
export type CuttingRequirement = typeof cuttingRequirements.$inferSelect;

// Job schema to group cutting requirements
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stockPipeId: integer("stock_pipe_id").notNull(),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  name: true,
  stockPipeId: true,
  userId: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Cutting pattern schema
export const cuttingPatterns = pgTable("cutting_patterns", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  stockPipeIndex: integer("stock_pipe_index").notNull(), // which stock pipe this pattern applies to
  efficiency: real("efficiency").notNull(), // percentage of used stock pipe
  waste: real("waste").notNull(), // remaining length in meters
});

export const insertCuttingPatternSchema = createInsertSchema(cuttingPatterns).pick({
  jobId: true,
  stockPipeIndex: true,
  efficiency: true,
  waste: true,
});

export type InsertCuttingPattern = z.infer<typeof insertCuttingPatternSchema>;
export type CuttingPattern = typeof cuttingPatterns.$inferSelect;

// Cutting segments schema (individual pieces within a pattern)
export const cuttingSegments = pgTable("cutting_segments", {
  id: serial("id").primaryKey(),
  patternId: integer("pattern_id").notNull(),
  length: real("length").notNull(), // in meters
  position: real("position").notNull(), // start position from left
  isWaste: integer("is_waste").notNull().default(0), // 0 = used piece, 1 = waste
});

export const insertCuttingSegmentSchema = createInsertSchema(cuttingSegments).pick({
  patternId: true,
  length: true,
  position: true,
  isWaste: true,
});

export type InsertCuttingSegment = z.infer<typeof insertCuttingSegmentSchema>;
export type CuttingSegment = typeof cuttingSegments.$inferSelect;

// Input data type for optimization request
export const optimizationRequestSchema = z.object({
  stockPipe: insertStockPipeSchema,
  requirements: z.array(z.object({
    length: z.number().min(0.01),
    quantity: z.number().int().min(1),
  })),
  jobName: z.string().default("Untitled Job"),
});

export type OptimizationRequest = z.infer<typeof optimizationRequestSchema>;

// Subscription plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  features: text("features").notNull(), // JSON string of features
  stripePriceId: text("stripe_price_id").notNull(),
  active: boolean("active").default(true),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  description: true,
  price: true,
  features: true,
  stripePriceId: true,
  active: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// Output data type for optimization result
export type OptimizationResult = {
  job: Job;
  stockPipe: StockPipe;
  patterns: {
    pattern: CuttingPattern;
    segments: CuttingSegment[];
  }[];
  metrics: {
    efficiency: number;
    stockUsed: number;
    stockTotal: number;
    wasteTotal: number;
  };
};
