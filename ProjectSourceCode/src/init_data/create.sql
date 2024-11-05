CREATE TABLE Library (
    library_id SERIAL PRIMARY KEY,
    library_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    library_id INT,
    FOREIGN KEY (library_id) REFERENCES Library(library_id)
);

CREATE TABLE Users (
    username VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    library_id INT,
    FOREIGN KEY (library_id) REFERENCES Library(library_id)
);
