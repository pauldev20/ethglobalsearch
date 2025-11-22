import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchBar } from "@/components/SearchBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Search() {
	const projects = [
		{
			id: 1,
			name: 'DeFi Protocol',
			description: 'Hand gestures to do micropayments using stablecoins gaslessly.',
			event: 'ETHGlobal Bangkok',
			category: 'DeFi',
			image: '/placeholder.jpg'
		},
		{
			id: 2,
			name: 'Chameleon Yield',
			description: 'Automated cross-chain yield optimization with real-time monitoring and user-defined guardrails.',
			event: 'ETHGlobal San Francisco',
			category: 'DeFi',
			image: '/placeholder.jpg'
		},
		{
			id: 3,
			name: 'CircuitChain',
			description: 'A blockchain explorer built for Sepolia testnet, combining simplicity, speed, and modern design.',
			event: 'ETHGlobal Singapore',
			category: 'Infrastructure',
			image: '/placeholder.jpg'
		},
		{
			id: 4,
			name: 'ZK Rollup Chain',
			description: 'Scalable Layer 2 solution using zero-knowledge proofs for enhanced privacy.',
			event: 'ETHGlobal Paris',
			category: 'ZK',
			image: '/placeholder.jpg'
		},
		{
			id: 5,
			name: 'NFT Marketplace',
			description: 'Cross-chain NFT marketplace with instant settlements and low fees.',
			event: 'ETHGlobal Taipei',
			category: 'NFTs',
			image: '/placeholder.jpg'
		},
		{
			id: 6,
			name: 'DAO Governance Tool',
			description: 'Decentralized governance platform with quadratic voting and proposal management.',
			event: 'ETHGlobal Denver',
			category: 'DAOs',
			image: '/placeholder.jpg'
		},
	];

    return (
        <main className="w-full min-h-full">
			{/* Header Section */}
			<div className="w-full">
				<div className="max-w-7xl mx-auto p-4">
					<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
						Find a Project
					</h1>
					<p className="text-lg text-muted-foreground mb-8">
						Check out the projects created at past events
					</p>
					<SearchBar />
				</div>
			</div>

			{/* Filter Bar */}
			<div className="sticky z-40 w-full">
				<div className="max-w-7xl mx-auto px-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
						<span className="text-sm text-muted-foreground">
							Showing <span className="font-semibold text-foreground">{projects.length} / 100</span> projects
						</span>
						
						<div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
							<Select>
								<SelectTrigger className="w-full sm:w-[180px] h-10 text-sm">
									<SelectValue placeholder="Select events" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Events</SelectItem>
									<SelectItem value="bangkok">ETHGlobal Bangkok</SelectItem>
									<SelectItem value="san-francisco">ETHGlobal San Francisco</SelectItem>
									<SelectItem value="singapore">ETHGlobal Singapore</SelectItem>
									<SelectItem value="paris">ETHGlobal Paris</SelectItem>
									<SelectItem value="taipei">ETHGlobal Taipei</SelectItem>
									<SelectItem value="denver">ETHGlobal Denver</SelectItem>
								</SelectContent>
							</Select>

							<Select>
								<SelectTrigger className="w-full sm:w-[180px] h-10 text-sm">
									<SelectValue placeholder="All Categories" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									<SelectItem value="defi">DeFi</SelectItem>
									<SelectItem value="nft">NFTs</SelectItem>
									<SelectItem value="dao">DAOs</SelectItem>
									<SelectItem value="zk">ZK</SelectItem>
									<SelectItem value="infrastructure">Infrastructure</SelectItem>
									<SelectItem value="gaming">Gaming</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</div>
			</div>

			{/* Projects Grid */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{projects.map((project) => (
						<a 
							key={project.id}
							href={`/project/${project.id}`}
							className="group block"
						>
							<Card className="overflow-hidden border-2 transition-all hover:shadow-xl hover:border-foreground/20 h-full">
								{/* Project Image */}
								<div className="aspect-video w-full bg-linear-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 relative overflow-hidden">
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-6xl opacity-20">{project.category.charAt(0)}</span>
									</div>
									{/* Hover overlay */}
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
								</div>
								
								{/* Project Info */}
								<div className="p-5 space-y-3">
									<div className="flex items-start justify-between gap-2">
										<h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
											{project.name}
										</h3>
									</div>
									
									<p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
										{project.description}
									</p>
									
									<div className="flex items-center justify-between pt-2">
										<Badge variant="secondary" className="text-xs">
											{project.category}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{project.event}
										</span>
									</div>
								</div>
							</Card>
						</a>
					))}
				</div>
			</div>
        </main>
    );
}