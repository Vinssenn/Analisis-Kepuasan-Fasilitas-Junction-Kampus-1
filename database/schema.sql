CREATE DATABASE IF NOT EXISTS junction_analytics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE junction_analytics;

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  respondent_code VARCHAR(30) NOT NULL,
  role_name VARCHAR(60) DEFAULT NULL,
  faculty VARCHAR(120) DEFAULT NULL,
  program VARCHAR(150) DEFAULT NULL,
  gender VARCHAR(30) DEFAULT NULL,
  cohort VARCHAR(20) DEFAULT NULL,
  frequency VARCHAR(60) DEFAULT NULL,
  rating_1 TINYINT NULL, rating_2 TINYINT NULL, rating_3 TINYINT NULL, rating_4 TINYINT NULL,
  rating_5 TINYINT NULL, rating_6 TINYINT NULL, rating_7 TINYINT NULL, rating_8 TINYINT NULL,
  rating_9 TINYINT NULL, rating_10 TINYINT NULL, rating_11 TINYINT NULL, rating_12 TINYINT NULL,
  rating_13 TINYINT NULL, rating_14 TINYINT NULL,
  suggestion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat hash password admin menggunakan PHP password_hash().
-- Jalankan sekali: php -r "echo password_hash('Admin123!', PASSWORD_DEFAULT), PHP_EOL;"
-- Lalu masukkan hash yang dihasilkan:
-- INSERT INTO admins(name,email,password_hash) VALUES('Administrator','admin@junction.local','PASTE_HASH_DI_SINI');
