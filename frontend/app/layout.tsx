import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMC Report Generator",
  description: "Generate student minimum competency reports securely.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
