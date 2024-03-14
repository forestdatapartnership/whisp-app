'use client'

import Image from 'next/image';
import { useStore } from '@/store';


type FileInputProps = {
    innerMessage: string, 
    alertMessage: string,
    input: string,
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const FileInput: React.FC<FileInputProps> = ({
    innerMessage,
    alertMessage,
    handleFileChange,
    input
}) => {

    const { selectedFile } = useStore();

    return (
        <>
            <div className="h-8 bg-yellow-50 mb-4 relative flex justify-center items-center">
                <p className="text-gray-700 dark:text-gray-800">{alertMessage}</p>
            </div>
            <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer">
                {
                    selectedFile ?
                        (
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-gray-300 mb-2">
                                    <Image
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
                            <div className="text-gray-300 flex flex-col items-center justify-center">
                                <p>Click to upload a file</p>
                                <p className="text-xs">{innerMessage}</p>
                            </div>
                        )
                }
                <input
                    id="file-upload"
                    type="file"
                    accept={input}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </label>
        </>
    )
}