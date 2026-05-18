-- PulseED — Hospital Emergency Department System
-- Database Schema (multi-tenant)
--
-- Notes:
-- - Every tenant-scoped table contains `hospital_id`.
-- - This file is intended for local/dev bootstrapping (it drops/recreates the database).

DROP DATABASE IF EXISTS csci305_db;
CREATE DATABASE csci305_db;
USE csci305_db;

-- ─────────────────────────────────────────
-- Table: hospitals (tenant boundary)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id           INT           NOT NULL AUTO_INCREMENT,
  name         VARCHAR(150)  NOT NULL,
  rooms_count  INT           NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_hospitals_name (name)
);

-- ─────────────────────────────────────────
-- Table: roles (optional catalog)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id            INT            NOT NULL AUTO_INCREMENT,
  role_name     VARCHAR(50)    NOT NULL UNIQUE,
  description   VARCHAR(255)   NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- ─────────────────────────────────────────
-- Table: users
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           INT           NOT NULL AUTO_INCREMENT,
  hospital_id  INT           NOT NULL,
  first_name   VARCHAR(50)   NOT NULL,
  last_name    VARCHAR(50)   NOT NULL,
  email        VARCHAR(100)  NOT NULL,
  password     VARCHAR(255)  NOT NULL,
  role         ENUM('owner', 'admin', 'doctor', 'nurse', 'pending') NOT NULL,
  department_id INT          NULL,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_hospital_email (hospital_id, email),
  KEY idx_users_hospital_role (hospital_id, role),
  KEY idx_users_hospital_department (hospital_id, department_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: invitations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invitations (
  id            INT           NOT NULL AUTO_INCREMENT,
  hospital_id   INT           NOT NULL,
  email         VARCHAR(100)  NOT NULL,
  role          ENUM('admin', 'doctor', 'nurse') NOT NULL,
  token_hash    CHAR(64)      NOT NULL,
  invited_by    INT           NULL,
  registered_user_id INT      NULL,
  registered_at DATETIME      NULL,
  expires_at    DATETIME      NOT NULL,
  used_at       DATETIME      NULL,
  rejected_at   DATETIME      NULL,
  revoked_at    DATETIME      NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invitations_token_hash (token_hash),
  KEY idx_invitations_hospital_email (hospital_id, email),
  KEY idx_invitations_hospital_created (hospital_id, created_at),
  KEY idx_invitations_registered_user (registered_user_id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (registered_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- Table: patients
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
  id           VARCHAR(10)                          NOT NULL,
  hospital_id  INT                                  NOT NULL,
  name         VARCHAR(100)                         NOT NULL,
  age          TINYINT UNSIGNED                     NOT NULL,
  gender       ENUM('Male', 'Female', 'Other')      NOT NULL,
  `condition`  VARCHAR(150)                         NOT NULL,
  doctor       VARCHAR(100)                         NOT NULL,
  bay          VARCHAR(20)                          NOT NULL,
  `level`      ENUM('Critical', 'Urgent', 'Stable') NOT NULL,
  created_at   TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_patients_hospital_created (hospital_id, created_at),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: departments
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
  id            INT            NOT NULL AUTO_INCREMENT,
  hospital_id   INT            NOT NULL,
  name          VARCHAR(100)   NOT NULL,
  code          VARCHAR(20)    NOT NULL,
  chairman_id   VARCHAR(10)    NULL,
  location      VARCHAR(100)   NOT NULL,
  staff_count   INT            NOT NULL DEFAULT 0,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_hospital_code (hospital_id, code),
  KEY idx_departments_hospital_name (hospital_id, name),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: doctors
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
  id            VARCHAR(10)                         NOT NULL,
  hospital_id   INT                                 NOT NULL,
  name          VARCHAR(100)                        NOT NULL,
  email         VARCHAR(150)                        NOT NULL,
  specialty     VARCHAR(100)                        NOT NULL,
  department_id INT                                 NOT NULL,
  shift         ENUM('Morning', 'Evening', 'Night') NOT NULL,
  status        ENUM('On duty', 'On call', 'Off duty') NOT NULL,
  phone         VARCHAR(30)                         NULL,
  notes         TEXT                                NULL,
  created_at    TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doctors_hospital_email (hospital_id, email),
  KEY idx_doctors_hospital_created (hospital_id, created_at),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE departments
  ADD CONSTRAINT fk_departments_chairman
  FOREIGN KEY (chairman_id) REFERENCES doctors(id);

ALTER TABLE users
  ADD CONSTRAINT fk_users_department
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────
-- Table: emergency_cases
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_cases (
  id            VARCHAR(10)                            NOT NULL,
  hospital_id   INT                                    NOT NULL,
  name          VARCHAR(100)                           NOT NULL,
  age           TINYINT UNSIGNED                       NOT NULL,
  gender        ENUM('Male', 'Female', 'Other')        NOT NULL,
  complaint     VARCHAR(200)                           NOT NULL,
  room          VARCHAR(50)                            NOT NULL,
  doctor        VARCHAR(100)                           NOT NULL,
  severity      ENUM('Critical', 'Urgent', 'Stable')   NOT NULL,
  status        ENUM('Incoming', 'In treatment', 'Stabilized', 'Discharged') NOT NULL,
  arrival_time  DATETIME                               NULL,
  notes         TEXT                                   NULL,
  created_at    TIMESTAMP                              NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_emergency_cases_hospital_created (hospital_id, created_at),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: notifications
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            INT                                 NOT NULL AUTO_INCREMENT,
  hospital_id   INT                                 NOT NULL,
  actor_user_id INT                                 NULL,
  title         VARCHAR(150)                        NOT NULL,
  message       TEXT                                NOT NULL,
  `level`       ENUM('Critical', 'Warning', 'Info')  NOT NULL,
  type          ENUM('emergency', 'system', 'audit') NOT NULL,
  entity_type   VARCHAR(50)                         NULL,
  entity_id     VARCHAR(50)                         NULL,
  created_at    TIMESTAMP                           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_hospital_created (hospital_id, created_at),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- Table: appointments
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               INT                                NOT NULL AUTO_INCREMENT,
  hospital_id       INT                                NOT NULL,
  patient_id        VARCHAR(10)                        NOT NULL,
  doctor_id         VARCHAR(10)                        NOT NULL,
  appointment_date  DATE                               NOT NULL,
  appointment_time  TIME                               NOT NULL,
  status            ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Scheduled',
  created_at        TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointments_hospital_date (hospital_id, appointment_date),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: prescriptions
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id           INT            NOT NULL AUTO_INCREMENT,
  hospital_id  INT            NOT NULL,
  patient_id   VARCHAR(10)    NOT NULL,
  doctor_id    VARCHAR(10)    NOT NULL,
  medication   VARCHAR(150)   NOT NULL,
  dosage       VARCHAR(100)   NOT NULL,
  directions   TEXT           NOT NULL,
  start_date   DATE           NOT NULL,
  end_date     DATE           NULL,
  notes        TEXT           NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prescriptions_hospital_created (hospital_id, created_at),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: locations (phase 2 supported)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS locations (
  id           INT            NOT NULL AUTO_INCREMENT,
  hospital_id  INT            NOT NULL,
  name         VARCHAR(100)   NOT NULL,
  type         ENUM('Ward', 'ICU', 'ER', 'Lab', 'Pharmacy', 'Building') NOT NULL,
  latitude     DECIMAL(10,8)  NULL,
  longitude    DECIMAL(11,8)  NULL,
  address      VARCHAR(255)   NOT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_locations_hospital_created (hospital_id, created_at),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: medical_files (patient scoped)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_files (
  id            INT            NOT NULL AUTO_INCREMENT,
  hospital_id    INT            NOT NULL,
  patient_id     VARCHAR(10)    NOT NULL,
  file_type      ENUM('X-Ray', 'MRI', 'CT Scan', 'Blood Test', 'Prescription', 'Other') NOT NULL,
  file_name      VARCHAR(255)   NOT NULL,
  file_url       VARCHAR(500)   NOT NULL,
  uploaded_date  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_medical_files_hospital_uploaded (hospital_id, uploaded_date),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: rooms
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rooms (
  id            INT            NOT NULL AUTO_INCREMENT,
  hospital_id   INT            NOT NULL,
  room_number   VARCHAR(20)    NOT NULL,
  room_type     ENUM('ICU', 'Emergency', 'General', 'Surgery') NOT NULL,
  status        ENUM('Available', 'Occupied', 'Maintenance') NOT NULL DEFAULT 'Available',
  department_id INT            NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_rooms_hospital_number (hospital_id, room_number),
  KEY idx_rooms_hospital_status (hospital_id, status),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: room_reservations
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_reservations (
  id              INT                                NOT NULL AUTO_INCREMENT,
  hospital_id      INT                                NOT NULL,
  room_id          INT                                NOT NULL,
  patient_id       VARCHAR(10)                        NOT NULL,
  check_in_date    DATE                               NOT NULL,
  check_out_date   DATE                               NULL,
  status           ENUM('Reserved', 'Checked In', 'Checked Out', 'Cancelled') NOT NULL DEFAULT 'Reserved',
  created_at       TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_room_reservations_hospital_created (hospital_id, created_at),
  FOREIGN KEY (room_id) REFERENCES rooms(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: contact_messages
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id           INT            NOT NULL AUTO_INCREMENT,
  hospital_id  INT            NULL,
  name         VARCHAR(100)   NOT NULL,
  email        VARCHAR(150)   NOT NULL,
  subject      VARCHAR(200)   NOT NULL,
  message      TEXT           NOT NULL,
  created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_messages_created (created_at),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- Table: staff_schedule
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_schedule (
  id            INT                                  NOT NULL AUTO_INCREMENT,
  hospital_id    INT                                  NOT NULL,
  staff_id      INT                                  NOT NULL,
  `date`        DATE                                 NOT NULL,
  shift         ENUM('Morning', 'Evening', 'Night')  NOT NULL,
  start_time    TIME                                 NOT NULL,
  end_time      TIME                                 NOT NULL,
  created_at    TIMESTAMP                            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_staff_schedule_hospital_date (hospital_id, `date`),
  FOREIGN KEY (staff_id) REFERENCES users(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: ambulances
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambulances (
  id               INT                                NOT NULL AUTO_INCREMENT,
  hospital_id       INT                                NOT NULL,
  license_plate     VARCHAR(50)                        NOT NULL UNIQUE,
  status            ENUM('Available', 'Busy', 'Maintenance') NOT NULL DEFAULT 'Available',
  driver_id         INT                                NULL,
  current_location  VARCHAR(255)                       NULL,
  created_at        TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ambulances_hospital_status (hospital_id, status),
  FOREIGN KEY (driver_id) REFERENCES users(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: triage
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS triage (
  id                  INT                                NOT NULL AUTO_INCREMENT,
  hospital_id          INT                                NOT NULL,
  patient_id           VARCHAR(10)                        NOT NULL,
  priority_level       ENUM('Critical', 'High', 'Medium', 'Low') NOT NULL,
  symptoms             TEXT                               NOT NULL,
  assessment           TEXT                               NOT NULL,
  assigned_doctor_id   VARCHAR(10)                        NULL,
  created_at           TIMESTAMP                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_triage_hospital_created (hospital_id, created_at),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: reports
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id            INT            NOT NULL AUTO_INCREMENT,
  hospital_id    INT            NOT NULL,
  title         VARCHAR(150)   NOT NULL,
  report_type   VARCHAR(100)   NOT NULL,
  generated_by  INT            NULL,
  report_data   JSON           NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reports_hospital_created (hospital_id, created_at),
  FOREIGN KEY (generated_by) REFERENCES users(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Table: hospital_files
-- Hospital-level uploads (CSV/Excel) and parsed data
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospital_files (
  id            INT            NOT NULL AUTO_INCREMENT,
  hospital_id   INT            NOT NULL,
  patient_id    VARCHAR(10)    NULL,
  uploaded_by   INT            NULL,
  file_name     VARCHAR(255)   NOT NULL,
  file_type     ENUM('CSV', 'EXCEL', 'OTHER') NOT NULL DEFAULT 'OTHER',
  mime_type     VARCHAR(120)   NULL,
  parsed_data   JSON           NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_hospital_files_hospital_created (hospital_id, created_at),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────
-- Table: doctor_patient_treatment
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_patient_treatment (
  id             INT            NOT NULL AUTO_INCREMENT,
  hospital_id    INT            NOT NULL,
  doctor_id      VARCHAR(10)    NOT NULL,
  patient_id     VARCHAR(10)    NOT NULL,
  hours_per_week DECIMAL(5,2)   NOT NULL,
  start_date     DATE           NOT NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_treatment_hospital (hospital_id, created_at),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
-- Schema extensions (ADD COLUMN)
-- ─────────────────────────────────────────

ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS ssn             VARCHAR(20)   UNIQUE NULL,
  ADD COLUMN IF NOT EXISTS address         VARCHAR(255)  NULL,
  ADD COLUMN IF NOT EXISTS phone           VARCHAR(30)   NULL,
  ADD COLUMN IF NOT EXISTS birthdate       DATE          NULL,
  ADD COLUMN IF NOT EXISTS blood_pressure  VARCHAR(20)   NULL,
  ADD COLUMN IF NOT EXISTS heart_rate      INT           NULL,
  ADD COLUMN IF NOT EXISTS temperature     DECIMAL(4,1)  NULL,
  ADD COLUMN IF NOT EXISTS medical_history TEXT          NULL,
  ADD COLUMN IF NOT EXISTS admitted_date   DATE          NULL;

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS ssn         VARCHAR(20)                        UNIQUE NULL,
  ADD COLUMN IF NOT EXISTS sex         ENUM('Male', 'Female', 'Other')    NULL,
  ADD COLUMN IF NOT EXISTS birthdate   DATE                               NULL,
  ADD COLUMN IF NOT EXISTS degree      VARCHAR(100)                       NULL,
  ADD COLUMN IF NOT EXISTS joined_date DATE                               NULL;

ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS chairman_since DATE NULL;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS payment_status  ENUM('Unpaid', 'Paid', 'Refunded') NOT NULL DEFAULT 'Unpaid',
  ADD COLUMN IF NOT EXISTS payment_amount  DECIMAL(10,2)                       NULL,
  ADD COLUMN IF NOT EXISTS refund_date     DATE                                NULL;

-- ─────────────────────────────────────────
-- Seed data (safe defaults)
-- ─────────────────────────────────────────
INSERT INTO roles (role_name, description) VALUES
  ('owner', 'Full hospital ownership'),
  ('admin', 'Administrative access excluding owner controls'),
  ('doctor', 'Appointments, prescriptions, medical files'),
  ('nurse', 'Triage, emergency queue, rooms')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Hospitals
INSERT INTO hospitals (name, rooms_count) VALUES
  ('City General Hospital', 20),
  ('Riverside Medical Center', 12);

-- Departments
INSERT INTO departments (hospital_id, name, code, location, staff_count) VALUES
  (1, 'Emergency', 'ER', 'Ground floor', 0),
  (1, 'General Medicine', 'GEN', 'Building A', 0),
  (2, 'Emergency', 'ER', 'Ground floor', 0),
  (2, 'General Medicine', 'GEN', 'Building B', 0);

-- Doctors (referencing department IDs created above)
INSERT INTO doctors (id, hospital_id, name, email, specialty, department_id, shift, status, phone, notes) VALUES
  ('DOC-0001', 1, 'Dr. Sarah Mitchell', 'sarah.mitchell@pulseED.com', 'Emergency Medicine', 1, 'Morning', 'On duty', NULL, NULL),
  ('DOC-0002', 2, 'Dr. Priya Nair', 'priya.nair@pulseED.com', 'Emergency Medicine', 3, 'Evening', 'On duty', NULL, NULL);

-- Users (passwords are bcrypt hashes of 'password123')
INSERT INTO users (hospital_id, first_name, last_name, email, password, role, department_id) VALUES
  (1, 'Sarah', 'Mitchell', 'sarah.mitchell@pulseED.com', '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'doctor', 1),
  (1, 'James', 'Carter',   'james.carter@pulseED.com',   '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'nurse', 1),
  (2, 'Priya', 'Nair',     'priya.nair@pulseED.com',     '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'doctor', 3),
  (2, 'Omar',  'Hassan',   'omar.hassan@pulseED.com',    '$2a$10$H9AWXL7f1dEO6DjHcdwLn.v4Tcex9v//fTyRLKcISIGd1QipDBKF6', 'admin', 4);

-- Patients
INSERT INTO patients (id, hospital_id, name, age, gender, `condition`, doctor, bay, `level`) VALUES
  ('ED-2841', 1, 'Thomas Greene', 45, 'Male', 'Acute chest pain, possible MI', 'Dr. Sarah Mitchell', 'Bay 1', 'Critical'),
  ('ED-2843', 1, 'Robert Kim',    67, 'Male', 'Shortness of breath, suspected COPD', 'Dr. Sarah Mitchell', 'Bay 3', 'Urgent'),
  ('ED-2842', 2, 'Aisha Patel',   32, 'Female', 'Severe allergic reaction', 'Dr. Priya Nair', 'Bay 2', 'Critical'),
  ('ED-2844', 2, 'Maria Santos',  29, 'Female', 'Fractured wrist, moderate pain', 'Dr. Priya Nair', 'Bay 5', 'Stable');

-- Notifications
INSERT INTO notifications (hospital_id, title, message, `level`, type) VALUES
  (1, 'Code Blue — Bay 1', 'Patient ED-2841 is in cardiac arrest. All available staff report to Bay 1 immediately.', 'Critical', 'emergency'),
  (1, 'Shift Change Reminder', 'Night shift begins at 22:00. Please complete all pending handover notes before then.', 'Info', 'system'),
  (2, 'Trauma Team Activation', 'Multiple vehicle accident incoming. Trauma team activate for Bay 2 and Bay 3.', 'Critical', 'emergency'),
  (2, 'New Policy Update', 'Updated triage guidelines are now in effect. Review the new protocol in the portal.', 'Info', 'system');

