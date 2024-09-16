'use client'

import { useStore } from '@/store';
import { Dropzone, DropzoneState } from './ui/Dropzone';
import { getMaxFileSize } from '@/lib/utils';
import { Accept, FileRejection } from 'react-dropzone';

type FileInputProps = {
    innerMessage: string,
    alertMessage?: string,
    accept: Accept,
    handleFileChange:<T extends File>(file: T) => void
}

export const FileInput: React.FC<FileInputProps> = ({
    innerMessage,
    alertMessage,
    handleFileChange,
    accept
}) => {
    const { selectedFile } = useStore();
    const maxFileSize = getMaxFileSize();
    return (
        <>
    {alertMessage &&
                <div style={{ minHeight: '2rem' }} className="bg-yellow-50 mb-4 relative flex justify-center items-center">
                    <p className="text-gray-700 dark:text-gray-800 text-center">{alertMessage}</p>
                </div>
            }        
    <Dropzone maxFiles={1} maxSize={maxFileSize}
        dropZoneClassName='flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer'
        accept={accept}
        onDrop={(acceptedFiles: File[], fileRejections: FileRejection[]) => {
            if (fileRejections.length > 0) {
                let error = fileRejections[0].errors[0];
                if (error.code === "file-too-large") {
                    error.message = `The file is too large: ${(fileRejections[0].file.size/1024).toFixed(2)} KB, the maximum file size allowed is ${((maxFileSize||0)/1024).toFixed(2)} KB.`;
                    useStore.setState({ error: error.message });
                }
                else { 
                    useStore.setState({ error: error.message });
                }
            }
            else if (acceptedFiles.length==1) {
                handleFileChange(acceptedFiles[0]);
            }
        }}
        onError={(err : Error) => {
            console.log(err.message);
            useStore.setState({ error: err.message });
        }}>
        {(dropzone: DropzoneState) => (
        <>
        {
            selectedFile ?
            (
                <div className="flex flex-col items-center justify-center">
                                <div className="text-gray-300 mb-2">
                                    <img
                                        onClick={() => useStore.setState({ error: '' })}
                                        src="/map-icon.svg"
                                        alt="map-icon"
                                        width={80}
                                        height={80}
                                    />
                                </div>
                                <p className="text-sm text-gray-300">{selectedFile}</p>
                            </div>
            ) : 
            (
                <div className='text-gray-300 flex flex-col items-center justify-center'>
                    <p>Drag or click to upload a file</p>
                    <p className="text-xs">{innerMessage}</p>
                </div>
            )
        }
        </>
        )}
    </Dropzone>
    </>
    )
}