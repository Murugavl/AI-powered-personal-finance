"use client"; // This is a client component

import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs"; 
import { ClientLayout } from "@/components/ClientLayout";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastContainer } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css"; 
import Head from "next/head"; 

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
        <Head>
          <title>FINANCe</title> {/* Title should now update correctly */}
          <meta name="description" content="Your personal finance management tool" />
        </Head>
        <body className="font-sans">
          <ThemeProvider>
            <ClientLayout>{children}</ClientLayout> 
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
