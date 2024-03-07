import React from 'react';
import Image from 'next/image';

interface SuccessAlertProps {
  successMessage: string;
  clearSuccessMessage: () => void; // Function to clear the message
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ successMessage, clearSuccessMessage }) => {
    return (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline" style={{ paddingRight: "30px" }} dangerouslySetInnerHTML={{ __html: successMessage }}></span>
            <span className="absolute top-0 bottom-0 right-0 flex items-center px-4 py-3">
                <Image
                    onClick={clearSuccessMessage}
                    src="/x-green.svg"
                    alt="Close"
                    width={15}
                    height={15}
                />
            </span>
        </div>
    );
};

export default SuccessAlert;
