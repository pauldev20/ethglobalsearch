import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Search() {
    return (
        <div>
            <h1>Search</h1>
			{/* Filter Toolbar */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 px-1">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<span className="font-medium">10 projects</span>
							</div>
							
							<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
								<Select>
									<SelectTrigger className="w-full sm:w-[160px] h-9 text-sm bg-background">
										<SelectValue placeholder="All Events" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Events</SelectItem>
										<SelectItem value="singapore-2024">Singapore 2024</SelectItem>
										<SelectItem value="brussels">Brussels</SelectItem>
										<SelectItem value="san-francisco">San Francisco</SelectItem>
										<SelectItem value="new-york">New York</SelectItem>
										<SelectItem value="bangkok">Bangkok</SelectItem>
										<SelectItem value="paris">Paris</SelectItem>
										<SelectItem value="denver">Denver</SelectItem>
										<SelectItem value="tokyo">Tokyo</SelectItem>
										<SelectItem value="london">London</SelectItem>
									</SelectContent>
								</Select>

								<Select>
									<SelectTrigger className="w-full sm:w-[160px] h-9 text-sm bg-background">
										<SelectValue placeholder="All Protocols" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Protocols</SelectItem>
										<SelectItem value="ethereum">Ethereum</SelectItem>
										<SelectItem value="polygon">Polygon</SelectItem>
										<SelectItem value="optimism">Optimism</SelectItem>
										<SelectItem value="arbitrum">Arbitrum</SelectItem>
										<SelectItem value="base">Base</SelectItem>
										<SelectItem value="scroll">Scroll</SelectItem>
										<SelectItem value="zksync">zkSync</SelectItem>
										<SelectItem value="chainlink">Chainlink</SelectItem>
										<SelectItem value="worldcoin">Worldcoin</SelectItem>
										<SelectItem value="uniswap">Uniswap</SelectItem>
										<SelectItem value="aave">Aave</SelectItem>
									</SelectContent>
								</Select>

								<button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors h-9 px-3 hidden sm:block">
									Clear
								</button>
							</div>
						</div>
        </div>
    );
}