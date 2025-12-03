import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./cart-context";
import { Navbar } from "@/components/Navbar";
import { FavoritesProvider } from "./favorites-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mawaura Accessories",
  description: "Bijoux pour révéler votre aura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartProvider>
          <FavoritesProvider>
            <Navbar />
            <div className="pt-16">{children}</div>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
