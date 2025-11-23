"use client";

import { useState } from "react";
import { chatQuery, type SearchResponse } from "@/lib/api";
import { ProjectCard } from "@/app/search/ProjectCard";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

export default function ChatPage() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) return;

		setLoading(true);
		setError(null);
		setResults(null);

		try {
			const response = await chatQuery(query);
			setResults(response);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to process query");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<DotPattern
				className={cn(
					"mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
					"sm:mask-[radial-gradient(600px_circle_at_center,white,transparent)]",
					"-z-10",
				)}
			/>

			<main className="relative flex-1 flex w-full flex-col items-center justify-center py-8 sm:py-16">
				<div className="relative z-10 w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="text-center space-y-4">
						<h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
							AI Chat Search
						</h1>
						<p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
							Ask questions in natural language and find relevant projects powered by 0G AI
						</p>
					</div>

					{/* Search Form */}
					<div className="mx-auto max-w-4xl">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="group relative">
								<div className="absolute -inset-0.5 rounded-xl bg-linear-to-r from-purple-600 via-blue-600 to-pink-600 blur opacity-0 transition-opacity duration-500 group-hover:opacity-30 group-focus-within:opacity-40 sm:rounded-2xl" />
								<div className="relative backdrop-blur-xl bg-white/90 rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-focus-within:shadow-purple-500/20 group-focus-within:ring-purple-500/30">
									<textarea
										value={query}
										onChange={(e) => setQuery(e.target.value)}
										placeholder="Ask me anything... e.g., 'Show me projects like Facebook' or 'Find DeFi protocols with lending'"
										className="block w-full min-h-[120px] px-5 py-4 text-base md:text-lg appearance-none bg-transparent focus:outline-none transition-all placeholder:text-muted-foreground/60 resize-none"
										disabled={loading}
									/>
								</div>
							</div>
							<div className="flex justify-center">
								<Button
									type="submit"
									size="lg"
									disabled={loading || !query.trim()}
									className="min-w-[120px]"
								>
									{loading ? "Searching..." : "Search"}
								</Button>
							</div>
						</form>
					</div>

					{/* Error Message */}
					{error && (
						<div className="mx-auto max-w-4xl">
							<div className="rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4 text-center">
								<p className="text-destructive font-medium">{error}</p>
							</div>
						</div>
					)}

					{/* Loading State */}
					{loading && (
						<div className="mx-auto max-w-7xl">
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
								{[...Array(4)].map((_, i) => (
									<ProjectCard key={i} />
								))}
							</div>
						</div>
					)}

					{/* Results */}
					{results && !loading && (
						<div className="space-y-6">
							<div className="text-center">
								<p className="text-muted-foreground">
									Found {results.pagination.total} result{results.pagination.total !== 1 ? "s" : ""}
								</p>
							</div>
							{results.results.length > 0 ? (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
									{results.results.map((project) => (
										<ProjectCard key={project.uuid} project={project} />
									))}
								</div>
							) : (
								<div className="text-center py-12">
									<p className="text-muted-foreground">No projects found. Try a different query.</p>
								</div>
							)}
						</div>
					)}
				</div>
			</main>
		</>
	);
}

