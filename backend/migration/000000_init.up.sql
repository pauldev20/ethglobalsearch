CREATE TABLE project (
    uuid VARCHAR(255) PRIMARY KEY,
    slug VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    tagline VARCHAR NOT NULL,
    description TEXT NOT NULL,
    how_its_made TEXT NOT NULL,
    source_code_url TEXT NOT NULL,
    event_name VARCHAR NOT NULL,
    logo_url TEXT NOT NULL,
    banner_url TEXT NOT NULL
);

CREATE TABLE prize (
    project_uuid VARCHAR(255) NOT NULL REFERENCES project(uuid),
    name VARCHAR NOT NULL,
    detail VARCHAR PRIMARY KEY,
    emoji VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    sponsor VARCHAR NOT NULL,
    sponsor_organization VARCHAR NOT NULL
);
