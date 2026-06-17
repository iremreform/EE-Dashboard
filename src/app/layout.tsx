import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Energetic Exotics Portal",
  description: "Driver and admin portal for Energetic Exotics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
