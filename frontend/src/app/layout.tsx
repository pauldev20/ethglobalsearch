import { DotPattern } from "@/components/ui/dot-pattern";
import { Inter as FontSans } from "next/font/google";
import { Navbar } from "@/components/Navbar";
import type { Metadata } from "next";
import { cn } from "@/lib/utils";

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
            <body className={`${fontSans.variable} h-screen bg-background font-sans antialiased flex flex-col overflow-hidden`}>
                <Navbar />

				{/* Dot Pattern Background */}
				<DotPattern
					className={cn(
						"mask-[radial-gradient(500px_circle_at_center,white,transparent)] sm:mask-[radial-gradient(600px_circle_at_center,white,transparent)]",
					)}
				/>

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </body>
        </html>
    );
}
