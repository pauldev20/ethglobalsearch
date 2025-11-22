import { PaginationComponent } from "./Pagination";
import { ProjectsGrid } from "./ProjectsGrid";
import { SearchHeader } from "./SearchHeader";
import { getTypes } from "@/lib/api";
import { Suspense } from "react";


export default async function Search(props: {
  searchParams?: Promise<{
    q?: string;
    page?: string;
	events?: string;
	types?: string;
	organizations?: string;
  }>;
}) {
  	const searchParams = await props.searchParams;
  	const query = searchParams?.q || '';
	const currentPage = Number(searchParams?.page) || 1;
	const events = searchParams?.events || '';
	const types = searchParams?.types || '';
	const organizations = searchParams?.organizations || '';

	const typesData = await getTypes();

    return (
        <main className="w-full min-h-full">
			<SearchHeader typesData={typesData} />

			{/* Projects Grid */}
			<div className="max-w-7xl mx-auto px-4 pb-8">
				<Suspense key={query + currentPage + events + types + organizations} fallback={<ProjectsGrid />}>
					<ProjectsGrid query={query} page={currentPage} events={events} types={types} organizations={organizations} />
				</Suspense>
			</div>
        </main>
    );
}
