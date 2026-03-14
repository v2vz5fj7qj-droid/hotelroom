-- Suppression de la base si elle existe pour repartir à zéro
DROP DATABASE IF EXISTS bravia_hotel_db;
CREATE DATABASE bravia_hotel_db;
USE bravia_hotel_db;

-- Table des entreprises (Clients)
CREATE TABLE companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Table des salles (Configuration fixe)
CREATE TABLE rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    floor INT NOT NULL CHECK (floor BETWEEN 0 AND 15)
);

-- Table des événements (Programmation)
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    room_id INT NOT NULL,
    event_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Insertion de quelques données de test (optionnel)
INSERT INTO companies (name) VALUES ('SOBUP'), ('BAD'), ('IAMGOLD');
INSERT INTO rooms (name, floor) VALUES ('Laafi', 7), ('Namassa', 2), ('Yenenga', 0);