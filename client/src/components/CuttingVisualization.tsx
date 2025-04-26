import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MaterialSymbol } from './ui/MaterialSymbol';
import * as d3 from 'd3';

export interface CuttingSegment {
  length: number;
  position: number;
  isWaste: boolean;
}

export interface CuttingPattern {
  stockPipeIndex: number;
  efficiency: number;
  waste: number;
  segments: CuttingSegment[];
}

interface CuttingVisualizationProps {
  patterns: CuttingPattern[];
  stockLength: number;
}

export function CuttingVisualization({
  patterns,
  stockLength
}: CuttingVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  
  const pattern = patterns[currentPatternIndex];
  
  const navigatePatterns = (direction: number) => {
    const newIndex = currentPatternIndex + direction;
    if (newIndex >= 0 && newIndex < patterns.length) {
      setCurrentPatternIndex(newIndex);
    }
  };
  
  useEffect(() => {
    if (!containerRef.current || !pattern) return;
    
    const container = containerRef.current;
    container.innerHTML = ''; // Clear previous visualization
    
    const width = container.clientWidth;
    const height = 150;
    const margin = { top: 20, right: 20, bottom: 40, left: 20 };
    
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    const contentWidth = width - margin.left - margin.right;
    const contentHeight = height - margin.top - margin.bottom;
    
    const scale = contentWidth / stockLength;
    const pipeHeight = 40;
    const pipeY = margin.top + (contentHeight - pipeHeight) / 2;
    
    // Draw base pipe
    svg.append('rect')
      .attr('x', margin.left)
      .attr('y', pipeY)
      .attr('width', contentWidth)
      .attr('height', pipeHeight)
      .attr('fill', '#e0e0e0');
    
    // Draw segments
    const colors = ['#1976d2', '#f57c00', '#4caf50', '#9c27b0', '#795548', '#009688'];
    
    pattern.segments.forEach((segment, i) => {
      const x = margin.left + segment.position * scale;
      const segmentWidth = segment.length * scale;
      
      // Skip if segment is too small to be visible
      if (segmentWidth < 1) return;
      
      // Draw segment
      svg.append('rect')
        .attr('x', x)
        .attr('y', pipeY)
        .attr('width', segmentWidth)
        .attr('height', pipeHeight)
        .attr('fill', segment.isWaste ? '#f44336' : colors[i % colors.length]);
      
      // Draw segment label
      if (segment.length > (stockLength * 0.05)) { // Only label if segment is large enough
        svg.append('text')
          .attr('x', x + segmentWidth / 2)
          .attr('y', pipeY + pipeHeight / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#ffffff')
          .attr('font-size', '12px')
          .text(segment.isWaste ? 'Waste' : `${segment.length.toFixed(1)}m`);
      }
      
      // Draw cut line
      if (i < pattern.segments.length - 1) {
        svg.append('line')
          .attr('x1', x + segmentWidth)
          .attr('y1', pipeY - 5)
          .attr('x2', x + segmentWidth)
          .attr('y2', pipeY + pipeHeight + 5)
          .attr('stroke', '#424242')
          .attr('stroke-width', 1);
      }
    });
    
    // Draw ruler
    const rulerY = pipeY + pipeHeight + 15;
    svg.append('line')
      .attr('x1', margin.left)
      .attr('y1', rulerY)
      .attr('x2', margin.left + contentWidth)
      .attr('y2', rulerY)
      .attr('stroke', '#9e9e9e')
      .attr('stroke-width', 1);
    
    // Draw ticks
    const tickCount = Math.min(stockLength + 1, Math.floor(contentWidth / 40) + 1);
    const tickStep = stockLength / (tickCount - 1);
    
    for (let i = 0; i < tickCount; i++) {
      const position = i * tickStep;
      const x = margin.left + position * scale;
      
      svg.append('line')
        .attr('x1', x)
        .attr('y1', rulerY - 5)
        .attr('x2', x)
        .attr('y2', rulerY + 5)
        .attr('stroke', '#9e9e9e')
        .attr('stroke-width', 1);
      
      svg.append('text')
        .attr('x', x)
        .attr('y', rulerY + 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#424242')
        .attr('font-size', '10px')
        .text(`${position.toFixed(position % 1 === 0 ? 0 : 1)}m`);
    }
    
  }, [pattern, stockLength, currentPatternIndex]);
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-neutral-dark mb-3">Cutting Layout</h3>
      <div className="relative">
        <div 
          ref={containerRef} 
          className="w-full border border-neutral-medium rounded h-64"
        ></div>
        
        <div className="flex justify-end mt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigatePatterns(-1)}
            disabled={currentPatternIndex === 0}
            className="p-1 text-neutral-dark hover:bg-neutral-light rounded mr-2"
          >
            <MaterialSymbol name="navigate_before" />
          </Button>
          <span className="text-neutral-gray">
            Pattern <span>{currentPatternIndex + 1}</span>/<span>{patterns.length}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigatePatterns(1)}
            disabled={currentPatternIndex === patterns.length - 1}
            className="p-1 text-neutral-dark hover:bg-neutral-light rounded ml-2"
          >
            <MaterialSymbol name="navigate_next" />
          </Button>
        </div>
      </div>
    </div>
  );
}
