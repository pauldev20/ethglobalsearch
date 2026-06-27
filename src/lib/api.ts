import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface Prize {
    project_uuid: string;
    name: string;
    pool_prize: string;
    prize_name: string;
    prize_emoji: string;
    prize_type: string;
    sponsor_name: string;
    sponsor_organization_name: string;
    sponsor_organization_square_logo_url: string;
}

export interface Project {
    uuid: string;
    slug: string;
    emoji: string;
    name: string;
    tagline: string;
    description: string;
    how_its_made: string;
    source_code_url: string;
    url: string;
    event_name: string;
    logo_url: string;
    banner_url: string;
    screenshots: string[];
    video_file_url: string;
    video_mux_url: string;
    video_mux_thumbnail_url: string;
    primary_repository_url: string;
    prizes: Prize[];
    score: number;
    // biome-ignore lint/suspicious/noExplicitAny: no other way
    highlights: { [key: string]: any };
}

export interface SimilarProject {
    uuid: string;
    similarity_score: number;
}

export interface SearchResponse {
    results: Project[];
    pagination: {
        page: number;
        page_size: number;
        total: number;
        total_pages: number;
    };
}

export interface TypesResponse {
    types: string[];
    event_names: string[];
    sponsor_organizations: string[];
}

export interface GraphData {
    nodes: {
        id: string;
        name: string;
        event_name: string;
    }[];
    links: {
        source: string;
        target: string;
        similarity_score: number;
    }[];
}

export interface ChatResponse {
    message: string;
    projects: Project[];
}

/* -------------------------------------------------------------------------- */
/*                              Convex endpoints                              */
/* -------------------------------------------------------------------------- */

function splitCsv(v?: string): string[] | undefined {
    if (!v) return undefined;
    const parts = v.split(",").map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : undefined;
}

export const getSimilarProjects = async (uuid: string): Promise<Project[]> => {
    const data = await fetchQuery(api.projects.getSimilar, { uuid });
    return data as Project[];
};

export const getProject = async (uuid: string): Promise<Project> => {
    const data = await fetchQuery(api.projects.getByUuid, { uuid });
    return data as Project;
};

export const searchProjects = async (
    query: string,
    page: number,
    page_size: number,
    events?: string,
    types?: string,
    organizations?: string,
): Promise<SearchResponse> => {
    const data = await fetchQuery(api.projects.search, {
        query: query || undefined,
        event_name: splitCsv(events),
        prize_type: splitCsv(types),
        sponsor_organization: splitCsv(organizations),
        page,
        page_size,
    });
    return data as SearchResponse;
};

export const getLatestFinalists = async (
    limit?: number,
): Promise<{ event_name: string; results: Project[] }> => {
    const data = await fetchQuery(api.projects.getLatestFinalists, { limit });
    return data as { event_name: string; results: Project[] };
};

export const getTypes = async (): Promise<TypesResponse> => {
    const data = await fetchQuery(api.projects.getTypes, {});
    return data as TypesResponse;
};

export const getGraph = async (
    query: string,
    events: string,
    types: string,
    organizations: string,
    threshold: number,
): Promise<GraphData> => {
    const data = await fetchQuery(api.projects.getGraph, {
        query: query || undefined,
        event_name: splitCsv(events),
        prize_type: splitCsv(types),
        sponsor_organization: splitCsv(organizations),
        threshold,
    });
    return data as GraphData;
};

export const getGraphNext = async (
    query: string,
    events: string,
    types: string,
    organizations: string,
    threshold: number,
): Promise<GraphData> => {
    const response = await fetch(`/api/graph?threshold=${threshold}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, events, types, organizations }),
        next: { revalidate: 300 },
    });
    return (await response.json()) as GraphData;
};

