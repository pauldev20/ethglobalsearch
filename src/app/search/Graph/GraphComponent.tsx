"use client";

import type { GraphData } from "@/lib/api";
import { forceCollide } from "d3-force";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef } from "react";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading Graph...</div>,
});

// biome-ignore lint/suspicious/noExplicitAny: react-force-graph API typing
type FGRef = any;

export default function GraphComponent({ graphData }: { graphData: GraphData }) {
    const fgRef = useRef<FGRef>(null);

    useEffect(() => {
        const fg = fgRef.current;
        if (!fg) return;
        fg.d3Force("charge")?.strength(-220);
        fg.d3Force("link")?.distance(70);
        // Explicit collide force — guarantees no node overlap, so hit-areas don't collide.
        fg.d3Force("collide", forceCollide(16));
        fg.d3ReheatSimulation?.();
    }, [graphData]);

    const safeData = useMemo(() => {
        const seen = new Set<string>();
        const nodes = graphData.nodes
            .filter((n) => {
                if (seen.has(n.id)) return false;
                seen.add(n.id);
                return true;
            })
            .map((n) => ({ ...n }));
        const links = graphData.links
            .filter((l) => seen.has(l.source) && seen.has(l.target) && l.source !== l.target)
            .map((l) => ({ ...l }));
        return { nodes, links };
    }, [graphData]);

    return (
        <ForceGraph2D
            ref={fgRef}
            graphData={safeData}
            nodeId="id"
            // biome-ignore lint/suspicious/noExplicitAny: no other way
            nodeLabel={(node: any) => node.name || node.id}
            nodeColor={() => "#8b5cf6"}
            nodeRelSize={6}
            nodeVal={1}
            // biome-ignore lint/suspicious/noExplicitAny: no other way
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                if (typeof node.x !== "number" || typeof node.y !== "number") return;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 14, 0, 2 * Math.PI, false);
                ctx.fill();
            }}
            linkColor={() => "rgba(150, 150, 150, 0.2)"}
            // biome-ignore lint/suspicious/noExplicitAny: no other way
            linkWidth={(link: any) => (link.similarity_score || link.value || 0.5) * 2}
            linkPointerAreaPaint={() => {}}
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
