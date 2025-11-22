"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/SearchBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from 'use-debounce';


export function SearchHeader({ startIndex, endIndex, total }: { startIndex: number, endIndex: number, total: number }) {
	const searchParams = useSearchParams();
  	const pathname = usePathname();
  	const { replace } = useRouter();
	
	const handleSearch = useDebouncedCallback((query: string) => {
		const params = new URLSearchParams(searchParams);
		if (query) {
			params.set("q", query);
		} else {
			params.delete("q");
		}
		replace(`${pathname}?${params.toString()}`);
	}, 500);

	return (
		<>
			{/* Header Section */}
			<div className="w-full">
				<div className="max-w-7xl mx-auto p-4">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
						Find a Project
					</h1>
					<p className="text-lg text-muted-foreground mb-8">
						Check out the projects created at past events
					</p>
					<SearchBar value={searchParams.get("q") ?? ""} onChange={handleSearch} />
				</div>
			</div>

			{/* Filter Bar */}
			<div className="sticky z-40 w-full">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
						<span className="text-sm text-muted-foreground">
							Showing <span className="font-semibold text-foreground">{startIndex + 1}-{endIndex}</span> of <span className="font-semibold text-foreground">{total}</span> projects
						</span>
						
						<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
							<Select>
								<SelectTrigger className="w-full sm:w-[180px] h-10 text-sm bg-card">
									<SelectValue placeholder="Select events" />
								</SelectTrigger>
								<SelectContent>
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
		</>
	);
}
