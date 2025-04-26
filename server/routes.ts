import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { PipeCuttingOptimizer } from "./optimization";
import { optimizationRequestSchema, users } from "@shared/schema";
import { ZodError } from "zod";
import Stripe from "stripe";
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";

// Check for Stripe secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing Stripe secret key. Stripe functionality will be limited.');
}

// Initialize Stripe if key is available
const stripe = process.env.STRIPE_SECRET_KEY ? 
  new Stripe(process.env.STRIPE_SECRET_KEY) : 
  null;

// Middleware to ensure user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Middleware to check if user has an active subscription
async function hasActiveSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  // Get subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getAllSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error retrieving subscription plans:", error);
      res.status(500).json({ message: "Failed to retrieve subscription plans" });
    }
  });

  // Create a new subscription
  app.post("/api/create-subscription", isAuthenticated, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const { planId } = req.body;
      if (!planId) {
        return res.status(400).json({ message: "Plan ID is required" });
      }

      const user = req.user;
      const plan = await storage.getSubscriptionPlan(planId);
      
      if (!plan) {
        return res.status(404).json({ message: "Subscription plan not found" });
      }

      let customerId = user.stripeCustomerId;

      // Create a customer if they don't have one
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || user.username,
          metadata: {
            userId: user.id.toString()
          }
        });
        
        customerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customerId);
      }

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: plan.stripePriceId
          }
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(user.id, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id
      });

      // Return client secret for frontend to complete payment
      const invoice = subscription.latest_invoice;
      const paymentIntent = invoice?.payment_intent;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Create a one-time payment
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    try {
      const { amount } = req.body;
      
      if (!amount || typeof amount !== 'number') {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user.id.toString()
        }
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });
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

  // Get jobs for the current user
  app.get("/api/my/jobs", isAuthenticated, async (req, res) => {
    try {
      const jobs = await storage.getJobsByUserId(req.user.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error retrieving user jobs:", error);
      res.status(500).json({ message: "Failed to retrieve user jobs" });
    }
  });

  // Apply subscription check to optimization endpoint
  app.post("/api/premium-optimize", isAuthenticated, hasActiveSubscription, async (req, res) => {
    // Premium optimization features
  });

  // Stripe webhook for handling events
  app.post("/api/webhook", async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ message: "Stripe is not configured" });
    }

    const sig = req.headers['stripe-signature'];
    
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ message: "Missing signature or webhook secret" });
    }
    
    try {
      const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      
      // Handle the event
      switch (event.type) {
        case 'invoice.payment_succeeded':
          const invoice = event.data.object;
          // Update subscription status to active
          if (invoice.subscription) {
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            
            // Find the user by customer ID
            const user = await findUserByStripeCustomerId(subscription.customer);
            
            if (user) {
              await storage.updateUserStripeInfo(user.id, {
                stripeCustomerId: subscription.customer,
                stripeSubscriptionId: subscription.id
              });
            }
          }
          break;
          
        case 'customer.subscription.deleted':
          const subscription = event.data.object;
          
          // Find the user by customer ID
          const user = await findUserByStripeCustomerId(subscription.customer);
          
          if (user) {
            // Update user subscription status
            await db.update(users)
              .set({ 
                subscriptionStatus: 'inactive',
              })
              .where(eq(users.id, user.id));
          }
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Helper function to find user by Stripe customer ID
  async function findUserByStripeCustomerId(customerId: string) {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.stripeCustomerId, customerId));
    
    return user;
  }

  const httpServer = createServer(app);

  return httpServer;
}
