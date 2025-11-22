import { ProjectsComponent } from "./Projects";
import { SearchHeader } from "./SearchHeader";
import { Suspense } from "react";

export default async function Search(props: {
  searchParams?: Promise<{
    q?: string;
    page?: string;
  }>;
}) {
  	const searchParams = await props.searchParams;
  	const query = searchParams?.q || '';
	const currentPage = Number(searchParams?.page) || 1;

    return (
        <main className="w-full min-h-full">
			<SearchHeader startIndex={0} endIndex={0} total={0} />

			{/* Projects Grid */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				<Suspense key={query + currentPage} fallback={<div>Loading...</div>}>
					<ProjectsComponent query={query} page={currentPage} />
				</Suspense>

				{/* Pagination */}
				{0 > 1 && (
					<div className="mt-12 flex justify-center">
						{/* <PaginationComponent currentPage={currentPage} totalPages={totalPages} handlePageChange={handlePageChange} /> */}
					</div>
				)}
			</div>
        </main>
    );
}
