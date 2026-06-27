"use client";

import { SearchBar } from "@/components/SearchBar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

export function Search() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((query: string) => {
        const params = new URLSearchParams(searchParams);
        if (query) {
            params.set("q", query);
            params.delete("page");
        } else {
            params.delete("q");
            params.delete("page");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 500);

    return <SearchBar value={searchParams.get("q") ?? ""} onChange={handleSearch} />;
}
