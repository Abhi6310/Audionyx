CREATE TABLE Library (
    library_id SERIAL PRIMARY KEY,
    library_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Projects (
    project_id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    description TEXT,
    base64_encoding TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    library_id INT,
    FOREIGN KEY (library_id) REFERENCES Library(library_id)
);

/* TEMPORARY */
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password CHAR(60) NOT NULL
);

/*
DROP TABLE IF EXISTS songs;
CREATE TABLE songs (
    id SERIAL PRIMARY KEY,                  -- Auto-incrementing ID for each song
    title VARCHAR(255) NOT NULL,             -- Song title (text field)
    genre VARCHAR(100),                     -- Genre of the song (text field, optional)
    file_type ENUM('mp3', 'youtube', 'spotify') NOT NULL,   -- Type of file (mp3, youtube, spotify)
    file_url VARCHAR(255),                   -- URL or path to the file or media (for youtube/spotify links or mp3 file)
    username VARCHAR(50) NOT NULL,           -- Foreign key to reference the username (from users table)
    FOREIGN KEY (username) REFERENCES users(username) -- Foreign key constraint referencing the 'username' in the users table
);
*/

/*
CREATE TABLE Users (
    username VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    library_id INT,
    FOREIGN KEY (library_id) REFERENCES Library(library_id)
);
*/