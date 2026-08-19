import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/context/ThemeContext";
import { CallProvider } from "@/context/CallContext";
import { CallOverlay } from "@/components/calls/CallOverlay";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DOST - Social Media App",
  description: "A modern social media app for real-time connection",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="app-container mesh-gradient-bg">
        <audio id="remoteAudio" autoPlay playsInline style={{ display: "none" }} />
        <ThemeProvider>
          <CallProvider>
            {children}
            <CallOverlay />
          </CallProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
