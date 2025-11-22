import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

export function PaginationComponent({ currentPage, totalPages, handlePageChange }: { currentPage: number, totalPages: number, handlePageChange: (page: number) => void }) {
	return (
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
	);
}