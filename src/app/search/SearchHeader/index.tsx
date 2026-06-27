import type { TypesResponse } from "@/lib/api";
import Graph from "../Graph";
import { ClearFilters } from "./ClearFilters";
import { Search } from "./Search";
import { SelectFilter } from "./SelectFilter";

export function SearchHeader({
    typesData,
    query,
    events,
    types,
    organizations,
}: { typesData: TypesResponse; query: string; events: string; types: string; organizations: string }) {
    return (
        <>
            {/* Header Section */}
            <div className="w-full">
                <div className="max-w-7xl mx-auto px-6 py-6 sm:p-4">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-3">
                        Find a Project
                    </h1>
                    <p className="text-lg text-muted-foreground mb-6 sm:mb-8">
                        Check out the projects created at past events
                    </p>
                    <Search />
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky z-40 w-full">
                <div className="max-w-7xl mx-auto px-6 sm:px-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 sm:gap-3">
                        <div className="flex flex-wrap items-end gap-3 sm:gap-3 w-full">
                            <SelectFilter
                                label="Events"
                                data={typesData.event_names}
                                placeholder="Select events"
                                queryParam="events"
                                className="w-full! sm:max-w-[200px]!"
                            />
                            <SelectFilter
                                label="Categories"
                                data={typesData.types}
                                placeholder="Select categories"
                                queryParam="types"
                                className="w-full! sm:max-w-[200px]!"
                            />
                            <SelectFilter
                                label="Organizations"
                                data={typesData.sponsor_organizations}
                                placeholder="Select organizations"
                                queryParam="organizations"
                                className="w-full sm:max-w-[200px]"
                            />
                            <ClearFilters />
                            <Graph
                                query={query}
                                events={events}
                                types={types}
                                organizations={organizations}
                                className="ml-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="my-6 sm:my-4 border-t border-foreground/20" />
        </>
    );
}
