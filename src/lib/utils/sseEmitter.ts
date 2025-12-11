import { EventEmitter } from 'events';

class SSEEmitter extends EventEmitter {
  emit(token: string, data: any): boolean {
    return super.emit(token, data);
  }

  subscribe(token: string, handler: (data: any) => void): () => void {
    this.on(token, handler);
    return () => this.off(token, handler);
  }
}

export const sseEmitter = new SSEEmitter();

