"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from 'use-debounce';


export function SelectFilter({ data, placeholder, queryParam }: { data: string[], placeholder: string, queryParam: string }) {
	const searchParams = useSearchParams();
  	const pathname = usePathname();
  	const { replace } = useRouter();
	
	const handleSelect = useDebouncedCallback((value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set(queryParam, value);
		replace(`${pathname}?${params.toString()}`);
	}, 100);

	return (
		<Select onValueChange={handleSelect} value={searchParams.get(queryParam) ?? undefined}>
			<SelectTrigger className="w-full sm:w-[180px] h-10 text-sm bg-card">
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent>
				{data.map((item) => (
					<SelectItem key={item} value={item}>{item}</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
