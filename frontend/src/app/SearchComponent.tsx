"use client";

import { SearchBar } from "@/components/SearchBar";
import { redirect } from "next/navigation";


export default function SearchComponent() {
    const handleSearch = (query: string) => {
        if (query) {
            redirect(`/search?q=${query}`);
        }
    };

    return <SearchBar onSearch={handleSearch} />;
}
