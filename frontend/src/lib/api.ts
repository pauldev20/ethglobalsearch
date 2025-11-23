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
/*                                 Endpoints                                 */
/* -------------------------------------------------------------------------- */

export const API_URL = process.env.API_URL;

export const getSimilarProjects = async (uuid: string) => {
    const response = await fetch(`${API_URL}/similar?uuid=${uuid}`, {
        next: { revalidate: 1800 },
    });
    const data: Project[] = await response.json();
    return data;
};

export const getProject = async (uuid: string) => {
    const response = await fetch(`${API_URL}/project?uuid=${uuid}`, {
        next: { revalidate: 1800 },
    });
    const data: Project = await response.json();
    return data;
};

export const searchProjects = async (
    query: string,
    page: number,
    page_size: number,
    events?: string,
    types?: string,
    organizations?: string,
) => {
    const response = await fetch(`${API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            page,
            page_size,
            ...(organizations ? { sponsor_organization: organizations.split(",") } : {}),
            ...(types ? { prize_type: types.split(",") } : {}),
            ...(events ? { event_name: events.split(",") } : {}),
        }),
        next: { revalidate: 300 },
    });
    const data: SearchResponse = await response.json();
    return data;
};

export const getTypes = async () => {
    const response = await fetch(`${API_URL}/types`, {
        next: { revalidate: 300 },
    });
    const data: TypesResponse = await response.json();
    return data;
};

export const getGraph = async (
    query: string,
    events: string,
    types: string,
    organizations: string,
    threshold: number,
) => {
    const response = await fetch(`${API_URL}/graph?threshold=${threshold}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            events,
            types,
            organizations,
            ...(organizations ? { sponsor_organization: organizations.split(",") } : {}),
            ...(types ? { prize_type: types.split(",") } : {}),
            ...(events ? { event_name: events.split(",") } : {}),
        }),
        next: { revalidate: 300 },
    });
    const data: GraphData = await response.json();
    return data;
};

export const getGraphNext = async (
    query: string,
    events: string,
    types: string,
    organizations: string,
    threshold: number,
) => {
    const response = await fetch(`/api/graph?threshold=${threshold}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            query,
            events,
            types,
            organizations,
            ...(organizations ? { sponsor_organization: organizations.split(",") } : {}),
            ...(types ? { prize_type: types.split(",") } : {}),
            ...(events ? { event_name: events.split(",") } : {}),
        }),
        next: { revalidate: 300 },
    });
    const data: GraphData = await response.json();
    return data;
};

export const queryChat = async (query: string) => {
	// Use the local Next.js API route which implements the zeroG provider
	const response = await fetch(`/api/chat`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query }),
	});
	const data: ChatResponse = await response.json();
	return data;
};
