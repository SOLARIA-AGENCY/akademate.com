-- Create 5 Custom Roles for CEPComunicacion RBAC System
-- Phase F3 Day 2 - RBAC Configuration
-- Date: 2025-10-29

-- NOTE: Strapi's default roles are:
-- id=1: Authenticated (default for logged-in users)
-- id=2: Public (default for anonymous users)

-- Role 1: Admin (Full system access)
INSERT INTO up_roles (name, description, type, created_at, updated_at)
VALUES (
  'Admin',
  'Full system access - CTO level. Complete control over all collections, users, and settings.',
  'admin',
  NOW(),
  NOW()
);

-- Role 2: Gestor (Content and data management)
INSERT INTO up_roles (name, description, type, created_at, updated_at)
VALUES (
  'Gestor',
  'Content and data management - Academic coordinator. Can manage courses, students, enrollments but cannot manage users or system settings.',
  'gestor',
  NOW(),
  NOW()
);

-- Role 3: Marketing (Campaign and lead management)
INSERT INTO up_roles (name, description, type, created_at, updated_at)
VALUES (
  'Marketing',
  'Marketing campaign and lead management. Can manage campaigns, ads, leads, and analytics. Cannot access student PII.',
  'marketing',
  NOW(),
  NOW()
);

-- Role 4: Asesor (Lead management and follow-up)
INSERT INTO up_roles (name, description, type, created_at, updated_at)
VALUES (
  'Asesor',
  'Lead management and follow-up - Sales advisor. Can read and update assigned leads only. Cannot create or delete leads.',
  'asesor',
  NOW(),
  NOW()
);

-- Role 5: Lectura (Read-only access)
INSERT INTO up_roles (name, description, type, created_at, updated_at)
VALUES (
  'Lectura',
  'Read-only access - Reporting and analytics. Can view all collections except PII fields. Cannot modify any data.',
  'lectura',
  NOW(),
  NOW()
);

-- Verify roles were created
SELECT id, name, description, type FROM up_roles ORDER BY id;
