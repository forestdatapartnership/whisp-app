'use client'

import { useStore } from '@/store';
import { Dropzone, DropzoneState } from '../ui/Dropzone';
import { getMaxFileSize } from '@/lib/utils/configUtils';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { parseGeoIdFile } from '@/lib/utils/fileParser';
import { Accept, FileRejection } from 'react-dropzone';

interface GeoIdInputProps {
    maxGeometryLimit: number;
}

export const GeoIdInput: React.FC<GeoIdInputProps> = ({ maxGeometryLimit }) => {
    const { geoIds, selectedFile } = useStore();
    const { config } = useConfig();
    const maxFileSize = getMaxFileSize(config);
    const accept: Accept = { 'text/plain': ['.txt'] };

    const handleFileChange = async (file: File) => {
        useStore.setState({ error: '' });
        const result = await parseGeoIdFile(file);
        if (result && 'error' in result) {
            useStore.setState({ error: result.error, selectedFile: '' });
        } else {
            const count = result.length;
            if (count > maxGeometryLimit) {
                useStore.setState({
                    error: `Too many Geo IDs. Maximum allowed is ${maxGeometryLimit} features.`,
                    selectedFile: '',
                    geoIds: [''],
                });
            } else {
                useStore.setState({ geometry: result, geoIds: result, selectedFile: file.name });
            }
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const lines = e.target.value.split(/\n/);
        useStore.setState({ error: '', geoIds: lines, selectedFile: '' });
    };

    return (
        <div className="flex flex-col gap-4">
            <Dropzone
                maxFiles={1}
                maxSize={maxFileSize}
                showFilesList={false}
                dropZoneClassName="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer"
                accept={accept}
                onDrop={(acceptedFiles: File[], fileRejections: FileRejection[]) => {
                    if (fileRejections.length > 0) {
                        const err = fileRejections[0].errors[0];
                        if (err.code === 'file-too-large') {
                            err.message = `The file is too large: ${(fileRejections[0].file.size / 1024).toFixed(2)} KB, the maximum file size allowed is ${((maxFileSize || 0) / 1024).toFixed(2)} KB.`;
                        }
                        useStore.setState({ error: err.message });
                    } else if (acceptedFiles.length === 1) {
                        handleFileChange(acceptedFiles[0]);
                    }
                }}
                onError={(err: Error) => {
                    useStore.setState({ error: err.message });
                }}
            >
                {(dropzone: DropzoneState) => (
                    <>
                        {selectedFile ? (
                            <div className="flex flex-col items-center justify-center text-gray-300">
                                <img
                                    onClick={() => useStore.setState({ error: '' })}
                                    src="/map-icon.svg"
                                    alt="map-icon"
                                    width={48}
                                    height={48}
                                    className="mb-1 cursor-pointer"
                                />
                                <p className="text-sm">{selectedFile}</p>
                            </div>
                        ) : (
                            <div className="text-gray-300 flex flex-col items-center justify-center text-center px-4">
                                <p>Drag and drop a .txt file here, or click to browse</p>
                                <p className="text-xs mt-1">Accepted format: .txt file with one Geo ID per line</p>
                            </div>
                        )}
                    </>
                )}
            </Dropzone>

            <p className="text-center text-sm text-gray-400">or paste below</p>

            <textarea
                value={geoIds.join('\n')}
                onChange={handleTextareaChange}
                placeholder="Enter one Geo ID per line"
                rows={8}
                className="w-full p-2 border bg-gray-900 border-gray-300 rounded resize-y font-mono text-sm"
            />
        </div>
    );
};
