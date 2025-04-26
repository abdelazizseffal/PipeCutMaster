import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MaterialSymbol } from './ui/MaterialSymbol';

interface StockPipeInputProps {
  stockLength: number;
  setStockLength: (length: number) => void;
  pipeDiameter: number;
  setPipeDiameter: (diameter: number) => void;
  kerfWidth: number;
  setKerfWidth: (width: number) => void;
  stockCount: number;
  setStockCount: (count: number) => void;
}

export function StockPipeInput({
  stockLength,
  setStockLength,
  pipeDiameter,
  setPipeDiameter,
  kerfWidth,
  setKerfWidth,
  stockCount,
  setStockCount
}: StockPipeInputProps) {
  const handleStockLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setStockLength(value);
    }
  };

  const handlePipeDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setPipeDiameter(value);
    }
  };

  const handleKerfWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setKerfWidth(value);
    }
  };

  const handleStockCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setStockCount(value);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-neutral-dark mb-3">Stock Pipe Properties</h3>
      
      <div className="mb-4">
        <Label htmlFor="stockLength" className="block text-sm font-medium text-neutral-gray mb-1">
          Standard Stock Length (meters)
        </Label>
        <Input
          id="stockLength"
          type="number"
          placeholder="Enter length"
          value={stockLength}
          onChange={handleStockLengthChange}
          min="0.1"
          step="0.1"
          className="w-full p-2 border border-neutral-medium rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div className="mb-4">
        <Label htmlFor="pipeDiameter" className="block text-sm font-medium text-neutral-gray mb-1">
          Pipe Diameter (mm)
        </Label>
        <Input
          id="pipeDiameter"
          type="number"
          placeholder="Enter diameter"
          value={pipeDiameter}
          onChange={handlePipeDiameterChange}
          min="1"
          className="w-full p-2 border border-neutral-medium rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div className="mb-4">
        <Label htmlFor="kerfWidth" className="block text-sm font-medium text-neutral-gray mb-1">
          Cutting Width (Kerf) (mm)
        </Label>
        <Input
          id="kerfWidth"
          type="number"
          placeholder="Enter cutting width"
          value={kerfWidth}
          onChange={handleKerfWidthChange}
          min="0.1"
          step="0.1"
          className="w-full p-2 border border-neutral-medium rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      
      <div className="mb-4">
        <Label htmlFor="stockCount" className="block text-sm font-medium text-neutral-gray mb-1">
          Available Stock Count
        </Label>
        <Input
          id="stockCount"
          type="number"
          placeholder="Enter quantity"
          value={stockCount}
          onChange={handleStockCountChange}
          min="1"
          className="w-full p-2 border border-neutral-medium rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}

export function ui() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MaterialSymbol name="settings" className="mr-2" />
          Input Parameters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <StockPipeInput
          stockLength={6}
          setStockLength={() => {}}
          pipeDiameter={50}
          setPipeDiameter={() => {}}
          kerfWidth={3}
          setKerfWidth={() => {}}
          stockCount={10}
          setStockCount={() => {}}
        />
      </CardContent>
    </Card>
  );
}
