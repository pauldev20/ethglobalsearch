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
        // 0.5 matches the raw-cosine scale the RAG embeddings store (top similar
        // pairs sit ~0.5-0.6). The old 0.82 was an Elasticsearch-score threshold
        // and produced an almost edgeless graph here.
        getGraphNext(query, events, types, organizations, 0.5).then((data) => {
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
