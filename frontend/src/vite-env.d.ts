/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_REDIRECT_URI: string
  readonly VITE_GOOGLE_SCOPE: string
  readonly VITE_GOOGLE_ORIGIN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
