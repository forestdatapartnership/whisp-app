'use client'

import { Dropzone, DropzoneState } from '../ui/Dropzone';
import { getMaxFileSize } from '@/lib/utils/configUtils';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { parseGeoIdFile } from '@/lib/utils/fileParser';
import { formatDropzoneError } from '@/lib/utils/dropzoneUtils';
import { Accept, FileRejection } from 'react-dropzone';

interface GeoIdInputProps {
    value: string;
    onChange: (value: string) => void;
    fileName: string;
    onFileNameChange: (name: string) => void;
    onError: (error: string) => void;
}

export const GeoIdInput: React.FC<GeoIdInputProps> = ({
    value,
    onChange,
    fileName,
    onFileNameChange,
    onError,
}) => {
    const { config } = useConfig();
    const maxFileSize = getMaxFileSize(config);
    const accept: Accept = { 'text/plain': ['.txt'] };

    const handleFileChange = async (file: File) => {
        onError('');
        const result = await parseGeoIdFile(file);
        if (result && 'error' in result) {
            onError(result.error);
            onFileNameChange('');
        } else {
            onChange(result.join('\n'));
            onFileNameChange(file.name);
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        onFileNameChange('');
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
                        onError(formatDropzoneError(fileRejections[0], maxFileSize));
                    } else if (acceptedFiles.length === 1) {
                        handleFileChange(acceptedFiles[0]);
                    }
                }}
                onError={(err: Error) => onError(err.message)}
            >
                {(dropzone: DropzoneState) => (
                    <>
                        {fileName ? (
                            <div className="flex flex-col items-center justify-center text-gray-300">
                                <img
                                    src="/map-icon.svg"
                                    alt="map-icon"
                                    width={48}
                                    height={48}
                                    className="mb-1 cursor-pointer"
                                />
                                <p className="text-sm">{fileName}</p>
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
                value={value}
                onChange={handleTextareaChange}
                placeholder="Enter one Geo ID per line"
                rows={8}
                className="w-full p-2 border bg-gray-900 border-gray-300 rounded resize-y font-mono text-sm"
            />
        </div>
    );
};
