import { ReactNode } from 'react'

interface StatusCardProps {
  title: string
  message?: string
  children?: ReactNode
  showSpinner?: boolean
  isLoading?: boolean
}

export default function StatusCard({ 
  title, 
  message,
  children,
  showSpinner = false,
  isLoading = false
}: StatusCardProps) {
  return (
    <div className="p-4 border border-gray-300 bg-gray-800 rounded shadow-md my-4">
      <div className={isLoading ? 'flex items-center justify-center py-8' : 'text-center py-8'}>
        {isLoading ? (
          <>
            <div className="spinner border-4 border-blue-500 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
            <span className="ml-3 text-white">{title}</span>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-white mb-4">{title}</h1>
            {showSpinner && (
              <div className="flex items-center justify-center mb-4">
                <div className="spinner border-4 border-yellow-400 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
                <span className="ml-3 text-gray-300">{message}</span>
              </div>
            )}
            {message && !showSpinner && (
              <p className={`text-gray-300 ${children ? 'mb-4' : ''}`}>{message}</p>
            )}
            {children}
          </>
        )}
      </div>
    </div>
  )
}
