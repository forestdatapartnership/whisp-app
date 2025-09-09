import { SystemError } from '@/types/systemError';
import { SystemCode } from '@/types/systemCodes';

/**
 * Validates that all required fields are present in the request body
 * @param body - The request body object
 * @param requiredFields - Array of required field names
 * @throws SystemError with only the missing fields listed
 */
export function validateRequiredFields(body: any, requiredFields: string[]): void {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  if (missingFields.length > 0) {
    throw new SystemError(SystemCode.VALIDATION_MISSING_REQUIRED_FIELDS, [missingFields.join(', ')]);
  }
}

