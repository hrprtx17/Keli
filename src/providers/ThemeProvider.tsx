'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light" 
      forcedTheme="light"
      enableSystem={false} 
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
