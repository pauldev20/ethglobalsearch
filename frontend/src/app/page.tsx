import { SearchBar } from "@/components/SearchBar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { DotPattern } from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";

const PROJECTS = [
  {
    name: "DeFi Protocol",
    category: "DeFi",
    prize: "1st Place",
    description:
      "Next-generation decentralized exchange with automated market making",
    hackathon: "ETHGlobal Bangkok",
  },
  {
    name: "ZK Rollup Chain",
    category: "Infrastructure",
    prize: "2nd Place",
    description:
      "Scalable Layer 2 solution using zero-knowledge proofs",
    hackathon: "ETHGlobal San Francisco",
  },
  {
    name: "NFT Marketplace",
    category: "NFTs",
    prize: "3rd Place",
    description:
      "Cross-chain NFT marketplace with instant settlements",
    hackathon: "ETHGlobal Taipei",
  },
  {
    name: "DAO Governance Tool",
    category: "DAOs",
    prize: "Finalist",
    description:
      "Decentralized governance platform with quadratic voting",
    hackathon: "ETHGlobal Denver",
  },
  {
    name: "Privacy Protocol",
    category: "ZK",
    prize: "Finalist",
    description:
      "Privacy-preserving smart contracts using zero-knowledge proofs",
    hackathon: "ETHGlobal Paris",
  },
  {
    name: "Social DApp",
    category: "Social",
    prize: "Finalist",
    description:
      "Decentralized social media platform on Ethereum",
    hackathon: "ETHGlobal Istanbul",
  },
  {
    name: "Lending Platform",
    category: "DeFi",
    prize: "Finalist",
    description:
      "Peer-to-peer lending with dynamic interest rates",
    hackathon: "ETHGlobal Waterloo",
  },
  {
    name: "Identity Solution",
    category: "Identity",
    prize: "Finalist",
    description:
      "Self-sovereign identity management system",
    hackathon: "ETHGlobal New York",
  },
  {
    name: "Gaming Platform",
    category: "Gaming",
    prize: "Finalist",
    description:
      "On-chain gaming with NFT rewards and achievements",
    hackathon: "ETHGlobal Tokyo",
  },
  {
    name: "Supply Chain Tracker",
    category: "Enterprise",
    prize: "Finalist",
    description:
      "Blockchain-based supply chain transparency solution",
    hackathon: "ETHGlobal London",
  },
] as const;

type Project = (typeof PROJECTS)[number];

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="group relative flex h-full flex-col rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-foreground hover:shadow-lg sm:rounded-2xl sm:p-6">
      <div className="mb-3 inline-flex flex-wrap items-center gap-2 sm:mb-4">
        <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground sm:px-3">
          {project.prize}
        </span>
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground sm:px-3">
          {project.category}
        </span>
      </div>

      <div className="grow space-y-2 sm:space-y-3">
        <h3 className="text-lg font-bold text-foreground group-hover:underline sm:text-xl">
          {project.name}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
        <p className="text-xs text-muted-foreground/70">
          {project.hackathon}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:mt-4">
        <span>View project</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <DotPattern
        className={cn(
          "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
          "sm:mask-[radial-gradient(600px_circle_at_center,white,transparent)]",
          "-z-10",
        )}
      />

      <main className="relative flex-1 flex w-full flex-col items-center justify-center py-8 sm:py-16">
        <div className="relative z-10 w-full max-w-7xl space-y-12 px-4 sm:space-y-16 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mx-auto max-w-4xl">
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-xl bg-linear-to-r from-purple-600 via-blue-600 to-pink-600 blur opacity-0 transition-opacity duration-500 group-hover:opacity-30 group-focus-within:opacity-40 sm:rounded-2xl" />
              <SearchBar />
            </div>
          </div>

          {/* Latest Finalists */}
          <div className="space-y-6 sm:space-y-8">
            <div className="relative flex w-full items-center px-2 space-y-0">
              <div className="grow border-t border-foreground/20" />
              <h2 className="shrink-0 whitespace-nowrap px-4 text-lg font-bold text-foreground sm:px-6 sm:text-1xl md:text-2xl">
                Latest Finalists
              </h2>
              <div className="grow border-t border-foreground/20" />
            </div>

            <Carousel
              opts={{ align: "start", loop: true }}
              className="w-full px-1"
            >
              <CarouselContent className="-ml-2 sm:-ml-4">
                {PROJECTS.map((project, idx) => (
                  <CarouselItem
                    key={idx}
                    className="basis-full pl-2 sm:basis-1/2 sm:pl-4 lg:basis-1/3 xl:basis-1/4"
                  >
                    <ProjectCard project={project} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              <CarouselPrevious className="-left-8 hidden lg:-left-12 lg:flex" />
              <CarouselNext className="-right-8 hidden lg:-right-12 lg:flex" />
            </Carousel>
          </div>
        </div>
      </main>
    </>
  );
}