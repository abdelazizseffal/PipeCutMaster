import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { PipeCuttingOptimizer } from "./optimization";
import { optimizationRequestSchema } from "@shared/schema";
import { ZodError } from "zod";
import Stripe from "stripe";
import { setupAuth } from "./auth";

// Check for Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing Stripe secret key. Stripe functionality will be limited.');
}

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" }) : 
  null;

// Middleware to ensure user is authenticated
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user has an active subscription
async function hasActiveSubscription(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user;
  
  // Allow if user has active subscription
  if (user.subscriptionStatus === 'active') {
    return next();
  }
  
  // Allow if user is on free tier (e.g. for trial or basic features)
  if (user.subscriptionStatus === 'free') {
    return next();
  }
  
  return res.status(403).json({ 
    message: "Subscription required", 
    code: "SUBSCRIPTION_REQUIRED" 
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  // Create an optimization result
  app.post("/api/optimize", async (req, res) => {
    try {
      // Validate input data
      const data = optimizationRequestSchema.parse(req.body);
      
      // Create stock pipe
      const stockPipe = await storage.createStockPipe(data.stockPipe);
      
      // Create job
      const job = await storage.createJob({
        name: data.jobName,
        stockPipeId: stockPipe.id
      });
      
      // Create cutting requirements
      for (const req of data.requirements) {
        await storage.createCuttingRequirement({
          length: req.length,
          quantity: req.quantity,
          jobId: job.id
        });
      }
      
      // Run optimization
      const optimizationPatterns = PipeCuttingOptimizer.optimize(
        stockPipe,
        data.requirements
      );
      
      // Convert optimization results to entities
      const entities = PipeCuttingOptimizer.createEntities(job, optimizationPatterns);
      
      // Store patterns and segments
      for (let i = 0; i < entities.patterns.length; i++) {
        const pattern = await storage.createCuttingPattern(entities.patterns[i]);
        
        // Update pattern ID for segments
        const patternSegments = entities.segments.filter(
          s => s.patternId === i + 1
        ).map(s => ({ ...s, patternId: pattern.id }));
        
        // Store segments
        for (const segment of patternSegments) {
          await storage.createCuttingSegment(segment);
        }
      }
      
      // Calculate metrics
      const metrics = PipeCuttingOptimizer.calculateMetrics(stockPipe, optimizationPatterns);
      
      // Get full results from storage
      const patterns = await storage.getCuttingPatternsByJobId(job.id);
      const patternsWithSegments = await Promise.all(
        patterns.map(async (pattern) => {
          const segments = await storage.getCuttingSegmentsByPatternId(pattern.id);
          return { pattern, segments };
        })
      );
      
      // Return complete optimization result
      res.json({
        job,
        stockPipe,
        patterns: patternsWithSegments,
        metrics
      });
    } catch (error) {
      console.error("Error during optimization:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ message: "Failed to optimize pipe cutting" });
    }
  });
  
  // Get job by ID with all related data
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      if (isNaN(jobId)) {
        return res.status(400).json({ message: "Invalid job ID" });
      }
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      const stockPipe = await storage.getStockPipe(job.stockPipeId);
      if (!stockPipe) {
        return res.status(404).json({ message: "Stock pipe not found" });
      }
      
      const patterns = await storage.getCuttingPatternsByJobId(jobId);
      const patternsWithSegments = await Promise.all(
        patterns.map(async (pattern) => {
          const segments = await storage.getCuttingSegmentsByPatternId(pattern.id);
          return { pattern, segments };
        })
      );
      
      // Calculate metrics
      const optimizationPatterns = patterns.map((pattern, index) => {
        const segments = patternsWithSegments[index].segments.map(s => ({
          length: s.length,
          position: s.position,
          isWaste: Boolean(s.isWaste)
        }));
        
        return {
          stockPipeIndex: pattern.stockPipeIndex,
          efficiency: pattern.efficiency,
          waste: pattern.waste,
          segments
        };
      });
      
      const metrics = PipeCuttingOptimizer.calculateMetrics(stockPipe, optimizationPatterns);
      
      res.json({
        job,
        stockPipe,
        patterns: patternsWithSegments,
        metrics
      });
    } catch (error) {
      console.error("Error retrieving job:", error);
      res.status(500).json({ message: "Failed to retrieve job data" });
    }
  });
  
  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error retrieving jobs:", error);
      res.status(500).json({ message: "Failed to retrieve jobs" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
