import { 
  users, 
  stockPipes,
  cuttingRequirements,
  jobs,
  cuttingPatterns,
  cuttingSegments,
  subscriptionPlans,
  type User, 
  type InsertUser,
  type StockPipe,
  type InsertStockPipe,
  type CuttingRequirement,
  type InsertCuttingRequirement,
  type Job,
  type InsertJob,
  type CuttingPattern,
  type InsertCuttingPattern,
  type CuttingSegment,
  type InsertCuttingSegment,
  type SubscriptionPlan,
  type InsertSubscriptionPlan
} from "@shared/schema";
import type { Store } from "express-session";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  sessionStore: any; // Store

  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  
  // StockPipe methods
  getStockPipe(id: number): Promise<StockPipe | undefined>;
  createStockPipe(stockPipe: InsertStockPipe): Promise<StockPipe>;
  
  // CuttingRequirement methods
  getCuttingRequirementsByJobId(jobId: number): Promise<CuttingRequirement[]>;
  createCuttingRequirement(requirement: InsertCuttingRequirement): Promise<CuttingRequirement>;
  
  // Job methods
  getJob(id: number): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getJobsByUserId(userId: number): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  
  // CuttingPattern methods
  getCuttingPattern(id: number): Promise<CuttingPattern | undefined>;
  getCuttingPatternsByJobId(jobId: number): Promise<CuttingPattern[]>;
  createCuttingPattern(pattern: InsertCuttingPattern): Promise<CuttingPattern>;
  
  // CuttingSegment methods
  getCuttingSegmentsByPatternId(patternId: number): Promise<CuttingSegment[]>;
  createCuttingSegment(segment: InsertCuttingSegment): Promise<CuttingSegment>;

  // Subscription plan methods
  getAllSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
}

import { db } from './db';
import { eq } from 'drizzle-orm';
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import session from "express-session";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Store

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserStripeInfo(userId: number, info: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ 
        stripeCustomerId: info.stripeCustomerId,
        stripeSubscriptionId: info.stripeSubscriptionId,
        subscriptionStatus: 'active'
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }
  
  // StockPipe methods
  async getStockPipe(id: number): Promise<StockPipe | undefined> {
    const [stockPipe] = await db.select().from(stockPipes).where(eq(stockPipes.id, id));
    return stockPipe;
  }
  
  async createStockPipe(insertStockPipe: InsertStockPipe): Promise<StockPipe> {
    const [stockPipe] = await db.insert(stockPipes).values(insertStockPipe).returning();
    return stockPipe;
  }
  
  // CuttingRequirement methods
  async getCuttingRequirementsByJobId(jobId: number): Promise<CuttingRequirement[]> {
    return db.select().from(cuttingRequirements).where(eq(cuttingRequirements.jobId, jobId));
  }
  
  async createCuttingRequirement(insertRequirement: InsertCuttingRequirement): Promise<CuttingRequirement> {
    const [requirement] = await db.insert(cuttingRequirements).values(insertRequirement).returning();
    return requirement;
  }
  
  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }
  
  async getAllJobs(): Promise<Job[]> {
    return db.select().from(jobs);
  }

  async getJobsByUserId(userId: number): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.userId, userId));
  }
  
  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }
  
  // CuttingPattern methods
  async getCuttingPattern(id: number): Promise<CuttingPattern | undefined> {
    const [pattern] = await db.select().from(cuttingPatterns).where(eq(cuttingPatterns.id, id));
    return pattern;
  }
  
  async getCuttingPatternsByJobId(jobId: number): Promise<CuttingPattern[]> {
    return db.select().from(cuttingPatterns).where(eq(cuttingPatterns.jobId, jobId));
  }
  
  async createCuttingPattern(insertPattern: InsertCuttingPattern): Promise<CuttingPattern> {
    const [pattern] = await db.insert(cuttingPatterns).values(insertPattern).returning();
    return pattern;
  }
  
  // CuttingSegment methods
  async getCuttingSegmentsByPatternId(patternId: number): Promise<CuttingSegment[]> {
    return db.select().from(cuttingSegments).where(eq(cuttingSegments.patternId, patternId));
  }
  
  async createCuttingSegment(insertSegment: InsertCuttingSegment): Promise<CuttingSegment> {
    const [segment] = await db.insert(cuttingSegments).values(insertSegment).returning();
    return segment;
  }

  // Subscription plans methods
  async getAllSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.active, true));
  }

  async getSubscriptionPlan(id: number): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(insertPlan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [plan] = await db.insert(subscriptionPlans).values(insertPlan).returning();
    return plan;
  }
}

export const storage = new DatabaseStorage();
