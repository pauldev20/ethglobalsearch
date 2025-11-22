"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/SearchBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

interface Project {
	id: string;
	score: number;
}

export default function Search() {
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;

	// Mock data - replace with your API call
	const data: Project[] = Array.from({ length: 50 }, (_, i) => ({
		id: `project-${i + 1}`,
		score: Math.random() * 100
	}));

	const totalPages = Math.ceil(data.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentProjects = data.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

    return (
        <main className="w-full min-h-full">
			{/* Header Section */}
			<div className="w-full">
				<div className="max-w-7xl mx-auto p-4">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
						Find a Project
					</h1>
					<p className="text-lg text-muted-foreground mb-8">
						Check out the projects created at past events
					</p>
					<SearchBar />
				</div>
			</div>

			{/* Filter Bar */}
			<div className="sticky z-40 w-full">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
						<span className="text-sm text-muted-foreground">
							Showing <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(endIndex, data.length)}</span> of <span className="font-semibold text-foreground">{data.length}</span> projects
						</span>
						
						<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
							<Select>
								<SelectTrigger className="w-full sm:w-[180px] h-10 text-sm bg-card border-border">
									<SelectValue placeholder="Select events" />
								</SelectTrigger>
								<SelectContent className="bg-card">
									<SelectItem value="all">All Events</SelectItem>
									<SelectItem value="bangkok">ETHGlobal Bangkok</SelectItem>
									<SelectItem value="san-francisco">ETHGlobal San Francisco</SelectItem>
									<SelectItem value="singapore">ETHGlobal Singapore</SelectItem>
									<SelectItem value="paris">ETHGlobal Paris</SelectItem>
									<SelectItem value="taipei">ETHGlobal Taipei</SelectItem>
									<SelectItem value="denver">ETHGlobal Denver</SelectItem>
								</SelectContent>
							</Select>

							<Select>
								<SelectTrigger className="w-full sm:w-[180px] h-10 text-sm bg-card border-border">
									<SelectValue placeholder="All Categories" />
								</SelectTrigger>
								<SelectContent className="bg-card">
									<SelectItem value="all">All Categories</SelectItem>
									<SelectItem value="defi">DeFi</SelectItem>
									<SelectItem value="nft">NFTs</SelectItem>
									<SelectItem value="dao">DAOs</SelectItem>
									<SelectItem value="zk">ZK</SelectItem>
									<SelectItem value="infrastructure">Infrastructure</SelectItem>
									<SelectItem value="gaming">Gaming</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</div>

			<hr className="my-4 border-t border-border" />

			{/* Projects Grid */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{currentProjects.map((project: Project) => (
						<a 
							key={project.id}
							href={`/project/${project.id}`}
							className="group block"
						>
							<Card className="overflow-hidden border-2 bg-card transition-all hover:shadow-xl hover:border-foreground/20 h-full">
								{/* Project Image */}
								<div className="aspect-video w-full bg-linear-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 relative overflow-hidden">
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-6xl opacity-20">{project.id}</span>
									</div>
									{/* Hover overlay */}
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
								</div>
								
								{/* Project Info */}
								<div className="p-5 space-y-3">
									<div className="flex items-start justify-between gap-2">
										<h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
											{project.id}
										</h3>
									</div>
									
									<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
										{project.id}
									</p>
									
									<div className="flex items-center justify-between pt-2">
										<Badge variant="secondary" className="text-xs">
											{project.id}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{project.id}
										</span>
									</div>
								</div>
							</Card>
						</a>
					))}
				</div>

				{/* Pagination */}
				{totalPages > 1 && (
					<div className="mt-12 flex justify-center">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious 
										onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
										className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
									/>
								</PaginationItem>

								{/* First page */}
								<PaginationItem>
									<PaginationLink 
										onClick={() => handlePageChange(1)}
										isActive={currentPage === 1}
										className="cursor-pointer"
									>
										1
									</PaginationLink>
								</PaginationItem>

								{/* Ellipsis before current page */}
								{currentPage > 3 && (
									<PaginationItem>
										<PaginationEllipsis />
									</PaginationItem>
								)}

								{/* Pages around current page */}
								{Array.from({ length: totalPages }, (_, i) => i + 1)
									.filter(page => {
										if (page === 1 || page === totalPages) return false;
										return Math.abs(page - currentPage) <= 1;
									})
									.map(page => (
										<PaginationItem key={page}>
											<PaginationLink
												onClick={() => handlePageChange(page)}
												isActive={currentPage === page}
												className="cursor-pointer"
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									))
								}

								{/* Ellipsis after current page */}
								{currentPage < totalPages - 2 && (
									<PaginationItem>
										<PaginationEllipsis />
									</PaginationItem>
								)}

								{/* Last page */}
								{totalPages > 1 && (
									<PaginationItem>
										<PaginationLink
											onClick={() => handlePageChange(totalPages)}
											isActive={currentPage === totalPages}
											className="cursor-pointer"
										>
											{totalPages}
										</PaginationLink>
									</PaginationItem>
								)}

								<PaginationItem>
									<PaginationNext
										onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
										className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
				)}
			</div>
        </main>
    );
}
