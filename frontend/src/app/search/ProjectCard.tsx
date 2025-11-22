import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Project } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";


export function ProjectCard({ project }: { project?: Project }) {
	if (!project) {
		return (
			<Card className="overflow-hidden border-2 bg-card h-full animate-pulse pt-0">
				{/* Skeleton Image */}
				<div className="aspect-video w-full bg-muted" />
				
				{/* Skeleton Info */}
				<div className="p-5 space-y-3">
					<div className="flex items-start justify-between gap-2">
						<div className="h-7 bg-muted rounded w-3/4" />
					</div>
					
					<div className="space-y-2">
						<div className="h-4 bg-muted rounded w-full" />
						<div className="h-4 bg-muted rounded w-2/3" />
					</div>
					
					<div className="flex items-center justify-between pt-2">
						<div className="h-5 bg-muted rounded w-24" />
						<div className="h-4 bg-muted rounded w-20" />
					</div>
				</div>
			</Card>
		);
	}

	return (
		<Link
			key={project.uuid}
			href={`/search/${project.uuid}`}
		>
			<Card className="overflow-hidden border-2 bg-card transition-all hover:shadow-xl hover:border-foreground/20 h-full pt-0">
				{/* Project Image */}
				<div className="aspect-video w-full bg-linear-to-br from-purple-100 via-blue-100 to-pink-100 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-pink-900/20 relative overflow-hidden">
					{!project.banner_url && (
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="text-6xl opacity-20">{project.name}</span>
						</div>
					)}
					{project.banner_url && (
						<Image
							src={project.banner_url}
							alt={project.name}
							fill
							className="object-cover"
							sizes="(min-width: 1024px) 369px, (min-width: 640px) 286px, 100vw"
							priority={false}
						/>
					)}
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
						{project.tagline}
					</p>
					
					<div className="flex items-center justify-between pt-2">
						<Badge variant="secondary" className="text-xs">
							{project.event_name}
						</Badge>
						<span className="text-xs text-muted-foreground">
							{project.source_code_url}
						</span>
					</div>
				</div>
			</Card>
		</Link>
	);
}