import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fantasy MMAdness V2",
  description: "Fantasy combat sports prediction contests for MMA, boxing, kickboxing, and bare-knuckle fans.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
