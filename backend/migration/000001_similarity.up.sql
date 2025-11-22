CREATE TABLE similarity (
    uuid_1 VARCHAR(255) NOT NULL,
    uuid_2 VARCHAR(255) NOT NULL,
    similarity_score FLOAT NOT NULL,
    PRIMARY KEY (uuid_1, uuid_2)
);
