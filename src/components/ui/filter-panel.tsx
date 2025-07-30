'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  children: ReactNode;
  title?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export function FilterPanel({
  children,
  title = 'Filters',
  defaultExpanded = true,
  className,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn('rounded-lg border bg-card shadow-sm', className)}>
      <div className="border-b p-4">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between p-0 h-auto font-semibold"
        >
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>{title}</span>
          </div>
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}
