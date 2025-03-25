import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Create the app with or without StrictMode
const AppWithProviders = () => (
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)

// Conditionally apply StrictMode only in production
// This eliminates React 18 StrictMode double-rendering in development
// which causes issues with ReactQuill's findDOMNode usage
const isDevelopment = import.meta.env.DEV

createRoot(document.getElementById('root')!).render(
  isDevelopment ? (
    <AppWithProviders />
  ) : (
    <StrictMode>
      <AppWithProviders />
    </StrictMode>
  )
)
