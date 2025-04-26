import { 
  users, 
  stockPipes,
  cuttingRequirements,
  jobs,
  cuttingPatterns,
  cuttingSegments,
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
  type InsertCuttingSegment
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // StockPipe methods
  getStockPipe(id: number): Promise<StockPipe | undefined>;
  createStockPipe(stockPipe: InsertStockPipe): Promise<StockPipe>;
  
  // CuttingRequirement methods
  getCuttingRequirementsByJobId(jobId: number): Promise<CuttingRequirement[]>;
  createCuttingRequirement(requirement: InsertCuttingRequirement): Promise<CuttingRequirement>;
  
  // Job methods
  getJob(id: number): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  
  // CuttingPattern methods
  getCuttingPattern(id: number): Promise<CuttingPattern | undefined>;
  getCuttingPatternsByJobId(jobId: number): Promise<CuttingPattern[]>;
  createCuttingPattern(pattern: InsertCuttingPattern): Promise<CuttingPattern>;
  
  // CuttingSegment methods
  getCuttingSegmentsByPatternId(patternId: number): Promise<CuttingSegment[]>;
  createCuttingSegment(segment: InsertCuttingSegment): Promise<CuttingSegment>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stockPipes: Map<number, StockPipe>;
  private cuttingRequirements: Map<number, CuttingRequirement>;
  private jobs: Map<number, Job>;
  private cuttingPatterns: Map<number, CuttingPattern>;
  private cuttingSegments: Map<number, CuttingSegment>;
  
  currentUserId: number;
  currentStockPipeId: number;
  currentCuttingRequirementId: number;
  currentJobId: number;
  currentCuttingPatternId: number;
  currentCuttingSegmentId: number;

  constructor() {
    this.users = new Map();
    this.stockPipes = new Map();
    this.cuttingRequirements = new Map();
    this.jobs = new Map();
    this.cuttingPatterns = new Map();
    this.cuttingSegments = new Map();
    
    this.currentUserId = 1;
    this.currentStockPipeId = 1;
    this.currentCuttingRequirementId = 1;
    this.currentJobId = 1;
    this.currentCuttingPatternId = 1;
    this.currentCuttingSegmentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // StockPipe methods
  async getStockPipe(id: number): Promise<StockPipe | undefined> {
    return this.stockPipes.get(id);
  }
  
  async createStockPipe(insertStockPipe: InsertStockPipe): Promise<StockPipe> {
    const id = this.currentStockPipeId++;
    const stockPipe: StockPipe = { ...insertStockPipe, id };
    this.stockPipes.set(id, stockPipe);
    return stockPipe;
  }
  
  // CuttingRequirement methods
  async getCuttingRequirementsByJobId(jobId: number): Promise<CuttingRequirement[]> {
    return Array.from(this.cuttingRequirements.values()).filter(
      req => req.jobId === jobId
    );
  }
  
  async createCuttingRequirement(insertRequirement: InsertCuttingRequirement): Promise<CuttingRequirement> {
    const id = this.currentCuttingRequirementId++;
    const requirement: CuttingRequirement = { ...insertRequirement, id };
    this.cuttingRequirements.set(id, requirement);
    return requirement;
  }
  
  // Job methods
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async getAllJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }
  
  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.currentJobId++;
    const job: Job = { ...insertJob, id };
    this.jobs.set(id, job);
    return job;
  }
  
  // CuttingPattern methods
  async getCuttingPattern(id: number): Promise<CuttingPattern | undefined> {
    return this.cuttingPatterns.get(id);
  }
  
  async getCuttingPatternsByJobId(jobId: number): Promise<CuttingPattern[]> {
    return Array.from(this.cuttingPatterns.values()).filter(
      pattern => pattern.jobId === jobId
    );
  }
  
  async createCuttingPattern(insertPattern: InsertCuttingPattern): Promise<CuttingPattern> {
    const id = this.currentCuttingPatternId++;
    const pattern: CuttingPattern = { ...insertPattern, id };
    this.cuttingPatterns.set(id, pattern);
    return pattern;
  }
  
  // CuttingSegment methods
  async getCuttingSegmentsByPatternId(patternId: number): Promise<CuttingSegment[]> {
    return Array.from(this.cuttingSegments.values()).filter(
      segment => segment.patternId === patternId
    );
  }
  
  async createCuttingSegment(insertSegment: InsertCuttingSegment): Promise<CuttingSegment> {
    const id = this.currentCuttingSegmentId++;
    const segment: CuttingSegment = { ...insertSegment, id };
    this.cuttingSegments.set(id, segment);
    return segment;
  }
}

export const storage = new MemStorage();
