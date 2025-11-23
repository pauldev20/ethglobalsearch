"use client";

import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { redirect, usePathname, useSearchParams } from "next/navigation";

export function ClearFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const handleClick = async () => {
        const params = new URLSearchParams(searchParams);
        params.delete("events");
        params.delete("types");
        params.delete("organizations");
        params.delete("page");
        redirect(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col gap-1">
            <div className="text-sm font-medium invisible">Label</div>
            <button
                type="button"
                className="flex items-center gap-1 h-10 text-sm font-medium text-gray-700 bg-transparent border-none shadow-none px-2 py-1 hover:underline focus:outline-none cursor-pointer"
                onClick={handleClick}
            >
                <FontAwesomeIcon icon={faXmarkCircle} className="w-4 h-4 text-gray-500" />
                Clear Filters
            </button>
        </div>
    );
}
