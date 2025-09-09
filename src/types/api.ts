import { SystemCode } from '@/types/systemCodes';

export interface ApiResponse<T = any> {
  code?: SystemCode;     
  message?: string;     
  data?: T;            
}
