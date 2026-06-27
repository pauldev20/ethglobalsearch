"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface SearchBarProps {
    onSearch?: (query: string) => void;
    onChange?: (query: string) => void;
    value?: string;
}

export function SearchBar({ onSearch, onChange, value }: SearchBarProps) {
    const [searchQuery, setSearchQuery] = useState(value ?? "");

    const handleClear = () => {
        setSearchQuery("");
        onChange?.("");
    };

    return (
        <div className="relative backdrop-blur-xl bg-white/90 rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-focus-within:shadow-purple-500/20 group-focus-within:ring-purple-500/30">
            <input
                name="search"
                placeholder="Search ETHGlobal projects..."
                className="block w-full h-12 md:h-14 px-5 pl-12 md:pl-14 pr-12 text-base md:text-lg appearance-none bg-transparent focus:outline-none transition-all placeholder:text-muted-foreground/60"
                style={{
                    backgroundImage: `url("/search.svg")`,
                    backgroundPosition: "left 1.25rem center",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "18px 18px",
                }}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                    setSearchQuery(e.target.value);
                    onChange?.(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        onSearch?.(searchQuery);
                    }
                }}
            />
            {searchQuery && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 cursor-pointer"
                    aria-label="Clear search"
                >
                    <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
