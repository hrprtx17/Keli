import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import SessionProvider from "@/providers/SessionProvider";
import { ThemeProviderWrapper } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keli AI",
  description: "Train custom AI agents on your data. Deploy to your website in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} antialiased`} suppressHydrationWarning>
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
