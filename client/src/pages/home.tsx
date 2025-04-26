import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/layout/Header';
import { StockPipeInput } from '@/components/StockPipeInput';
import { CuttingRequirementsInput, CuttingRequirement } from '@/components/CuttingRequirementsInput';
import { CuttingVisualization, CuttingPattern } from '@/components/CuttingVisualization';
import { CuttingPatternsTable } from '@/components/CuttingPatternsTable';
import { SummaryMetrics } from '@/components/SummaryMetrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MaterialSymbol } from '@/components/ui/MaterialSymbol';
import { exportToCSV, printPage } from '@/lib/utils';

export default function Home() {
  const { toast } = useToast();

  // Stock pipe parameters
  const [stockLength, setStockLength] = useState(6);
  const [pipeDiameter, setPipeDiameter] = useState(50);
  const [kerfWidth, setKerfWidth] = useState(3);
  const [stockCount, setStockCount] = useState(10);

  // Cutting requirements
  const [requirements, setRequirements] = useState<CuttingRequirement[]>([
    { id: 'req-1', length: 1.5, quantity: 5 },
    { id: 'req-2', length: 2.2, quantity: 3 }
  ]);

  // Optimization results
  const [optimizationResults, setOptimizationResults] = useState<any | null>(null);
  const [patterns, setPatterns] = useState<CuttingPattern[]>([]);
  const [metrics, setMetrics] = useState({
    efficiency: 0,
    stockUsed: 0,
    stockTotal: 0,
    wasteTotal: 0
  });

  // Mutation for optimizing cutting patterns
  const optimizeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/optimize', data);
      return response.json();
    },
    onSuccess: (data) => {
      setOptimizationResults(data);
      
      // Convert API response to local state
      const convertedPatterns = data.patterns.map((p: any) => {
        return {
          stockPipeIndex: p.pattern.stockPipeIndex,
          efficiency: p.pattern.efficiency,
          waste: p.pattern.waste,
          segments: p.segments.map((s: any) => ({
            length: s.length,
            position: s.position,
            isWaste: Boolean(s.isWaste)
          }))
        };
      });
      
      setPatterns(convertedPatterns);
      setMetrics(data.metrics);
      
      toast({
        title: 'Optimization Complete',
        description: `Found ${convertedPatterns.length} cutting patterns with ${data.metrics.efficiency.toFixed(1)}% efficiency.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Optimization Failed',
        description: error instanceof Error ? error.message : 'Failed to optimize cutting patterns',
        variant: 'destructive',
      });
    }
  });

  const resetForm = () => {
    setStockLength(6);
    setPipeDiameter(50);
    setKerfWidth(3);
    setStockCount(10);
    setRequirements([
      { id: 'req-1', length: 1.5, quantity: 5 },
      { id: 'req-2', length: 2.2, quantity: 3 }
    ]);
  };

  const calculateOptimalCutting = () => {
    // Validate input data
    if (requirements.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please add at least one cutting requirement',
        variant: 'destructive',
      });
      return;
    }

    // Prepare data for API
    const requestData = {
      stockPipe: {
        length: stockLength,
        diameter: pipeDiameter,
        kerfWidth: kerfWidth,
        count: stockCount
      },
      requirements: requirements.map(req => ({
        length: req.length,
        quantity: req.quantity
      })),
      jobName: `Pipe Job ${new Date().toLocaleString()}`
    };

    // Call the optimization API
    optimizeMutation.mutate(requestData);
  };

  const handleExportCSV = () => {
    if (!optimizationResults) return;

    const headers = ['Stock #', 'Cutting Pattern', 'Efficiency', 'Waste'];
    const data = patterns.map(pattern => {
      const patternText = pattern.segments
        .filter(s => !s.isWaste)
        .map(s => `${s.length.toFixed(1)}m`)
        .join(' + ');
      
      const waste = pattern.segments.find(s => s.isWaste);
      const fullPattern = waste && waste.length > 0
        ? `${patternText} + ${waste.length.toFixed(1)}m (leftover)`
        : patternText;

      return [
        pattern.stockPipeIndex.toString(),
        fullPattern,
        `${pattern.efficiency.toFixed(1)}%`,
        `${pattern.waste.toFixed(2)}m`
      ];
    });

    exportToCSV(data, 'pipe_cutting_patterns.csv', headers);
  };

  // Initial calculation
  useEffect(() => {
    calculateOptimalCutting();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <Header 
        title="Pipe Cutting Optimization Tool"
        subtitle="Minimize waste and optimize your pipe cutting patterns"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary mb-4 flex items-center">
                <MaterialSymbol name="settings" className="mr-2" />
                Input Parameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StockPipeInput
                stockLength={stockLength}
                setStockLength={setStockLength}
                pipeDiameter={pipeDiameter}
                setPipeDiameter={setPipeDiameter}
                kerfWidth={kerfWidth}
                setKerfWidth={setKerfWidth}
                stockCount={stockCount}
                setStockCount={setStockCount}
              />
              
              <CuttingRequirementsInput
                requirements={requirements}
                setRequirements={setRequirements}
              />
              
              <div className="flex justify-between pt-4 border-t border-neutral-medium">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="px-4 py-2 text-neutral-dark hover:bg-neutral-medium rounded"
                >
                  Reset
                </Button>
                <Button
                  onClick={calculateOptimalCutting}
                  className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded flex items-center"
                  disabled={optimizeMutation.isPending}
                >
                  <MaterialSymbol name="calculate" className="mr-1" />
                  {optimizeMutation.isPending ? 'Calculating...' : 'Calculate Optimal Cutting'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Results Section */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-primary mb-4 flex items-center">
                <MaterialSymbol name="insert_chart" className="mr-2" />
                Optimization Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patterns.length > 0 ? (
                <>
                  <SummaryMetrics
                    efficiency={metrics.efficiency}
                    stockUsed={metrics.stockUsed}
                    stockTotal={metrics.stockTotal}
                    wasteTotal={metrics.wasteTotal}
                  />
                  
                  <CuttingVisualization
                    patterns={patterns}
                    stockLength={stockLength}
                  />
                  
                  <CuttingPatternsTable patterns={patterns} />
                  
                  <div className="flex justify-end mt-6">
                    <Button
                      variant="default"
                      onClick={handleExportCSV}
                      className="px-4 py-2 bg-secondary text-white hover:bg-secondary/90 rounded flex items-center mr-3"
                    >
                      <MaterialSymbol name="file_download" className="mr-1" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={printPage}
                      className="px-4 py-2 border border-neutral-dark text-neutral-dark hover:bg-neutral-light rounded flex items-center"
                    >
                      <MaterialSymbol name="print" className="mr-1" />
                      Print
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MaterialSymbol name="info" className="text-neutral-gray text-5xl mb-4" />
                  <p className="text-neutral-gray">
                    {optimizeMutation.isPending 
                      ? 'Calculating optimal cutting patterns...' 
                      : 'Enter your pipe specifications and requirements, then calculate to see results here.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
