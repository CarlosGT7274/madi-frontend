import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  title: "Grupo MADI",
  description: "CRM MADI",
  icons: { icon: "/Logo.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${workSans.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
