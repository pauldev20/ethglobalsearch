"use client";

import { type GraphData, getGraphNext } from "@/lib/api";
import { useEffect, useState } from "react";
import GraphComponent from "./GraphComponent";

export default function GraphRenderer({
    query,
    events,
    types,
    organizations,
}: { query: string; events: string; types: string; organizations: string }) {
    const [graphData, setGraphData] = useState<GraphData | undefined>(undefined);
    useEffect(() => {
        getGraphNext(query, events, types, organizations, 0.82).then((data) => {
            setGraphData(data);
        });
    }, [query, events, types, organizations]);

    return (
        <div className="w-full max-h-full h-full flex items-center justify-center relative overflow-hidden">
            {graphData && graphData.nodes.length > 0 ? (
                <GraphComponent graphData={graphData} />
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading graph data...
                </div>
            )}
        </div>
    );
}
