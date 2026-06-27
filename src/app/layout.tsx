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
            <body className={`${fontSans.variable} min-h-screen bg-background font-sans antialiased flex flex-col overflow-x-clip`}>
                <Navbar />
                <main className="flex-1 flex flex-col">{children}</main>
                <footer className="border-t border-border/40 py-4 mt-8">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-center text-sm text-muted-foreground">
                        <a
                            href="https://pauldev.sh/imprint"
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-foreground transition-colors"
                        >
                            Imprint
                        </a>
                    </div>
                </footer>
            </body>
            {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && process.env.NEXT_PUBLIC_UMAMI_URL && (
                <Script
                    async={true}
                    defer={true}
                    src="/stats/script.js"
                    data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
                    data-host-url="/stats"
                    data-performance="true"
                />
            )}
        </html>
    );
}
