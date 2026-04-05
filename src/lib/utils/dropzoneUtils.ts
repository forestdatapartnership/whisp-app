import { FileRejection } from 'react-dropzone';

export function formatDropzoneError(rejection: FileRejection, maxFileSize?: number): string {
  const err = rejection.errors[0];
  if (err.code === 'file-too-large') {
    const fileSizeKB = (rejection.file.size / 1024).toFixed(2);
    const maxKB = ((maxFileSize || 0) / 1024).toFixed(2);
    return `The file is too large: ${fileSizeKB} KB, the maximum file size allowed is ${maxKB} KB.`;
  }
  return err.message;
}
