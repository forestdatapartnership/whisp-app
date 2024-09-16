import { cn } from "@/lib/utils"

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
    Upload,
    Document,
    Trash
}