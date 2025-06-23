import React, { ReactNode } from 'react';

export type AlertType = 'error' | 'success' | 'warning';

interface AlertProps {
  type: AlertType;
  message: string | ReactNode;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  if (!message) return null;
  
  // Configuration for different alert types
  const config = {
    error: {
      bgColor: 'bg-[#2B2538]',
      borderColor: 'border-red-500',
      textColor: 'text-red-500',
      iconPath: (
        <path 
          fillRule="evenodd" 
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd" 
        />
      )
    },
    success: {
      bgColor: 'bg-[#121E24]',
      borderColor: 'border-green-500',
      textColor: 'text-green-500',
      iconPath: (
        <>
          <circle cx="10" cy="10" r="8" fill="currentColor" />
          <path 
            d="M7 10l1.5 1.5 4-4"
            stroke="#121E24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )
    },
    warning: {
      bgColor: 'bg-yellow-900/20',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-200',
      iconPath: (
        <path 
          fillRule="evenodd" 
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      )
    }
  };

  const { bgColor, borderColor, textColor, iconPath } = config[type];

  return (
    <div className={`mb-6 p-3 ${bgColor} border ${borderColor} rounded-lg flex items-center gap-2`}>
      <svg 
      xmlns="http://www.w3.org/2000/svg" 
      className={`h-5 w-5 ${textColor} flex-shrink-0`} 
      viewBox="0 0 20 20" 
      fill="currentColor"
      >
      {iconPath}
      </svg>
      <span className={`text-sm ${textColor} text-left`}>{message}</span>
      {onClose && (
      <button 
        onClick={onClose} 
        className="ml-auto text-gray-400 hover:text-gray-200"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path 
          fillRule="evenodd" 
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
          clipRule="evenodd" 
        />
        </svg>
      </button>
      )}
    </div>
  );
};

export default Alert;