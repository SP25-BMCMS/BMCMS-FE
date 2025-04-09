/// <reference types="vite/client" />

declare module 'path';
declare module 'url';

interface ImportMeta {
  readonly url: string;
}
