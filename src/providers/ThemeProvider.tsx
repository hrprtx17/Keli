'use client';

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  // Completely eliminating next-themes injection logic temporarily to fully bypass 
  // the React 19 / Next 15 Turbopack console-error script injection crash overlay.
  // The site defaults fully and correctly to light-mode naturally.
  return <>{children}</>;
}
