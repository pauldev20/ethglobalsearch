"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import GraphRenderer from "./GraphRenderer";
import { Suspense } from "react";
import { useState } from "react";

export default function GraphModal({
    query,
    events,
    types,
    organizations,
    className,
}: { query: string; events: string; types: string; organizations: string; className: string }) {
	const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <div className="text-sm font-medium invisible">Label</div>
            <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
                <Dialog.Trigger asChild={true}>
                    <Button size="lg" className="cursor-pointer">
                        Open Graph
                    </Button>
                </Dialog.Trigger>

                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />

                    <Dialog.Content className="fixed inset-4 z-50 flex flex-col bg-white rounded-lg focus:outline-none">
                        <Dialog.Title className="text-lg font-semibold hidden">Graph</Dialog.Title>

                        <header className="flex items-center justify-between border-b px-4 py-3">
                            <Dialog.Close asChild={true}>
                                <button
                                    className="ml-auto inline-flex items-center justify-center rounded-full p-1 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                                    aria-label="Close dialog"
                                    type="button"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </Dialog.Close>
                        </header>

						{isOpen && <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground">Loading graph data...</div>}>
                        	<GraphRenderer query={query} events={events} types={types} organizations={organizations} />
						</Suspense>}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
