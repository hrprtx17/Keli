import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import SessionProvider from "@/providers/SessionProvider";
import { ThemeProviderWrapper } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keli AI",
  description: "Train custom AI agents on your data. Deploy to your website in minutes.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%23FF6B35'/><text x='50' y='68' font-size='56' font-family='system-ui, -apple-system, sans-serif' font-weight='900' fill='white' text-anchor='middle'>K</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${outfit.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProviderWrapper>
          <SessionProvider>
            <QueryProvider>
              {children}
              <Toaster richColors closeButton theme="light" />
            </QueryProvider>
          </SessionProvider>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
