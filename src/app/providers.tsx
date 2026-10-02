'use client'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { Toaster } from 'react-hot-toast'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '14px',
              border: '1px solid var(--line)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              boxShadow: 'var(--shadow)',
              fontSize: '0.9rem',
              fontWeight: 500,
            },
            success: {
              iconTheme: { primary: '#0f766e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#e11d48', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
