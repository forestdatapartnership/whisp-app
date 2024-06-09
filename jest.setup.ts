import { TextEncoder, TextDecoder } from 'util';

// Assign global types
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as unknown as {
  new (label?: string, options?: TextDecoderOptions): TextDecoder;
};

