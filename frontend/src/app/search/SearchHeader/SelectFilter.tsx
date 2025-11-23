"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";


export function SelectFilter({ data, placeholder, queryParam, label }: { data: string[], placeholder: string, queryParam: string, label?: string }) {
	const searchParams = useSearchParams();
  	const pathname = usePathname();
  	const { replace } = useRouter();
	
	const handleSelect = (value: string) => {
		const params = new URLSearchParams(searchParams);
		params.set(queryParam, value);
		params.delete('page');
		replace(`${pathname}?${params.toString()}`);
	};

	return (
		<div className="flex flex-col gap-1">
			{label && <label className="text-sm font-medium">{label}</label>}
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
		</div>
	);
}
