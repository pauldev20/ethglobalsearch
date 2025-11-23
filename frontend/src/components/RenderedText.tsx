import Markdown from "react-markdown";
import { cn } from "@/lib/utils";


export function RenderedText({ text, className }: { text: string; className?: string }) {
    return (
        <Markdown
            className={cn(
                "prose max-w-full text-pretty font-sans",
                "text-xs sm:text-sm",
                "space-y-2.5",
                className,
            )}
        >
            {text}
        </Markdown>
    );
}
