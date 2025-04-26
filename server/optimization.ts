import { 
  StockPipe, 
  CuttingPattern, 
  CuttingSegment, 
  InsertCuttingPattern, 
  InsertCuttingSegment,
  Job
} from "@shared/schema";

type CuttingRequirement = {
  length: number;
  quantity: number;
};

type PatternSegment = {
  length: number;
  position: number;
  isWaste: boolean;
};

type CuttingPatternResult = {
  stockPipeIndex: number;
  efficiency: number;
  waste: number;
  segments: PatternSegment[];
};

export class PipeCuttingOptimizer {
  /**
   * First-Fit Decreasing (FFD) algorithm for cutting stock problem
   * This is a greedy algorithm that sorts the required pieces by length (decreasing)
   * and fits them into stock pipes using the first-fit approach
   */
  static optimize(
    stockPipe: StockPipe,
    requirements: CuttingRequirement[]
  ): CuttingPatternResult[] {
    const stockLength = stockPipe.length;
    const kerfWidthMeters = stockPipe.kerfWidth / 1000; // Convert mm to meters
    const maxStockCount = stockPipe.count;
    
    // Create pieces array from requirements
    let pieces: number[] = [];
    for (const req of requirements) {
      for (let i = 0; i < req.quantity; i++) {
        pieces.push(req.length);
      }
    }
    
    // Sort pieces in decreasing order (largest first)
    pieces.sort((a, b) => b - a);
    
    // Initialize bins (stock pipes)
    const bins: number[][] = [];
    const binRemainingLengths: number[] = [];
    const binSegments: PatternSegment[][] = [];
    
    // First-fit decreasing algorithm
    for (let i = 0; i < pieces.length; i++) {
      const pieceLength = pieces[i];
      
      // Check if piece can fit in any existing bin
      let placed = false;
      for (let j = 0; j < bins.length; j++) {
        // Account for kerf width for each cut except for the first piece in a bin
        const kerfNeeded = bins[j].length > 0 ? kerfWidthMeters : 0;
        
        if (binRemainingLengths[j] >= pieceLength + kerfNeeded) {
          // Calculate position for the new piece
          const currentPosition = stockLength - binRemainingLengths[j];
          
          // Add piece to bin
          bins[j].push(pieceLength);
          
          // Update remaining length in the bin (subtract piece length and kerf)
          binRemainingLengths[j] -= (pieceLength + kerfNeeded);
          
          // Add segment to bin segments
          binSegments[j].push({
            length: pieceLength,
            position: currentPosition + kerfNeeded,
            isWaste: false
          });
          
          placed = true;
          break;
        }
      }
      
      // If piece couldn't fit in any existing bin and we haven't reached max stock count,
      // create a new bin
      if (!placed && bins.length < maxStockCount) {
        bins.push([pieceLength]);
        binRemainingLengths.push(stockLength - pieceLength);
        binSegments.push([{
          length: pieceLength,
          position: 0,
          isWaste: false
        }]);
      } else if (!placed) {
        // If we've reached max stock count, we can't place this piece
        // In a real app, we might want to handle this case differently
        console.warn(`Couldn't place all pieces within the available stock pipes (${maxStockCount})`);
        break;
      }
    }
    
    // Create the final cutting patterns with leftover segments as waste
    const patterns: CuttingPatternResult[] = [];
    
    for (let i = 0; i < bins.length; i++) {
      const segments = [...binSegments[i]];
      const remainingLength = binRemainingLengths[i];
      
      // Add waste segment if there's remaining length
      if (remainingLength > 0) {
        const lastSegment = segments[segments.length - 1];
        const wastePosition = lastSegment.position + lastSegment.length;
        
        segments.push({
          length: remainingLength,
          position: wastePosition,
          isWaste: true
        });
      }
      
      // Calculate efficiency
      const usedLength = stockLength - remainingLength;
      const efficiency = (usedLength / stockLength) * 100;
      
      patterns.push({
        stockPipeIndex: i + 1, // 1-based index for display
        efficiency,
        waste: remainingLength,
        segments
      });
    }
    
    return patterns;
  }
  
  /**
   * Converts optimization results to database entities
   */
  static createEntities(
    job: Job,
    patterns: CuttingPatternResult[]
  ): { patterns: InsertCuttingPattern[], segments: InsertCuttingSegment[] } {
    const patternEntities: InsertCuttingPattern[] = [];
    const segmentEntities: InsertCuttingSegment[] = [];
    let patternId = 1;
    
    for (const pattern of patterns) {
      // Create pattern entity
      const patternEntity: InsertCuttingPattern = {
        jobId: job.id,
        stockPipeIndex: pattern.stockPipeIndex,
        efficiency: pattern.efficiency,
        waste: pattern.waste
      };
      
      patternEntities.push(patternEntity);
      
      // Create segment entities
      for (const segment of pattern.segments) {
        const segmentEntity: InsertCuttingSegment = {
          patternId,
          length: segment.length,
          position: segment.position,
          isWaste: segment.isWaste ? 1 : 0
        };
        
        segmentEntities.push(segmentEntity);
      }
      
      patternId++;
    }
    
    return { patterns: patternEntities, segments: segmentEntities };
  }
  
  /**
   * Calculate overall metrics from patterns
   */
  static calculateMetrics(stockPipe: StockPipe, patterns: CuttingPatternResult[]) {
    // Calculate total waste
    const wasteTotal = patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    
    // Calculate overall efficiency
    const totalUsedLength = patterns.reduce(
      (sum, pattern) => sum + (stockPipe.length - pattern.waste), 
      0
    );
    const totalStockLength = patterns.length * stockPipe.length;
    const efficiency = (totalUsedLength / totalStockLength) * 100;
    
    return {
      efficiency,
      stockUsed: patterns.length,
      stockTotal: stockPipe.count,
      wasteTotal
    };
  }
}
