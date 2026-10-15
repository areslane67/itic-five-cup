-- ITIC Five Cup : base de données complète MySQL / MariaDB (phpMyAdmin)
-- Crée la base « itic » et ses tables. À exécuter dans l'onglet SQL de phpMyAdmin
-- (ou : mysql -u root < bdd.sql).
-- Données fictives de test : importer ensuite database/seed.sql si besoin.

CREATE DATABASE IF NOT EXISTS `itic`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `itic`;

-- --------------------------------------------------------------------------
-- Paramètres du tournoi (une seule ligne, id = 1)
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `event` (
  `id`                 TINYINT UNSIGNED NOT NULL,
  `registrations_open` TINYINT(1) NOT NULL DEFAULT 1,
  `date`               VARCHAR(100) NOT NULL DEFAULT '',
  `venue`              VARCHAR(150) NOT NULL DEFAULT '',
  `price`              VARCHAR(60)  NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `event` (`id`) VALUES (1);

-- --------------------------------------------------------------------------
-- Équipes
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `teams` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(30) NOT NULL,
  `promo`        ENUM('BTS 1','BTS 2') NOT NULL,
  `code`         VARCHAR(12) NOT NULL,                 -- code d'invitation (6 caractères), public
  `manage_token` VARCHAR(40) NOT NULL,                 -- lien secret du capitaine (modération)
  `max_players`  TINYINT UNSIGNED NOT NULL,            -- entre 5 et 8
  `closed`       TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teams_code` (`code`),
  UNIQUE KEY `teams_manage_token` (`manage_token`),
  -- nom unique par promotion (la collation _ci ignore la casse)
  UNIQUE KEY `teams_name_promo` (`name`, `promo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------------
-- Participants
-- status : pre_registered = inscrit / accepté · pending = demande en attente du capitaine
--          rejected = refusé par le capitaine · cancelled = annulé par le BDE
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `participants` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `first_name`  VARCHAR(60) NOT NULL,
  `last_name`   VARCHAR(60) NOT NULL,
  `promo`       ENUM('BTS 1','BTS 2') NOT NULL,
  `class_name`  VARCHAR(40)  NOT NULL DEFAULT '',
  `level`       ENUM('','Loisir','Intermédiaire','Compétition') NOT NULL DEFAULT '',
  `contact`     VARCHAR(120) NOT NULL DEFAULT '',
  `mode`        ENUM('solo','captain','team_member') NOT NULL,
  `team_id`     INT UNSIGNED NULL,                     -- NULL = solo, à affecter par le BDE
  `status`      ENUM('pre_registered','pending','rejected','cancelled') NOT NULL DEFAULT 'pre_registered',
  `track_token` VARCHAR(40) NULL,                      -- lien de suivi de la demande par le joueur
  `consent_at`  DATETIME NOT NULL,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `participants_track_token` (`track_token`),
  KEY `participants_team` (`team_id`),
  CONSTRAINT `fk_participants_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
