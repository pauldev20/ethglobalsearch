"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import { Check } from "lucide-react";
import clsx from "clsx";


export function SelectFilter({ data, placeholder, queryParam, label }: { data: string[], placeholder: string, queryParam: string, label?: string }) {
	const searchParams = useSearchParams();
  	const pathname = usePathname();
  	const { replace } = useRouter();
	
	const currentValue = searchParams.get(queryParam);
	const selectedValues = currentValue ? currentValue.split(',') : [];
	
	const handleSelect = (value: string) => {
		const params = new URLSearchParams(searchParams);
		
		let newSelectedValues: string[];
		if (selectedValues.includes(value)) {
			newSelectedValues = selectedValues.filter(v => v !== value);
		} else {
			newSelectedValues = [...selectedValues, value];
		}
		
		if (newSelectedValues.length > 0) {
			params.set(queryParam, newSelectedValues.join(','));
		} else {
			params.delete(queryParam);
		}
		
		params.delete('page');
		replace(`${pathname}?${params.toString()}`);
	};

	const displayText = selectedValues.length > 0
		? selectedValues.length === 1
			? selectedValues[0]
			: `${selectedValues.length} selected`
		: placeholder;

	return (
		<div className="flex flex-col gap-1">
			{label && <label className="text-sm font-medium">{label}</label>}
			<Popover>
				<PopoverTrigger asChild={true}>
					<Button
						variant="outline"
						className="justify-between cursor-pointer"
					>
						<span className="truncate">{displayText}</span>
						<ChevronsUpDown className="opacity-50 ml-2 shrink-0" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput placeholder={placeholder} className="h-9" />
						<CommandList>
							<CommandEmpty>No results found.</CommandEmpty>
							<CommandGroup>
								{data.map((item) => (
									<CommandItem
										key={item}
										value={item}
										onSelect={() => handleSelect(item)}
										className="cursor-pointer"
									>
										{item}
										<Check
											className={clsx("ml-auto", selectedValues.includes(item) ? "opacity-100" : "opacity-0")}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}
