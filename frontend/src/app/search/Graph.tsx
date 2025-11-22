import { getGraph, GraphData } from "@/lib/api";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading Graph...</div>
});

export default async function Graph() {
	const graphData: GraphData = await getGraph();

	return (
		<div className="flex-1 w-full relative overflow-hidden">
			{graphData.nodes.length > 0 ? (
				<ForceGraph2D
					width={800}
					height={600}
					graphData={graphData}
					nodeLabel="name"
					nodeColor={() => "#8b5cf6"} // Purple color
					nodeRelSize={6}
					linkColor={() => "rgba(150, 150, 150, 0.2)"}
					linkWidth={(link: any) => (link.similarity_score || link.value || 0.5) * 2}
					backgroundColor="rgba(0,0,0,0)"
					d3VelocityDecay={0.3}
					cooldownTicks={100}
					onNodeClick={(node: any) => {
						if (node.id) {
							window.location.href = `/project/${node.id}`;
						}
					}}
				/>
			) : (
				<div className="flex items-center justify-center h-full text-muted-foreground">
					Loading graph data...
				</div>
			)}
		</div>
	);
}
