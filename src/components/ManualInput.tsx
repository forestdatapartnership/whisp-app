import React from 'react';
import { useStore } from '@/store';

export const ManualInput: React.FC = () => {

    const geoIds = useStore().geoIds;

    const handleInputChange = (index: number, value: string) => {
        const newGeoIds = [...geoIds];
        newGeoIds[index] = value;
        useStore.setState({ error: '', geoIds: newGeoIds });
    };

    const addGeoIdInput = (index: number) => {
            const newGeoIds = [...geoIds];
            newGeoIds.splice(index + 1, 0, '');
            useStore.setState({ geoIds: newGeoIds });
    };

    return (
        <div className="space-y-2">
            {geoIds.map((geoId, index)  => (
                <div key={index} className="flex items-center">
                    <input
                        type="text"
                        value={geoId}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        className="p-2 border bg-gray-900 border-gray-300 rounded flex-1"
                    />
                    <button
                        onClick={() => addGeoIdInput(index)}
                        className="ml-2 p-2 bg-blue-500 text-white rounded"
                    >
                        +
                    </button>
                </div>
            ))}
        </div>
    );
};