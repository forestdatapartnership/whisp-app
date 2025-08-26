export type StatusResponse = {
  status: 'completed' | 'failed' | 'processing' | 'not_found' | 'error'
  error?: string
  message?: string
  resultUrl?: string
}
