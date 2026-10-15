-- Migration pour une base DÉJÀ créée : retour à BTS 1 / BTS 2 + modération par les capitaines.
-- À exécuter UNE SEULE FOIS dans phpMyAdmin (onglet SQL de la base « itic »).

-- 1. Retour à BTS 1 / BTS 2 (fonctionne que tu aies migré vers M2 ou non)
ALTER TABLE `teams`        MODIFY `promo` ENUM('BTS 1','BTS 2','M2') NOT NULL;
ALTER TABLE `participants` MODIFY `promo` ENUM('BTS 1','BTS 2','M2') NOT NULL;
UPDATE `teams`        SET `promo` = 'BTS 1' WHERE `promo` = 'M2';
UPDATE `participants` SET `promo` = 'BTS 1' WHERE `promo` = 'M2';
ALTER TABLE `teams`        MODIFY `promo` ENUM('BTS 1','BTS 2') NOT NULL;
ALTER TABLE `participants` MODIFY `promo` ENUM('BTS 1','BTS 2') NOT NULL;

-- 2. Lien secret du capitaine pour chaque équipe
ALTER TABLE `teams` ADD COLUMN `manage_token` VARCHAR(40) NULL AFTER `code`;
UPDATE `teams` SET `manage_token` = SUBSTRING(MD5(CONCAT(UUID(), RAND(), `id`)), 1, 32) WHERE `manage_token` IS NULL;
ALTER TABLE `teams`
  MODIFY `manage_token` VARCHAR(40) NOT NULL,
  ADD UNIQUE KEY `teams_manage_token` (`manage_token`);

-- 3. Statuts de demande + lien de suivi pour les joueurs
ALTER TABLE `participants`
  MODIFY `status` ENUM('pre_registered','pending','rejected','cancelled') NOT NULL DEFAULT 'pre_registered',
  ADD COLUMN `track_token` VARCHAR(40) NULL AFTER `status`,
  ADD UNIQUE KEY `participants_track_token` (`track_token`);
