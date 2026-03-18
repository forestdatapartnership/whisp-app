import React from 'react';
import { useStore } from '@/store';

export const ManualInput: React.FC = () => {
    const geoIds = useStore().geoIds;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const lines = e.target.value.split(/\n/);
        useStore.setState({ error: '', geoIds: lines });
    };

    return (
        <textarea
            value={geoIds.join('\n')}
            onChange={handleChange}
            placeholder="Enter one Geo ID per line"
            rows={8}
            className="w-full p-2 border bg-gray-900 border-gray-300 rounded resize-y font-mono text-sm"
        />
    );
};