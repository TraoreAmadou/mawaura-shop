import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./cart-context";
import { Navbar } from "@/components/Navbar";
import { FavoritesProvider } from "./favorites-context";
import AuthSessionProvider from "@/components/AuthSessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mawaura Accessories",
    template: "%s — Mawaura Accessories",
  },
  description: "Bijoux pour révéler votre aura.",
  icons: {
    icon: [{ url: "/icon.png" }],
    shortcut: ["/favicon.ico"],
    // apple: [{ url: "/apple-icon.png" }],
  },
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white text-zinc-900`}
      >
        <AuthSessionProvider>
          <CartProvider>
            <FavoritesProvider>
              <Navbar />
              <div className="pt-16">{children}</div>
            </FavoritesProvider>
          </CartProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
