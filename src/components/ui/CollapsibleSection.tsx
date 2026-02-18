'use client';

import type { ReactNode } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { ChevronDown } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  id?: string;
  className?: string;
  children: ReactNode;
}

export function CollapsibleSection({ title, defaultOpen = false, id, className, children }: CollapsibleSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} id={id} className={className}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-1 text-left text-sm font-medium text-gray-400 hover:text-gray-300">
        <ChevronDown className="h-4 w-4 transition-transform [[data-state=open]_&]:rotate-180" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2 pl-6">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
