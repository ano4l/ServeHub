import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Serveify – Find Trusted Service Providers",
  description: "Book verified plumbers, electricians, cleaners and more near you.",
  keywords: ["services", "booking", "marketplace", "providers"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
