import { Navbar } from "@/components/Navbar";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import Script from "next/script";

import "./globals.css";

import { pageData } from "@/pageData";

/* -------------------------------------------------------------------------- */
/*                                    Fonts                                   */
/* -------------------------------------------------------------------------- */
const fontSans = FontSans({
    subsets: ["latin"],
    variable: "--font-sans",
});

/* -------------------------------------------------------------------------- */
/*                                  Matadata                                  */
/* -------------------------------------------------------------------------- */
export const metadata: Metadata = {
    title: pageData.title,
    description: pageData.description,
};

/* -------------------------------------------------------------------------- */
/*                                   Layout                                   */
/* -------------------------------------------------------------------------- */
export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${fontSans.variable} min-h-screen bg-background font-sans antialiased flex flex-col`}>
                <Navbar />
                {children}
            </body>
            {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
                <Script
                    async={true}
                    defer={true}
                    src="/script.js"
                    data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
                />
            )}
        </html>
    );
}
