import { type GraphData, getGraph } from "@/lib/api";
import GraphComponent from "./GraphComponent";

export default async function GraphRenderer({
    query,
    events,
    types,
    organizations,
}: { query: string; events: string; types: string; organizations: string }) {
    const graphData: GraphData = await getGraph(query, events, types, organizations, 0.85);

    return (
        <div className="w-full max-h-full h-full flex items-center justify-center relative overflow-hidden">
            {graphData.nodes.length > 0 ? (
                <GraphComponent graphData={graphData} />
            ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Loading graph data...
                </div>
            )}
        </div>
    );
}
