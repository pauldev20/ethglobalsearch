import { ClearFilters } from "./ClearFilters";
import { SelectFilter } from "./SelectFilter";
import { TypesResponse } from "@/lib/api";
import { Search } from "./Search";
import Graph from "../Graph";


export function SearchHeader({ typesData, query, events, types, organizations }: { typesData: TypesResponse, query: string, events: string, types: string, organizations: string }) {
	return (
		<>
			{/* Header Section */}
			<div className="w-full">
				<div className="max-w-7xl mx-auto p-4">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3">
						Find a Project
					</h1>
					<p className="text-lg text-muted-foreground mb-8">
						Check out the projects created at past events
					</p>
					<Search />
				</div>
			</div>

			{/* Filter Bar */}
			<div className="sticky z-40 w-full">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
						<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
							<SelectFilter data={typesData.event_names} placeholder="Select events" queryParam="events" />
							<SelectFilter data={typesData.types} placeholder="Select categories" queryParam="types" />
							<SelectFilter data={typesData.sponsor_organizations} placeholder="Select organizations" queryParam="organizations" />
							<ClearFilters />
							<Graph query={query} events={events} types={types} organizations={organizations} className="ml-auto" />
						</div>
					</div>
				</div>
			</div>

			<hr className="my-4 border-t border-foreground/20" />
		</>
	);
}
