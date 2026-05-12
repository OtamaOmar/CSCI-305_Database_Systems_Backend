-- PulseED — Hospital Emergency Department System
-- Database Schema

DROP DATABASE IF EXISTS csci305_db;
CREATE DATABASE csci305_db;
USE csci305_db;

-- ─────────────────────────────────────────
-- Table: users
-- Hospital staff who can log in to PulseED
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT           NOT NULL AUTO_INCREMENT,
  first_name  VARCHAR(50)   NOT NULL,
  last_name   VARCHAR(50)   NOT NULL,
  email       VARCHAR(100)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  hospital    VARCHAR(100)  NOT NULL,
  role        VARCHAR(50)   NOT NULL DEFAULT 'staff',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: patients
-- Emergency patients currently in the ED
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id          VARCHAR(10)                         NOT NULL,
  name        VARCHAR(100)                        NOT NULL,
  age         TINYINT UNSIGNED                    NOT NULL,
  gender      ENUM('Male', 'Female', 'Other')     NOT NULL,
  `condition` VARCHAR(150)                        NOT NULL,
  doctor      VARCHAR(100)                        NOT NULL,
  bay         VARCHAR(20)                         NOT NULL,
  `level`     ENUM('Critical', 'Urgent', 'Stable') NOT NULL,
  created_at  TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────  (Omar)
-- Table: doctors
-- Medical staff available for scheduling
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id          VARCHAR(10)                       NOT NULL,
  name        VARCHAR(100)                      NOT NULL,
  email       VARCHAR(150)                      NOT NULL,
  specialty   VARCHAR(100)                      NOT NULL,
  department  VARCHAR(100)                      NOT NULL,
  shift       ENUM('Morning', 'Evening', 'Night') NOT NULL,
  status      ENUM('On duty', 'On call', 'Off duty') NOT NULL,
  phone       VARCHAR(30)                       NULL,
  notes       TEXT                              NULL,
  created_at  TIMESTAMP                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: emergency_cases
-- Live emergency intake and tracking
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_cases (
  id           VARCHAR(10)                           NOT NULL,
  name         VARCHAR(100)                          NOT NULL,
  age          TINYINT UNSIGNED                      NOT NULL,
  gender       ENUM('Male', 'Female', 'Other')       NOT NULL,
  complaint    VARCHAR(200)                          NOT NULL,
  room         VARCHAR(50)                           NOT NULL,
  doctor       VARCHAR(100)                          NOT NULL,
  severity     ENUM('Critical', 'Urgent', 'Stable')  NOT NULL,
  status       ENUM('Incoming', 'In treatment', 'Stabilized', 'Discharged') NOT NULL,
  arrival_time DATETIME                              NULL,
  notes        TEXT                                  NULL,
  created_at   TIMESTAMP                             NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: notifications
-- Emergency alerts and system notifications
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT                               NOT NULL AUTO_INCREMENT,
  title       VARCHAR(150)                      NOT NULL,
  message     TEXT                              NOT NULL,
  `level`     ENUM('Critical', 'Warning', 'Info') NOT NULL,
  type        ENUM('emergency', 'system')       NOT NULL,
  created_at  TIMESTAMP                         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Sample Data
-- ─────────────────────────────────────────

-- Users (passwords are bcrypt hashes of 'password123')
INSERT INTO users (first_name, last_name, email, password, hospital, role) VALUES
  ('Sarah',   'Mitchell', 'sarah.mitchell@pulseED.com', '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'City General Hospital',   'doctor'),
  ('James',   'Carter',   'james.carter@pulseED.com',   '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'City General Hospital',   'nurse'),
  ('Priya',   'Nair',     'priya.nair@pulseED.com',     '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'Riverside Medical Center', 'doctor'),
  ('Omar',    'Hassan',   'omar.hassan@pulseED.com',    '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'Riverside Medical Center', 'admin'),
  ('Lena',    'Fischer',  'lena.fischer@pulseED.com',   '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'Northside ED',             'staff');

-- Patients
INSERT INTO patients (id, name, age, gender, `condition`, doctor, bay, `level`) VALUES
  ('ED-2841', 'Thomas Greene',   45, 'Male',   'Acute chest pain, possible MI',        'Dr. Sarah Mitchell', 'Bay 1',  'Critical'),
  ('ED-2842', 'Aisha Patel',     32, 'Female', 'Severe allergic reaction',             'Dr. Priya Nair',     'Bay 2',  'Critical'),
  ('ED-2843', 'Robert Kim',      67, 'Male',   'Shortness of breath, suspected COPD',  'Dr. Sarah Mitchell', 'Bay 3',  'Urgent'),
  ('ED-2844', 'Maria Santos',    29, 'Female', 'Fractured wrist, moderate pain',       'Dr. Priya Nair',     'Bay 5',  'Stable'),
  ('ED-2845', 'David Okafor',    54, 'Male',   'High fever, suspected sepsis',         'Dr. Sarah Mitchell', 'Bay 4',  'Urgent'),
  ('ED-2846', 'Emma Larsson',    19, 'Female', 'Concussion after fall',                'Dr. Priya Nair',     'Bay 6',  'Stable');

-- Notifications
INSERT INTO notifications (title, message, `level`, type) VALUES
  ('Code Blue — Bay 1',         'Patient ED-2841 is in cardiac arrest. All available staff report to Bay 1 immediately.', 'Critical', 'emergency'),
  ('Trauma Team Activation',    'Multiple vehicle accident incoming. Trauma team activate for Bay 2 and Bay 3.',          'Critical', 'emergency'),
  ('Blood Bank Alert',          'O-negative blood supply critically low. Contact blood bank for emergency resupply.',      'Warning',  'system'),
  ('Shift Change Reminder',     'Night shift begins at 22:00. Please complete all pending handover notes before then.',   'Info',     'system'),
  ('Bed Capacity Warning',      'ED is at 90% capacity. Initiate overflow protocol and notify charge nurse.',             'Warning',  'system'),
  ('New Policy Update',         'Updated triage guidelines are now in effect. Review the new protocol in the portal.',    'Info',     'system');
