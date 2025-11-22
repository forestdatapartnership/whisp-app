import { ReactNode } from 'react'

interface ProgressData {
  percent?: number
}

interface StatusCardProps {
  title: string
  message?: string
  children?: ReactNode
  showSpinner?: boolean
  hideBorder?: boolean
  progress?: ProgressData | null
}

export default function StatusCard({ 
  title, 
  message,
  children,
  showSpinner = false,
  hideBorder = false,
  progress = null
}: StatusCardProps) {
  const progressPercentage = progress?.percent !== undefined ? progress.percent : null;
  const displayMessage = progressPercentage === 100 ? "Loading your results" : message;

  return (
    <div className={`p-4 bg-gray-800 rounded shadow-md my-4 ${hideBorder ? '' : 'border border-gray-300'}`}>
      <div className="text-center py-8">
        <h1 className="text-2xl font-semibold text-white mb-4">{title}</h1>
        {showSpinner && (
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="flex items-center mb-3">
              <div className="spinner border-4 border-yellow-400 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
              <span className="ml-3 text-gray-300">{displayMessage}</span>
            </div>
            {progress && progressPercentage !== null && (
              <div className="w-full max-w-md">
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                  <div 
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mb-1">{progressPercentage}% complete</p>
              </div>
            )}
          </div>
        )}
        {message && !showSpinner && (
          <p className={`text-gray-300 ${children ? 'mb-4' : ''}`}>{message}</p>
        )}
        {children}
      </div>
    </div>
  )
}
