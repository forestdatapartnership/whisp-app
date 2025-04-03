import React from 'react';
import Image from 'next/image';

interface ErrorAlertProps {
    error: string;
    clearError: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, clearError }) => {
    if (!error) return null;

    return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <div className="flex justify-start">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline" style={{ paddingRight: "30px" }}>{error}</span>
            </div>
            <span className="absolute top-0 bottom-0 right-0 flex items-center px-4 py-3">
                <Image
                    onClick={clearError}
                    src="/x-red.svg"
                    alt="Close"
                    className="cursor-pointer"
                    width={15}
                    height={15}
                />
            </span>
        </div>
    );
};

export default ErrorAlert;
