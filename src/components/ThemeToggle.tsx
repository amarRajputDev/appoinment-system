'use client'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn-secondary p-2 ${className}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
