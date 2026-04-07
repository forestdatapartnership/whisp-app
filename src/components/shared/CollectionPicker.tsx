'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible';
import { Database, ChevronDown, RefreshCw } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { useCollections } from '@/lib/hooks/useCollections';

interface CollectionPickerProps {
    value: string;
    onChange: (collection: string) => void;
}

export default function CollectionPicker({ value, onChange }: CollectionPickerProps) {
    const { collections, collection, setCollection, loading, reload } = useCollections();
    const [open, setOpen] = useState(true);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        if (collection) onChangeRef.current(collection);
    }, [collection]);

    const handleChange = (val: string) => {
        setCollection(val);
        onChange(val);
    };

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
                            <div className="flex items-center gap-2">
                                <Select value={value} onValueChange={handleChange}>
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={reload}
                                    disabled={loading}
                                    className="shrink-0 h-9 w-9"
                                    title="Refresh collections"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
