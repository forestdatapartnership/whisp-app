import { cn } from "@/lib/utils"

const Spinner = ({
    className,
  }: {
    className?: string
  }) => (
    <svg className={cn('animate-spin', className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )

const AlertTriangle = ({
    className,
  }: {
    className?: string
  }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('lucide lucide-triangle-alert', className)}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
      <path d="M12 9v4"/>
      <path d="M12 17h.01"/>
    </svg>
  )

const RefreshCw = ({
    className,
  }: {
    className?: string
  }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn('lucide lucide-refresh-cw', className)}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
      <path d="M21 3v5h-5"/>
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
      <path d="M8 16H3v5"/>
    </svg>
  )

const Upload = ({
    className,
  }: {
    className?: string
  }) => (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={cn('lucide lucide-upload', className)}>
      <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'/>
      <polyline points='17 8 12 3 7 8'/>
      <line x1='12' x2='12' y1='3' y2='15'/>
    </svg>
  )

const Document = ({
    className,
  }: {
    className?: string
  }) => (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={cn('lucide lucide-file-text', className)}>
      <path d='M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z'/>
      <path d='M14 2v4a2 2 0 0 0 2 2h4'/>
      <path d='M10 9H8'/>
      <path d='M16 13H8'/>
      <path d='M16 17H8'/>
    </svg>
  )

const Trash = ({
    className,
  }: {
    className?: string
  }) => (
    <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' className={cn('lucide lucide-trash', className)}>
      <path d='M3 6h18'/>
      <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6'/>
      <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2'/>
    </svg>
  )

export {
    Spinner,
    AlertTriangle,
    RefreshCw,
    Upload,
    Document,
    Trash
}