"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";


export default function SearchComponent() {
	const searchParams = useSearchParams();
  	const { replace } = useRouter();

	const handleSearch = (query: string) => {
		const params = new URLSearchParams(searchParams);
		if (query) {
			params.set("q", query);
		}
		replace(`/search?${params.toString()}`);
	};

	return (
		<SearchBar onSearch={handleSearch} />
	);
}
