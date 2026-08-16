/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_DEMO_EMAIL?: string;
  readonly VITE_FREE_HOSTING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
