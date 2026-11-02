import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teachback — Learn it by teaching it",
  description: "Explain it to Pip. Find out what you really understand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
