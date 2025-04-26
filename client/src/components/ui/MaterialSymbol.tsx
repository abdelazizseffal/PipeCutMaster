import React from 'react';
import { cn } from '@/lib/utils';

interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  filled?: boolean;
  weight?: number;
  grade?: number;
  size?: number;
}

export const MaterialSymbol = React.forwardRef<HTMLSpanElement, MaterialSymbolProps>(
  ({ name, filled = false, weight = 400, grade = 0, size = 24, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("material-symbols-outlined", className)}
        style={{
          fontVariationSettings: `
            'FILL' ${filled ? 1 : 0},
            'wght' ${weight},
            'GRAD' ${grade},
            'opsz' ${size}
          `
        }}
        {...props}
      >
        {name}
      </span>
    );
  }
);

MaterialSymbol.displayName = 'MaterialSymbol';
