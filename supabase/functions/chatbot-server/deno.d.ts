/// <reference types="https://deno.land/x/types/index.d.ts" />

declare module "https://deno.land/std@1.0.11/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response>): void;
}

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
  }
  
  export const env: Env;
  
  export interface WebSocket {
    send(data: string): void;
    onmessage: (event: MessageEvent) => void;
    onopen: () => void;
    onclose: () => void;
    onerror: (error: Event) => void;
  }

  export function upgradeWebSocket(req: Request): {
    socket: WebSocket;
    response: Response;
  };
} 