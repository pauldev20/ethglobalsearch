CREATE TABLE project (
    uuid VARCHAR(255) PRIMARY KEY,
    slug VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    how_its_made TEXT NOT NULL,
    source_code_url TEXT NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    logo_url TEXT NOT NULL,
    banner_url TEXT NOT NULL
);

CREATE TABLE prize (
    project_uuid VARCHAR(255) NOT NULL REFERENCES project(uuid),
    name VARCHAR(255) NOT NULL,
    detail VARCHAR(255) PRIMARY KEY,
    emoji VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    sponsor VARCHAR(255) NOT NULL,
    sponsor_organization VARCHAR(255) NOT NULL
);
