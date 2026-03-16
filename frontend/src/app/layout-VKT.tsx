import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Serveify - Find Trusted Service Providers",
  description: "Book verified plumbers, electricians, cleaners and more near you.",
  keywords: ["services", "booking", "marketplace", "providers"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07111f",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
