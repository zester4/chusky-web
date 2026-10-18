'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
  type ThemeProviderProps,
} from 'next-themes'

function SystemThemeSync() {
  const { theme } = useTheme()

  React.useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applySystemTheme = (isDark: boolean) => {
      const root = document.documentElement
      root.classList.toggle('dark', isDark)
      root.style.colorScheme = isDark ? 'dark' : 'light'
    }
    const handleChange = (event: MediaQueryListEvent) => applySystemTheme(event.matches)

    applySystemTheme(media.matches)
    media.addEventListener?.('change', handleChange)
    if (!media.addEventListener) media.addListener(handleChange)

    return () => {
      media.removeEventListener?.('change', handleChange)
      if (!media.removeEventListener) media.removeListener(handleChange)
    }
  }, [theme])

  return null
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider enableSystem enableColorScheme {...props}>
      <SystemThemeSync />
      {children}
    </NextThemesProvider>
  )
}
