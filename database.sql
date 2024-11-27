CREATE DATABASE voting_system;
USE voting_system;

CREATE TABLE candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    photo_url VARCHAR(512),
    votes_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE votes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telegram_user_id BIGINT NOT NULL,
    candidate_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id),
    UNIQUE KEY unique_vote (telegram_user_id)
);

CREATE TABLE vote_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    telegram_user_id BIGINT NOT NULL,
    candidate_id INT,
    action VARCHAR(50),
    ip_address VARCHAR(45),
    status VARCHAR(50),
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
); 