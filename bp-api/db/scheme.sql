SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE willosphere_db
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE willosphere_db;


-- Refresh Tokens
CREATE TABLE `refresh_tokens` (
  `id`               INT          NOT NULL AUTO_INCREMENT,
  `user_id`          INT          NOT NULL,
  `device_id`        VARCHAR(255) NOT NULL,
  `token_hash`       VARCHAR(255) NOT NULL,
  `expires_at`       DATETIME     NOT NULL,
  `revoked_at`       DATETIME     DEFAULT NULL,
  `replaced_by_hash` VARCHAR(255) DEFAULT NULL,
  `created_at`       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refresh_tokens_token_hash` (`token_hash`),
  KEY `idx_refresh_tokens_user_id` (`user_id`),
  KEY `idx_refresh_tokens_expires_at` (`expires_at`),

  CONSTRAINT `FK_refresh_token_user` FOREIGN KEY (`user_id`)
      REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TOTP secrets
CREATE TABLE `user_mfa` (
    `user_id`    INT          NOT NULL,
    `secret`     VARCHAR(512) NOT NULL COMMENT 'AES-256-GCM encrypted TOTP secret',
    `enabled`    TINYINT(1)   NOT NULL DEFAULT 0,
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (`user_id`),
    CONSTRAINT `FK_user_mfa_user` FOREIGN KEY (`user_id`)
        REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- MFA login challenges
CREATE TABLE `mfa_challenge` (
    `id`          VARCHAR(36)  NOT NULL,
    `user_id`     INT          NOT NULL,
    `purpose`     VARCHAR(20)  NOT NULL DEFAULT 'LOGIN',
    `expires_at`  DATETIME     NOT NULL,
    `attempts`    INT          NOT NULL DEFAULT 0,
    `verified_at` DATETIME     DEFAULT NULL,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`id`),
    KEY `idx_mfa_challenge_user_id` (`user_id`),
    KEY `idx_mfa_challenge_expires_at` (`expires_at`),

    CONSTRAINT `FK_mfa_challenge_user` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Users
CREATE TABLE users (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  display_name      VARCHAR(255) NOT NULL,
  signup_date       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  timezone          VARCHAR(255) NOT NULL DEFAULT 'UTC',
  language          VARCHAR(255) NOT NULL DEFAULT 'en',
  profile_image_url VARCHAR(255),
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User roles (multi-role)
CREATE TABLE user_role (
  user_id INT NOT NULL,
  role    ENUM('listener','artist','admin') NOT NULL,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role),
  CONSTRAINT fk_user_role_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Artist profile
CREATE TABLE ArtistProfile (
  user_id           INT PRIMARY KEY,
  bio               TEXT,
  banner_image_url  VARCHAR(255),
  artist_since      DATE,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_artistprofile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Genres
CREATE TABLE Genre (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Albums
CREATE TABLE Album (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  release_date     DATE NOT NULL,
  cover_image_url  VARCHAR(255) NOT NULL,
  price            DECIMAL(10,2) NOT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Album_Artist (
  album_id  INT NOT NULL,
  artist_id INT NOT NULL,  -- ArtistProfile.user_id
  role      ENUM('primary','collaborator') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (album_id, artist_id),
  CONSTRAINT fk_album_artist_album FOREIGN KEY (album_id)  REFERENCES Album(id) ON DELETE CASCADE,
  CONSTRAINT fk_album_artist_artist FOREIGN KEY (artist_id) REFERENCES ArtistProfile(user_id) ON DELETE CASCADE,
  INDEX idx_album_artist_album (album_id),
  INDEX idx_album_artist_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tracks
CREATE TABLE Track (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  duration_seconds INT NOT NULL,
  bpm              SMALLINT,
  audio_url        VARCHAR(255) NOT NULL,
  price            DECIMAL(10,2) NULL,
  cover_image_url  VARCHAR(255),
  album_id         INT NULL,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_track_album FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE SET NULL,
  INDEX idx_track_album (album_id),
  INDEX idx_track_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Track_Artist (
  track_id  INT NOT NULL,
  artist_id INT NOT NULL,  -- ArtistProfile.user_id
  role      ENUM('primary','feat') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (track_id, artist_id, role),
  CONSTRAINT fk_track_artist_track FOREIGN KEY (track_id)  REFERENCES Track(id) ON DELETE CASCADE,
  CONSTRAINT fk_track_artist_artist FOREIGN KEY (artist_id) REFERENCES ArtistProfile(user_id) ON DELETE CASCADE,
  INDEX idx_track_artist_track (track_id),
  INDEX idx_track_artist_artist (artist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Track_Genre (
  track_id INT NOT NULL,
  genre_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (track_id, genre_id),
  CONSTRAINT fk_track_genre_track FOREIGN KEY (track_id) REFERENCES Track(id) ON DELETE CASCADE,
  CONSTRAINT fk_track_genre_genre FOREIGN KEY (genre_id) REFERENCES Genre(id) ON DELETE RESTRICT,
  INDEX idx_track_genre_track (track_id),
  INDEX idx_track_genre_genre (genre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Playlists
CREATE TABLE Playlist (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  user_id          INT NOT NULL,
  is_public        TINYINT(1) NOT NULL DEFAULT 0,
  is_collaborative TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_playlist_owner FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_playlist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Playlist_Track (
  playlist_id INT NOT NULL,
  track_id    INT NOT NULL,
  position    INT NOT NULL,
  added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (playlist_id, position),
  CONSTRAINT uq_playlist_track UNIQUE (playlist_id, track_id),
  CONSTRAINT fk_playlist_track_playlist FOREIGN KEY (playlist_id) REFERENCES Playlist(id) ON DELETE CASCADE,
  CONSTRAINT fk_playlist_track_track FOREIGN KEY (track_id)    REFERENCES Track(id) ON DELETE CASCADE,
  INDEX idx_playlist_track_playlist (playlist_id),
  INDEX idx_playlist_track_track (track_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products
CREATE TABLE Product (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  type        ENUM('physical','digital') NOT NULL DEFAULT 'digital',
  description TEXT NULL,
  price       DECIMAL(10,2) NOT NULL,
  artist_id   INT NOT NULL,
  track_id    INT NULL,
  album_id    INT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_artist FOREIGN KEY (artist_id)
    REFERENCES ArtistProfile(user_id) ON DELETE RESTRICT,
  CONSTRAINT fk_product_track  FOREIGN KEY (track_id)
    REFERENCES Track(id) ON DELETE SET NULL,
  CONSTRAINT fk_product_album  FOREIGN KEY (album_id)
    REFERENCES Album(id) ON DELETE SET NULL,
  INDEX idx_product_artist (artist_id),
  INDEX idx_product_track  (track_id),
  INDEX idx_product_album  (album_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purchases (RESTRICT)
CREATE TABLE Purchase (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  purchase_date  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_price    DECIMAL(10,2) NOT NULL,
  currency_code  CHAR(3) NOT NULL DEFAULT 'CZK',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_purchase_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_purchase_user_time (user_id, purchase_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Purchase_Item
CREATE TABLE Purchase_Item (
  purchase_id INT NOT NULL,
  product_id  INT NOT NULL,
  price       DECIMAL(10,2) NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (purchase_id, product_id),
  CONSTRAINT fk_pi_purchase FOREIGN KEY (purchase_id) REFERENCES Purchase(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pi_product  FOREIGN KEY (product_id)  REFERENCES Product(id)  ON DELETE RESTRICT,
  INDEX idx_pi_purchase (purchase_id),
  INDEX idx_pi_product  (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Listen History
CREATE TABLE Listen_History (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  track_id       INT NOT NULL,
  listened_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  device_info    VARCHAR(255),
  seconds_played INT NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_track FOREIGN KEY (track_id) REFERENCES Track(id) ON DELETE CASCADE,
  INDEX idx_history_user_time (user_id, listened_at),
  INDEX idx_history_track_time (track_id, listened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Audit Log
CREATE TABLE Audit_Log (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  table_name       VARCHAR(255) NOT NULL,
  operation_type   VARCHAR(255) NOT NULL,
  record_id        INT NOT NULL,
  changed_by_user  INT NULL,
  operation_time   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  changed_data     JSON,
  created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (changed_by_user) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_table_time (table_name, operation_time),
  INDEX idx_audit_changed_by (changed_by_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
