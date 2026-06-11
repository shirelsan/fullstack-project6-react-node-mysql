CREATE DATABASE IF NOT EXISTS fullstack_db;
USE fullstack_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS passwords (
    user_id INT PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

-- Insert dummy data (Optional, for testing)
INSERT IGNORE INTO users (id, name, username, email, phone, website) VALUES 
(1, 'Shlomo Kipnis', 'shlomo', 'shlomo@example.com', '123-456-7890', 'shlomo.com');

-- Password is '123456' hashed with basic mechanism (In real world use bcrypt, we will do plain text or simple hash here or we will let the server handle hashing).
-- Since we are doing a real node app, we will let the register endpoint handle the hashing, but for this dummy user we will insert a bcrypt hash of "123456".
-- $2b$10$EPbF3Pq1A6wN9/h9T2Kx6e9Yw6bJ9N/xYh6H2q0uX5k6m7P/u0K3e represents "123456"
INSERT IGNORE INTO passwords (user_id, password_hash) VALUES 
(1, '$2b$10$Sa844rG3HDP8AG2d/JcEDuD4JftrVXERw0ZkWQhOkNq1mzOXIx9O6');
