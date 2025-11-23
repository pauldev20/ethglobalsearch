import { getGraph } from "@/lib/api";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const body = await request.json();
    const query = body.query;
    const events = body.events;
    const types = body.types;
    const organizations = body.organizations;
    const threshold = body.threshold;

    const graphData = await getGraph(
        query ?? "",
        events ?? "",
        types ?? "",
        organizations ?? "",
        Number(threshold ?? 0.82),
    );
    return NextResponse.json(graphData);
}
