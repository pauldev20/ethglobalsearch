import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function Home() {
    return (
        <main className="relative flex min-h-full w-full flex-col items-center justify-center py-8 sm:py-16">
			{/* Content Container */}
			<div className="relative z-10 w-full max-w-7xl space-y-12 sm:space-y-16 px-4 sm:px-6 lg:px-8">

				{/* Search Section */}
				<div className="max-w-4xl mx-auto">
					<div className="relative group">
						{/* Glowing Effect */}
						<div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 via-blue-600 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-0 group-hover:opacity-30 group-focus-within:opacity-40 transition-opacity duration-500" />
						
						{/* Search Input Container */}
						<div className="relative backdrop-blur-xl bg-white/90 dark:bg-black/50 rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-focus-within:shadow-purple-500/20 group-focus-within:ring-purple-500/30">
							<input 
								name="search" 
								placeholder="Search ETHGlobal projects..." 
								className="block w-full h-12 sm:h-14 md:h-16 px-5 pl-14 sm:pl-16 md:pl-20 text-sm sm:text-base md:text-lg appearance-none bg-transparent focus:outline-none transition-all placeholder:text-muted-foreground/60" 
								style={{
									backgroundImage: `url("/search.svg")`,
									backgroundPosition: `left 1.25rem center`,
									backgroundRepeat: 'no-repeat',
									backgroundSize: '18px 18px',
								}} 
								type="text" 
								autoFocus
							/>
						</div>
					</div>
				</div>

				{/* Latest Finalists Section */}
				<div className="space-y-6 sm:space-y-8">
					{/* Section Header with Filters */}
					<div className="space-y-4">
						{/* Title */}
						<div className="relative flex items-center w-full px-2">
							<div className="grow border-t border-border" />
							<h2 className="shrink-0 px-4 sm:px-6 text-lg sm:text-1xl md:text-2xl font-bold text-foreground whitespace-nowrap">
								Latest Finalists
							</h2>
							<div className="grow border-t border-border" />
						</div>
					</div>
					
					<Carousel
						opts={{
							align: "start",
							loop: true,
						}}
						className="w-full px-1"
					>
						<CarouselContent className="-ml-2 sm:-ml-4">
							{[
								{ 
									name: 'DeFi Protocol', 
									category: 'DeFi', 
									prize: '1st Place',
									description: 'Next-generation decentralized exchange with automated market making',
									hackathon: 'ETHGlobal Bangkok'
								},
								{ 
									name: 'ZK Rollup Chain', 
									category: 'Infrastructure', 
									prize: '2nd Place',
									description: 'Scalable Layer 2 solution using zero-knowledge proofs',
									hackathon: 'ETHGlobal San Francisco'
								},
								{ 
									name: 'NFT Marketplace', 
									category: 'NFTs', 
									prize: '3rd Place',
									description: 'Cross-chain NFT marketplace with instant settlements',
									hackathon: 'ETHGlobal Taipei'
								},
								{ 
									name: 'DAO Governance Tool', 
									category: 'DAOs', 
									prize: 'Finalist',
									description: 'Decentralized governance platform with quadratic voting',
									hackathon: 'ETHGlobal Denver'
								},
								{ 
									name: 'Privacy Protocol', 
									category: 'ZK', 
									prize: 'Finalist',
									description: 'Privacy-preserving smart contracts using zero-knowledge proofs',
									hackathon: 'ETHGlobal Paris'
								},
								{ 
									name: 'Social DApp', 
									category: 'Social', 
									prize: 'Finalist',
									description: 'Decentralized social media platform on Ethereum',
									hackathon: 'ETHGlobal Istanbul'
								},
								{ 
									name: 'Lending Platform', 
									category: 'DeFi', 
									prize: 'Finalist',
									description: 'Peer-to-peer lending with dynamic interest rates',
									hackathon: 'ETHGlobal Waterloo'
								},
								{ 
									name: 'Identity Solution', 
									category: 'Identity', 
									prize: 'Finalist',
									description: 'Self-sovereign identity management system',
									hackathon: 'ETHGlobal New York'
								},
								{ 
									name: 'Gaming Platform', 
									category: 'Gaming', 
									prize: 'Finalist',
									description: 'On-chain gaming with NFT rewards and achievements',
									hackathon: 'ETHGlobal Tokyo'
								},
								{ 
									name: 'Supply Chain Tracker', 
									category: 'Enterprise', 
									prize: 'Finalist',
									description: 'Blockchain-based supply chain transparency solution',
									hackathon: 'ETHGlobal London'
								},
							].map((project, idx) => (
								<CarouselItem key={idx} className="pl-2 sm:pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
									<div className="group relative rounded-xl sm:rounded-2xl border-2 border-border bg-card p-4 sm:p-6 transition-all hover:border-foreground hover:shadow-lg h-full flex flex-col">
										{/* Prize Badge */}
										<div className="inline-flex items-center gap-2 mb-3 sm:mb-4 flex-wrap">
											<span className="px-2.5 sm:px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
												{project.prize}
											</span>
											<span className="px-2.5 sm:px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
												{project.category}
											</span>
										</div>
										
										{/* Project Info */}
										<div className="space-y-2 sm:space-y-3 grow">
											<h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:underline">
												{project.name}
											</h3>
											<p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
												{project.description}
											</p>
											<p className="text-xs text-muted-foreground/70">
												{project.hackathon}
											</p>
										</div>

										{/* View Arrow */}
										<div className="mt-3 sm:mt-4 flex items-center gap-2 text-sm font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
											<span>View project</span>
											<span className="group-hover:translate-x-1 transition-transform">→</span>
										</div>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="-left-8 lg:-left-12 hidden lg:flex" />
						<CarouselNext className="-right-8 lg:-right-12 hidden lg:flex" />
					</Carousel>
				</div>
			</div>
        </main>
    );
}
