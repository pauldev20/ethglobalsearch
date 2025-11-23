"use client";

import type { GraphData } from "@/lib/api";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading Graph...</div>,
});

export default function GraphComponent({ graphData }: { graphData: GraphData }) {
    return (
        <ForceGraph2D
            graphData={graphData}
            nodeLabel="name"
            nodeColor={() => "#8b5cf6"}
            nodeRelSize={6}
            linkColor={() => "rgba(150, 150, 150, 0.2)"}
            // biome-ignore lint/suspicious/noExplicitAny: no other way
            linkWidth={(link: any) => (link.similarity_score || link.value || 0.5) * 2}
            backgroundColor="rgba(0,0,0,0)"
            d3VelocityDecay={0.3}
            linkDirectionalParticles={1.0}
            cooldownTicks={100}
            // biome-ignore lint/suspicious/noExplicitAny: no other way
            onNodeClick={(node: any) => {
                if (node.id) {
                    window.location.href = `/search/${node.id}`;
                }
            }}
        />
    );
}
