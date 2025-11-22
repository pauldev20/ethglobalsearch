"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from 'use-debounce';
import { SearchBar } from "@/components/SearchBar";


export function Search() {
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
		<SearchBar value={searchParams.get("q") ?? ""} onChange={handleSearch} />
	);
}
