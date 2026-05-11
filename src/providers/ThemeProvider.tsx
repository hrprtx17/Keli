'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
