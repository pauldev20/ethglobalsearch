import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import GraphRenderer from "./GraphRenderer";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";


export default async function GraphModal({ query, events, types, organizations, className }: { query: string, events: string, types: string, organizations: string, className: string }) {
	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<Button className={cn("cursor-pointer", className)}>Open Graph</Button>
			</Dialog.Trigger>

			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />

				<Dialog.Content className="fixed inset-4 z-50 flex flex-col bg-white rounded-lg focus:outline-none">
					<Dialog.Title className="text-lg font-semibold hidden">Graph</Dialog.Title>
					
					<header className="flex items-center justify-between border-b px-4 py-3">
						<Dialog.Close asChild>
							<button
								className="ml-auto inline-flex items-center justify-center rounded-full p-1 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
								aria-label="Close dialog"
							>
								<X className="h-5 w-5" />
							</button>
						</Dialog.Close>
					</header>
					
					<GraphRenderer query={query} events={events} types={types} organizations={organizations} />
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
