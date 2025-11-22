CREATE TABLE project (
    uuid VARCHAR(255) PRIMARY KEY,
    slug VARCHAR NOT NULL,
    emoji VARCHAR,
    name VARCHAR NOT NULL,
    tagline VARCHAR NOT NULL,
    description TEXT NOT NULL,
    how_its_made TEXT NOT NULL,
    source_code_url TEXT,
    url TEXT,
    event_name VARCHAR NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    screenshots TEXT[],
    video_file_url TEXT,
    video_mux_url TEXT,
    video_mux_thumbnail_url TEXT,
    video_youtube_id VARCHAR,
    primary_repository_url TEXT
);

CREATE TABLE prize (
    project_uuid VARCHAR(255) NOT NULL REFERENCES project(uuid) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    pool_prize VARCHAR,
    prize_name VARCHAR,
    prize_emoji VARCHAR,
    prize_type VARCHAR,
    sponsor_name VARCHAR,
    sponsor_organization_name VARCHAR,
    sponsor_organization_square_logo_url TEXT,
    PRIMARY KEY (project_uuid, name, prize_name)
);
