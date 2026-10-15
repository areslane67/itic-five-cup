-- Données fictives pour tester (à importer APRÈS schema.sql)
-- Lien capitaine de démo : /capitaine/demo-capitaine-titan4-000000 (Les Titans, 2 demandes en attente)
INSERT IGNORE INTO `teams` (`name`, `promo`, `code`, `manage_token`, `max_players`) VALUES
  ('Les Titans',      'BTS 1', 'TITAN4', 'demo-capitaine-titan4-000000', 5),
  ('FC Charonne',     'BTS 1', 'CHARO7', 'demo-capitaine-charo7-000000', 5),
  ('Les Invincibles', 'BTS 2', 'INVIN2', 'demo-capitaine-invin2-000000', 5),
  ('Team ITIC',       'BTS 2', 'TEAMI9', 'demo-capitaine-teami9-000000', 6);

INSERT INTO `participants` (`first_name`,`last_name`,`promo`,`mode`,`team_id`,`level`,`consent_at`) VALUES
  ('Joueur','Test1', 'BTS 1','captain',    (SELECT id FROM teams WHERE code='TITAN4'),'Loisir',NOW()),
  ('Joueur','Test2', 'BTS 1','team_member',(SELECT id FROM teams WHERE code='TITAN4'),'Loisir',NOW()),
  ('Joueur','Test3', 'BTS 1','team_member',(SELECT id FROM teams WHERE code='TITAN4'),'Loisir',NOW()),
  ('Joueur','Test4', 'BTS 1','team_member',(SELECT id FROM teams WHERE code='TITAN4'),'Loisir',NOW()),
  ('Joueur','Test5', 'BTS 1','captain',    (SELECT id FROM teams WHERE code='CHARO7'),'Loisir',NOW()),
  ('Joueur','Test6', 'BTS 1','team_member',(SELECT id FROM teams WHERE code='CHARO7'),'Loisir',NOW()),
  ('Joueur','Test7', 'BTS 1','team_member',(SELECT id FROM teams WHERE code='CHARO7'),'Loisir',NOW()),
  ('Joueur','Test8', 'BTS 2','captain',    (SELECT id FROM teams WHERE code='INVIN2'),'Loisir',NOW()),
  ('Joueur','Test9', 'BTS 2','team_member',(SELECT id FROM teams WHERE code='INVIN2'),'Loisir',NOW()),
  ('Joueur','Test10','BTS 2','team_member',(SELECT id FROM teams WHERE code='INVIN2'),'Loisir',NOW()),
  ('Joueur','Test11','BTS 2','team_member',(SELECT id FROM teams WHERE code='INVIN2'),'Loisir',NOW()),
  ('Joueur','Test12','BTS 2','team_member',(SELECT id FROM teams WHERE code='INVIN2'),'Loisir',NOW()),
  ('Joueur','Test13','BTS 2','captain',    (SELECT id FROM teams WHERE code='TEAMI9'),'Loisir',NOW()),
  ('Joueur','Test14','BTS 2','team_member',(SELECT id FROM teams WHERE code='TEAMI9'),'Loisir',NOW()),
  ('Camille','Roux',  'BTS 1','solo',NULL,'Loisir',NOW()),
  ('Yanis',  'Kader', 'BTS 2','solo',NULL,'Loisir',NOW()),
  ('Inès',   'Martin','BTS 1','solo',NULL,'Loisir',NOW());

-- Deux demandes en attente pour Les Titans (à accepter / refuser depuis le lien capitaine)
INSERT INTO `participants` (`first_name`,`last_name`,`promo`,`class_name`,`level`,`mode`,`team_id`,`status`,`track_token`,`consent_at`) VALUES
  ('Léa',   'Durand','BTS 1','SIO1 A','Loisir','team_member',(SELECT id FROM teams WHERE code='TITAN4'),'pending','demo-suivi-lea-0000000000',NOW()),
  ('Mehdi', 'Benali','BTS 1','SIO1 B','Intermédiaire','team_member',(SELECT id FROM teams WHERE code='TITAN4'),'pending','demo-suivi-mehdi-00000000',NOW());
