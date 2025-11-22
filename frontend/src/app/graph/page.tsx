"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading Graph...</div>
});

interface GraphNode {
    id: string;
    name: string;
    val: number;
}

interface GraphLink {
    source: string | GraphNode;
    target: string | GraphNode;
    value: number;
}

interface GraphData {
    nodes: GraphNode[];
    links: GraphLink[];
}

export default function GraphPage() {
    const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch graph data
        const fetchData = async () => {
            try {
                // Use the proxy path /api/graph which redirects to the backend
                // Note: The backend endpoint is /graph, so we might need to adjust the rewrite
                // or call /api/graph if the rewrite strips /api
                // Based on next.config.ts rewrite: /api/:path* -> https://backend.../:path*
                // So /api/graph -> https://backend.../graph
                const res = await fetch("/api/graph", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({}), // Sending empty body for now as per typical search/graph endpoints
                });
                if (!res.ok) throw new Error("Failed to fetch graph data");
                const graphData = await res.json();
                setData(graphData);
            } catch (error) {
                console.error("Error fetching graph data:", error);
            }
        };

        fetchData();

        // Handle resize
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener("resize", updateDimensions);
        updateDimensions();

        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    return (
        <main className="w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-background">
            <div className="p-4 border-b border-border">
                <h1 className="text-2xl font-bold">Project Similarity Graph</h1>
                <p className="text-muted-foreground text-sm">
                    Visualizing connections between projects based on similarity.
                </p>
            </div>

            <div ref={containerRef} className="flex-1 w-full relative overflow-hidden">
                {data.nodes.length > 0 ? (
                    <ForceGraph2D
                        width={dimensions.width}
                        height={dimensions.height}
                        graphData={data}
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
        </main>
    );
}
