import { searchProjects, SearchResponse, Project } from "@/lib/api";
import { PaginationComponent } from "./Pagination";
import { ProjectCard } from "./ProjectCard";


export async function ProjectsGrid({ query, page, events, types, organizations }: { query?: string, page?: number, events?: string, types?: string, organizations?: string }) {
	let data = null;
	let pagination = null;
	if (query != undefined && page != undefined && events != undefined && types != undefined && organizations != undefined) {
		const jsonData: SearchResponse | [] = await searchProjects(query, page, 30, events, types, organizations);
		data = jsonData.results;
		pagination = jsonData.pagination;
		console.log(data?.[0].highlights);
	}

	const startIndex = pagination ? (pagination.page - 1) * pagination.page_size : 0;
	const endIndex = pagination ? Math.min(startIndex + (data?.length || 0), pagination.total) : 0;
	const total = pagination?.total || 0;


	return (
		<>
			{/* Results Count */}
			{pagination && data && data.length > 0 && (
				<div className="mb-6">
					<span className="text-sm text-muted-foreground">
						Showing <span className="font-semibold text-foreground">{startIndex + 1}-{endIndex}</span> of <span className="font-semibold text-foreground">{total}</span> projects
					</span>
				</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{data && data.map((project: Project) => (
					<ProjectCard key={project.uuid} project={project} highlights={project.highlights} />
				))}
				{data === null && (
					Array.from({ length: 6 }).map((_, index) => (
						<ProjectCard key={index} project={undefined} />
					))
				)}
			{(data === undefined || data?.length === 0) && (
				<div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
					<div className="text-6xl mb-4">🔍</div>
					<h3 className="text-xl font-semibold mb-2">No projects found</h3>
					<p className="text-muted-foreground max-w-md text-center">
						We searched everywhere but couldn't find any projects matching your criteria. Try adjusting your filters or search terms.
					</p>
				</div>
			)}
			</div>

			{/* Pagination */}
			{(page && pagination?.total_pages) && <div className="mt-12 flex justify-center">
				<PaginationComponent currentPage={page} totalPages={pagination.total_pages} />
			</div>}
		</>
	);
}
