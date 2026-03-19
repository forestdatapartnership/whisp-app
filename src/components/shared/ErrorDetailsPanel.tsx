'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { AlertTriangle, ChevronDown } from 'lucide-react';

interface ErrorDetailsPanelProps {
    cause: string;
}

export default function ErrorDetailsPanel({ cause }: ErrorDetailsPanelProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="w-full mt-2">
            <Collapsible open={open} onOpenChange={setOpen}>
                <div className="border border-gray-300 bg-gray-800 rounded">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                            <span className="flex items-center gap-2 text-sm font-medium">
                                <AlertTriangle className="h-4 w-4" />
                                Error details
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="p-3">
                            <div className="bg-gray-900 border border-gray-700 rounded-md p-3 max-h-48 overflow-y-auto text-left">
                                <p className="text-sm text-gray-200 whitespace-pre-wrap font-mono">{cause}</p>
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>
        </div>
    );
}
