USE playpoint_test;

SET NAMES utf8mb4;


CREATE TABLE IF NOT EXISTS users (
  id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username             VARCHAR(20)  NOT NULL,
  email                VARCHAR(254) NOT NULL,
  password_hash        VARCHAR(255) NOT NULL,          
  full_name            VARCHAR(80)  NOT NULL,
  birth_date           DATE         NOT NULL,
  gender               ENUM('femenino','masculino','otro','prefiero-no-decir') NOT NULL,
  phone                VARCHAR(20)  NOT NULL,
  city                 VARCHAR(80)  NULL,
  description          VARCHAR(300) NOT NULL DEFAULT '',
  avatar_path          VARCHAR(80)  NULL,              
  token_version        INT UNSIGNED NOT NULL DEFAULT 0, 
  username_changed_at  DATETIME     NOT NULL,          
  avatar_changed_at    DATETIME     NULL,              
  created_at           DATETIME     NOT NULL,
  updated_at           DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS login_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NULL,                     
  event_type  ENUM('register','login','login_failed','logout') NOT NULL,
  email       VARCHAR(254) NULL,
  ip          VARCHAR(45)  NULL,
  user_agent  VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY ix_login_user (user_id, created_at),
  KEY ix_login_created (created_at),
  CONSTRAINT fk_login_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS workshops (
  id        VARCHAR(30)  NOT NULL,
  name      VARCHAR(60)  NOT NULL,
  capacity  SMALLINT UNSIGNED NOT NULL,                 
  active    TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workshop_enrollments (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  workshop_id  VARCHAR(30)     NOT NULL,
  full_name    VARCHAR(80)     NOT NULL,
  email        VARCHAR(254)    NOT NULL,
  phone        VARCHAR(20)     NOT NULL,
  comments     VARCHAR(500)    NULL,
  status       ENUM('activa','cancelada') NOT NULL DEFAULT 'activa',
  created_at   DATETIME        NOT NULL,
  cancelled_at DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enroll_user_workshop (user_id, workshop_id),
  KEY ix_enroll_workshop (workshop_id, status),
  CONSTRAINT fk_enroll_user     FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE,
  CONSTRAINT fk_enroll_workshop FOREIGN KEY (workshop_id) REFERENCES workshops (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tournaments (
  id           INT UNSIGNED NOT NULL,
  title        VARCHAR(120) NOT NULL,
  category     VARCHAR(40)  NOT NULL,
  dates_label  VARCHAR(60)  NOT NULL,
  location     VARCHAR(80)  NOT NULL,
  status       ENUM('proximo','en_curso','finalizado') NOT NULL DEFAULT 'proximo',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tournament_registrations (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  tournament_id  INT UNSIGNED    NOT NULL,
  full_name      VARCHAR(80)     NOT NULL,
  email          VARCHAR(254)    NOT NULL,
  phone          VARCHAR(20)     NOT NULL,
  team_name      VARCHAR(60)     NULL,
  members_count  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  status         ENUM('activa','cancelada') NOT NULL DEFAULT 'activa',
  created_at     DATETIME        NOT NULL,
  cancelled_at   DATETIME        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reg_user_tournament (user_id, tournament_id),
  KEY ix_reg_tournament (tournament_id, status),
  CONSTRAINT fk_reg_user       FOREIGN KEY (user_id)       REFERENCES users (id)       ON DELETE CASCADE,
  CONSTRAINT fk_reg_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS community_groups (
  id           VARCHAR(40)  NOT NULL,
  name         VARCHAR(80)  NOT NULL,
  sport        VARCHAR(30)  NOT NULL,
  description  VARCHAR(500) NOT NULL,
  emoji        VARCHAR(16)  NOT NULL,
  created_by   BIGINT UNSIGNED NULL,                    
  created_at   DATETIME     NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_group_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_members (
  group_id   VARCHAR(40)     NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  joined_at  DATETIME        NOT NULL,
  PRIMARY KEY (group_id, user_id),
  KEY ix_members_user (user_id),
  CONSTRAINT fk_member_group FOREIGN KEY (group_id) REFERENCES community_groups (id) ON DELETE CASCADE,
  CONSTRAINT fk_member_user  FOREIGN KEY (user_id)  REFERENCES users (id)            ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS reviews (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  workshop_id  VARCHAR(30)     NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  body         VARCHAR(1000)   NOT NULL,
  created_at   DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY ix_reviews_created (created_at),
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_review_user     FOREIGN KEY (user_id)     REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_review_workshop FOREIGN KEY (workshop_id) REFERENCES workshops (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_replies (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id   BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  body        VARCHAR(600)    NOT NULL,
  created_at  DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY ix_replies_review (review_id, created_at),
  CONSTRAINT fk_reply_review FOREIGN KEY (review_id) REFERENCES reviews (id) ON DELETE CASCADE,
  CONSTRAINT fk_reply_user   FOREIGN KEY (user_id)   REFERENCES users (id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


INSERT IGNORE INTO workshops (id, name, capacity) VALUES
  ('futbol',     'Fútbol',     18),
  ('basquetbol', 'Básquetbol', 22),
  ('voley',      'Vóley',      20),
  ('handball',   'Handball',   15),
  ('atletismo',  'Atletismo',  25);

INSERT IGNORE INTO tournaments (id, title, category, dates_label, location, status) VALUES
  (1, 'Torneo Intercolegial de Fútbol', 'Fútbol',     '24 de Mayo al 30 de Junio', 'Polideportivo ANU', 'proximo'),
  (2, 'Copa Ánima de Básquetbol',       'Básquetbol', '10 de Junio al 20 de Julio', 'Polideportivo ANU', 'proximo'),
  (3, 'Torneo de Voley Mixto',          'Voley',      '5 de Julio al 20 de Julio',  'Gimnasio ANU',      'en_curso'),
  (4, 'Desafío Running 5K',             'Running',    '10 de Agosto',               'Pista ANU',         'finalizado');

INSERT IGNORE INTO community_groups (id, name, sport, description, emoji, created_by, created_at) VALUES
  ('voley',     'Grupo Vóley PlayPoint',  'Vóley',
   'Grupo para quienes aman el vóley. Organizamos partidos amistosos, entrenamientos y salidas después de jugar.',
   '🏐', NULL, UTC_TIMESTAMP()),
  ('futbol',    'Entrenamiento Fútbol',   'Fútbol',
   'Entrenamientos de fútbol para todos los niveles. Compartimos ejercicios, horarios y armamos partidos.',
   '⚽', NULL, UTC_TIMESTAMP()),
  ('basquetbol','Basketball PlayPoint',   'Basketball',
   'La comunidad del básquet de PlayPoint: prácticas de tiro, 3 contra 3 y torneos internos.',
   '🏀', NULL, UTC_TIMESTAMP()),
  ('atletismo', 'Atletismo PlayPoint',    'Running',
   'Salidas de running, trabajo de pista y preparación para carreras. Todos los ritmos son bienvenidos.',
   '🏃', NULL, UTC_TIMESTAMP());
