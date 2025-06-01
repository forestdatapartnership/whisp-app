import React from 'react';
import Alert from './Alert';

interface SuccessAlertProps {
  successMessage: string;
  clearSuccessMessage: () => void;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ successMessage, clearSuccessMessage }) => {
    if (!successMessage) return null;
    
    return (
        <Alert
            type="success"
            message={successMessage}
            onClose={clearSuccessMessage}
        />
    );
};

export default SuccessAlert;
