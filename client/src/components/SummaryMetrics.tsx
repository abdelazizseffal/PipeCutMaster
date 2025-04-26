import React from 'react';

interface SummaryMetricsProps {
  efficiency: number;
  stockUsed: number;
  stockTotal: number;
  wasteTotal: number;
}

export function SummaryMetrics({
  efficiency,
  stockUsed,
  stockTotal,
  wasteTotal
}: SummaryMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-neutral-light p-4 rounded text-center">
        <h4 className="text-sm text-neutral-gray mb-1">Material Efficiency</h4>
        <div className="text-2xl font-bold text-primary">
          {efficiency.toFixed(1)}%
        </div>
      </div>
      
      <div className="bg-neutral-light p-4 rounded text-center">
        <h4 className="text-sm text-neutral-gray mb-1">Stock Used</h4>
        <div className="text-2xl font-bold text-neutral-dark">
          <span>{stockUsed}</span>/<span>{stockTotal}</span>
        </div>
      </div>
      
      <div className="bg-neutral-light p-4 rounded text-center">
        <h4 className="text-sm text-neutral-gray mb-1">Waste</h4>
        <div className="text-2xl font-bold text-secondary">
          {wasteTotal.toFixed(2)} m
        </div>
      </div>
    </div>
  );
}
