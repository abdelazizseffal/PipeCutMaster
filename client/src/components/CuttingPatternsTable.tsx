import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CuttingPattern, CuttingSegment } from './CuttingVisualization';

interface CuttingPatternsTableProps {
  patterns: CuttingPattern[];
}

export function CuttingPatternsTable({ patterns }: CuttingPatternsTableProps) {
  const formatCuttingPattern = (segments: CuttingSegment[]): string => {
    const usedSegments = segments
      .filter(s => !s.isWaste)
      .map(s => `${s.length.toFixed(1)}m`);
    
    const waste = segments.find(s => s.isWaste);
    
    let pattern = usedSegments.join(' + ');
    
    if (waste && waste.length > 0) {
      pattern += ` + ${waste.length.toFixed(1)}m (leftover)`;
    }
    
    return pattern;
  };

  return (
    <div className="overflow-x-auto">
      <h3 className="text-lg font-medium text-neutral-dark mb-3">Detailed Cutting Patterns</h3>
      <Table className="min-w-full border-collapse">
        <TableHeader>
          <TableRow className="bg-neutral-light">
            <TableHead className="p-2 text-left text-sm font-medium text-neutral-dark border border-neutral-medium">Stock #</TableHead>
            <TableHead className="p-2 text-left text-sm font-medium text-neutral-dark border border-neutral-medium">Cutting Pattern</TableHead>
            <TableHead className="p-2 text-left text-sm font-medium text-neutral-dark border border-neutral-medium">Efficiency</TableHead>
            <TableHead className="p-2 text-left text-sm font-medium text-neutral-dark border border-neutral-medium">Waste</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patterns.map((pattern) => (
            <TableRow key={pattern.stockPipeIndex}>
              <TableCell className="p-2 border border-neutral-medium">{pattern.stockPipeIndex}</TableCell>
              <TableCell className="p-2 border border-neutral-medium">{formatCuttingPattern(pattern.segments)}</TableCell>
              <TableCell className="p-2 border border-neutral-medium">{pattern.efficiency.toFixed(1)}%</TableCell>
              <TableCell className="p-2 border border-neutral-medium">{pattern.waste.toFixed(2)}m</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
