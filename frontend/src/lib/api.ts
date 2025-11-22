/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

interface Prize {
	name: string;
	detail: string;
	emoji: string;
	type: string;
	sponsor: string;
	sponsor_organization: string;
}

export interface Project {
	uuid: string;
	name: string;
	tagline: string;
	description: string;
	how_its_made: string;
	source_code_url: string;
	event_name: string;
	logo_url: string;
	banner_url: string;
	prizes: Prize[];
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

/* -------------------------------------------------------------------------- */
/*                                 Endpoints                                 */
/* -------------------------------------------------------------------------- */

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export const searchProjects = async (query: string, page: number, page_size: number, events?: string, types?: string, organizations?: string) => {
	const response = await fetch(`${API_URL}/search`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query,
			page,
			page_size,
			...(organizations ? { sponsor_organization: organizations.split(',') } : {}),
			...(types ? { prize_type: types.split(',') } : {}),
			...(events ? { event_name: events.split(',') } : {})
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
