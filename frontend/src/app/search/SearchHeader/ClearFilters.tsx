"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { faXmarkCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";


export function ClearFilters() {
	const searchParams = useSearchParams();
  	const pathname = usePathname();
  	const { replace } = useRouter();

	const handleClick = () => {
		const params = new URLSearchParams(searchParams);
		params.delete('events');
		params.delete('types');
		params.delete('organizations');
		params.delete('page');
		replace(`${pathname}?${params.toString()}`);
	};

	return (
		<button
			type="button"
			className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-transparent border-none shadow-none px-2 py-1 hover:underline focus:outline-none cursor-pointer"
			onClick={handleClick}
		>
			<FontAwesomeIcon icon={faXmarkCircle} className="w-4 h-4 text-gray-500" />
			Clear Filters
		</button>
	);
}
