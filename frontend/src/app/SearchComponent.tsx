"use client";

import { SearchBar } from "@/components/SearchBar";
import { useRouter, useSearchParams } from "next/navigation";

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

    return <SearchBar onSearch={handleSearch} />;
}
