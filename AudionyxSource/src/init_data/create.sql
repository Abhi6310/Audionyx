<<<<<<< Updated upstream
-- Drop and create the 'users' table
=======
CREATE TABLE Library (
    library_id VARCHAR(50) PRIMARY KEY,
    library_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    encoding TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    library_id VARCHAR(50),
    FOREIGN KEY (library_id) REFERENCES Library(library_id)
);

/* TEMPORARY */
>>>>>>> Stashed changes
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY, -- username
    password CHAR(60) NOT NULL        -- password
);

-- Drop and create the 'Library' table with Foreign Key Constraint
DROP TABLE IF EXISTS Library;
CREATE TABLE Library (
    library_id SERIAL PRIMARY KEY,      -- Auto-incrementing library ID
    library_name VARCHAR(255),          -- Name of the library
    user_id VARCHAR(50),                -- Foreign key for username from 'users' table
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES users(username) -- Foreign key relation
);

-- Drop and create the 'Projects' table with Foreign Key Constraint
DROP TABLE IF EXISTS Projects;  -- Added semicolon
CREATE TABLE Projects (
    project_id SERIAL PRIMARY KEY,    -- Unique project ID
    library_id INT NOT NULL,          -- Foreign key for library_id from 'Library' table
    songTitle VARCHAR(255),           -- Song title
    songGenre VARCHAR(100),           -- Song genre
    fileType VARCHAR(50),             -- File type (e.g., YouTube, Spotify)
    url TEXT NOT NULL,                -- URL for the song (YouTube or Spotify)
    base64_encoding TEXT,             -- Base64 encoded audio data
    CONSTRAINT fk_library_id FOREIGN KEY (library_id) REFERENCES Library(library_id)  -- Foreign key relation
);
