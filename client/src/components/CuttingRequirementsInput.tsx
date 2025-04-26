import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MaterialSymbol } from './ui/MaterialSymbol';

export interface CuttingRequirement {
  id: string;
  length: number;
  quantity: number;
}

interface CuttingRequirementsInputProps {
  requirements: CuttingRequirement[];
  setRequirements: (requirements: CuttingRequirement[]) => void;
}

export function CuttingRequirementsInput({
  requirements,
  setRequirements
}: CuttingRequirementsInputProps) {
  const handleLengthChange = (id: string, length: number) => {
    setRequirements(
      requirements.map(req => 
        req.id === id ? { ...req, length } : req
      )
    );
  };

  const handleQuantityChange = (id: string, quantity: number) => {
    setRequirements(
      requirements.map(req => 
        req.id === id ? { ...req, quantity } : req
      )
    );
  };

  const handleRemoveRequirement = (id: string) => {
    setRequirements(requirements.filter(req => req.id !== id));
  };

  const handleAddRequirement = () => {
    const newRequirement: CuttingRequirement = {
      id: `req-${Date.now()}`,
      length: 1.0,
      quantity: 1
    };
    setRequirements([...requirements, newRequirement]);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-neutral-dark mb-3">Cutting Requirements</h3>
      
      <div id="cuttingRequirements">
        {requirements.map((req) => (
          <div key={req.id} className="flex items-center space-x-2 mb-3">
            <Input
              type="number"
              placeholder="Length (m)"
              value={req.length}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value) && value > 0) {
                  handleLengthChange(req.id, value);
                }
              }}
              min="0.1"
              step="0.1"
              className="flex-grow p-2 border border-neutral-medium rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Input
              type="number"
              placeholder="Quantity"
              value={req.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  handleQuantityChange(req.id, value);
                }
              }}
              min="1"
              className="w-24 p-2 border border-neutral-medium rounded focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveRequirement(req.id)}
              className="p-2 text-error hover:bg-neutral-light rounded"
            >
              <MaterialSymbol name="delete" />
            </Button>
          </div>
        ))}
      </div>
      
      <Button
        variant="ghost"
        onClick={handleAddRequirement}
        className="flex items-center text-primary hover:bg-primary hover:bg-opacity-10 px-3 py-2 rounded"
      >
        <MaterialSymbol name="add" className="mr-1" />
        Add Another Length
      </Button>
    </div>
  );
}
