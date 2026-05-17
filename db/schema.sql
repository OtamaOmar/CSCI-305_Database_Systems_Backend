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
  id          VARCHAR(10)                          NOT NULL,
  name        VARCHAR(100)                         NOT NULL,
  age         TINYINT UNSIGNED                     NOT NULL,
  gender      ENUM('Male', 'Female', 'Other')      NOT NULL,
  `condition` VARCHAR(150)                         NOT NULL,
  doctor      VARCHAR(100)                         NOT NULL,
  bay         VARCHAR(20)                          NOT NULL,
  `level`     ENUM('Critical', 'Urgent', 'Stable') NOT NULL,
  created_at  TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: doctors
-- Medical staff available for scheduling
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id          VARCHAR(10)                         NOT NULL,
  name        VARCHAR(100)                        NOT NULL,
  email       VARCHAR(150)                        NOT NULL,
  specialty   VARCHAR(100)                        NOT NULL,
  department  VARCHAR(100)                        NOT NULL,
  shift       ENUM('Morning', 'Evening', 'Night') NOT NULL,
  status      ENUM('On duty', 'On call', 'Off duty') NOT NULL,
  phone       VARCHAR(30)                         NULL,
  notes       TEXT                                NULL,
  created_at  TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: emergency_cases
-- Live emergency intake and tracking
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_cases (
  id           VARCHAR(10)                            NOT NULL,
  name         VARCHAR(100)                           NOT NULL,
  age          TINYINT UNSIGNED                       NOT NULL,
  gender       ENUM('Male', 'Female', 'Other')        NOT NULL,
  complaint    VARCHAR(200)                           NOT NULL,
  room         VARCHAR(50)                            NOT NULL,
  doctor       VARCHAR(100)                           NOT NULL,
  severity     ENUM('Critical', 'Urgent', 'Stable')   NOT NULL,
  status       ENUM('Incoming', 'In treatment', 'Stabilized', 'Discharged') NOT NULL,
  arrival_time DATETIME                               NULL,
  notes        TEXT                                   NULL,
  created_at   TIMESTAMP                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: notifications
-- Emergency alerts and system notifications
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT                                NOT NULL AUTO_INCREMENT,
  title       VARCHAR(150)                       NOT NULL,
  message     TEXT                               NOT NULL,
  `level`     ENUM('Critical', 'Warning', 'Info') NOT NULL,
  type        ENUM('emergency', 'system')        NOT NULL,
  created_at  TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: appointments
-- Patient appointment scheduling
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                 INT                                NOT NULL AUTO_INCREMENT,
  patient_id         VARCHAR(10)                        NOT NULL,
  doctor_id          VARCHAR(10)                        NOT NULL,
  appointment_date   DATE                               NOT NULL,
  appointment_time   TIME                               NOT NULL,
  status             ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
  created_at         TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- ─────────────────────────────────────────
-- Table: prescriptions
-- Medication prescriptions
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id             INT            NOT NULL AUTO_INCREMENT,
  patient_id     VARCHAR(10)    NOT NULL,
  doctor_id      VARCHAR(10)    NOT NULL,
  medication     VARCHAR(150)   NOT NULL,
  dosage         VARCHAR(100)   NOT NULL,
  directions     TEXT           NOT NULL,
  start_date     DATE           NOT NULL,
  end_date       DATE           NULL,
  notes          TEXT           NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- ─────────────────────────────────────────
-- Table: departments
-- Hospital departments
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id            INT            NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)   NOT NULL,
  code          VARCHAR(20)    NOT NULL UNIQUE,
  chairman_id   VARCHAR(10)    NULL,
  location      VARCHAR(100)   NOT NULL,
  staff_count   INT            NOT NULL DEFAULT 0,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (chairman_id) REFERENCES doctors(id)
);

-- ─────────────────────────────────────────
-- Table: locations
-- Hospital locations and zones
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id           INT            NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)   NOT NULL,
  type         ENUM('Ward', 'ICU', 'ER', 'Lab', 'Pharmacy', 'Building') NOT NULL,
  latitude     DECIMAL(10,8)  NULL,
  longitude    DECIMAL(11,8)  NULL,
  address      VARCHAR(255)   NOT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: medical_files
-- Patient medical documents
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_files (
  id              INT            NOT NULL AUTO_INCREMENT,
  patient_id      VARCHAR(10)    NOT NULL,
  file_type       ENUM('X-Ray', 'MRI', 'CT Scan', 'Blood Test', 'Prescription', 'Other') NOT NULL,
  file_name       VARCHAR(255)   NOT NULL,
  file_url        VARCHAR(500)   NOT NULL,
  uploaded_date   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- ─────────────────────────────────────────
-- Table: rooms
-- Hospital rooms and beds
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id              INT            NOT NULL AUTO_INCREMENT,
  room_number     VARCHAR(20)    NOT NULL UNIQUE,
  room_type       ENUM('ICU', 'Emergency', 'General', 'Surgery') NOT NULL,
  status          ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
  department_id   INT            NOT NULL,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- ─────────────────────────────────────────
-- Table: room_reservations
-- Room booking and reservations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_reservations (
  id               INT                                NOT NULL AUTO_INCREMENT,
  room_id          INT                                NOT NULL,
  patient_id       VARCHAR(10)                        NOT NULL,
  check_in_date    DATE                               NOT NULL,
  check_out_date   DATE                               NULL,
  status           ENUM('Reserved', 'Checked In', 'Checked Out', 'Cancelled') NOT NULL DEFAULT 'Reserved',
  created_at       TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- ─────────────────────────────────────────
-- Table: roles
-- User roles and permissions
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id            INT            NOT NULL AUTO_INCREMENT,
  role_name     VARCHAR(50)    NOT NULL UNIQUE,
  description   VARCHAR(255)   NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: contact_messages
-- Messages from Contact Us form
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id           INT            NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)   NOT NULL,
  email        VARCHAR(150)   NOT NULL,
  subject      VARCHAR(200)   NOT NULL,
  message      TEXT           NOT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: staff_schedule
-- Staff shift scheduling
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_schedule (
  id            INT                                  NOT NULL AUTO_INCREMENT,
  staff_id      INT                                  NOT NULL,
  `date`        DATE                                 NOT NULL,
  shift         ENUM('Morning', 'Evening', 'Night')  NOT NULL,
  start_time    TIME                                 NOT NULL,
  end_time      TIME                                 NOT NULL,
  created_at    TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (staff_id) REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- Table: ambulances
-- Ambulance fleet management
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambulances (
  id                 INT                                NOT NULL AUTO_INCREMENT,
  license_plate      VARCHAR(50)                        NOT NULL UNIQUE,
  status             ENUM('Available', 'Busy', 'Maintenance') NOT NULL DEFAULT 'Available',
  driver_id          INT                                NULL,
  current_location   VARCHAR(255)                       NULL,
  created_at         TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

-- ─────────────────────────────────────────
-- Table: triage
-- Emergency triage assessment
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS triage (
  id                   INT                                NOT NULL AUTO_INCREMENT,
  patient_id           VARCHAR(10)                        NOT NULL,
  priority_level       ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
  symptoms             TEXT                               NOT NULL,
  assessment           TEXT                               NOT NULL,
  assigned_doctor_id   VARCHAR(10)                        NULL,
  created_at           TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id)
);

-- ─────────────────────────────────────────
-- Table: reports
-- Reports and statistics storage
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id             INT            NOT NULL AUTO_INCREMENT,
  title          VARCHAR(150)   NOT NULL,
  report_type    VARCHAR(100)   NOT NULL,
  generated_by   INT            NULL,
  report_data    JSON           NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
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