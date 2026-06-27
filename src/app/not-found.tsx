import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function NotFound() {
    return (
        <>
            <DotPattern
                className={cn("mask-[radial-gradient(500px_circle_at_center,white,transparent)]", "-z-10 opacity-40")}
            />

            <main className="flex min-h-[80vh] w-full flex-col items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="mb-4 text-6xl font-bold text-foreground sm:text-8xl">404</h1>
                    <h2 className="mb-6 text-2xl font-semibold text-foreground sm:text-3xl">Page Not Found</h2>
                    <p className="mb-8 text-lg text-muted-foreground">
                        Sorry, we couldn&apos;t find the page you&apos;re looking for.
                    </p>
                    <Button asChild={true}>
                        <Link href="/">← Back to Home</Link>
                    </Button>
                </div>
            </main>
        </>
    );
}
