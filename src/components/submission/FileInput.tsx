'use client'

import { Dropzone } from '../ui/Dropzone';
import { useConfig } from '@/lib/contexts/ConfigContext';
import { formatDropzoneError } from '@/lib/utils/dropzoneUtils';
import { Accept, FileRejection } from 'react-dropzone';

type FileInputProps = {
    innerMessage: string;
    alertMessage?: string;
    accept: Accept;
    handleFileChange: <T extends File>(file: T) => void;
    fileName: string;
    onError: (error: string) => void;
    disabled?: boolean;
};

export const FileInput: React.FC<FileInputProps> = ({
    innerMessage,
    alertMessage,
    accept,
    handleFileChange,
    fileName,
    onError,
    disabled,
}) => {
    const { config } = useConfig();
    const maxFileSize = config.maxUploadFileSizeKb ? config.maxUploadFileSizeKb * 1024 : undefined;

    return (
        <>
            {alertMessage && (
                <div style={{ minHeight: '2rem' }} className="bg-yellow-50 mb-4 relative flex justify-center items-center">
                    <p className="text-gray-700 dark:text-gray-800 text-center">{alertMessage}</p>
                </div>
            )}
            <Dropzone
                disabled={disabled}
                maxFiles={1}
                maxSize={maxFileSize}
                dropZoneClassName="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer"
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
                {() => (
                    <>
                        {fileName ? (
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-gray-300 mb-2">
                                    <img src="/map-icon.svg" alt="map-icon" width={80} height={80} />
                                </div>
                                <p className="text-sm text-gray-300">{fileName}</p>
                            </div>
                        ) : (
                            <div className="text-gray-300 flex flex-col items-center justify-center">
                                <p>Drag or click to upload a file</p>
                                <p className="text-xs">{innerMessage}</p>
                            </div>
                        )}
                    </>
                )}
            </Dropzone>
        </>
    );
};
