'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Database, ChevronDown } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import type { CollectionInfo } from '@/types/assetRegistry';

interface CollectionPickerProps {
    collections: CollectionInfo[];
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
}

export default function CollectionPicker({ collections, value, onChange, loading }: CollectionPickerProps) {
    const [open, setOpen] = useState(true);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <div className="border border-gray-300 bg-gray-800 rounded">
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <Database className="h-4 w-4" />
                            Collection
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="p-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 text-left block pl-2">Collection</label>
                            <Select value={value} onValueChange={onChange}>
                                <SelectTrigger className="bg-gray-900 border-gray-600">
                                    <SelectValue placeholder={loading ? 'Loading...' : 'Select collection'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {collections.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
