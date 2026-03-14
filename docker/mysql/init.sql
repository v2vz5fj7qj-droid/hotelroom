-- Script d'initialisation MySQL pour l'environnement de test Bravia Hôtel
-- Ce fichier est exécuté automatiquement au premier démarrage du conteneur

CREATE DATABASE IF NOT EXISTS bravia_hotel_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bravia_hotel_db;

-- Accorder les droits à l'utilisateur bravia
GRANT ALL PRIVILEGES ON bravia_hotel_db.* TO 'bravia'@'%';
FLUSH PRIVILEGES;

-- Les tables sont créées automatiquement par TypeORM (synchronize: true)
-- Ce script assure uniquement la création de la base et les droits
