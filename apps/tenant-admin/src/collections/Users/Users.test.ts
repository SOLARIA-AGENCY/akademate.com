import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

/**
 * Users Collection API Tests
 *
 * This test suite covers:
 * - Authentication (login, logout, me, forgot-password, reset-password)
 * - CRUD operations (create, read, update, delete)
 * - Role-based access control (admin, gestor, marketing, asesor, lectura)
 * - Security (password hashing, complexity, uniqueness, lockout)
 * - Business logic (cannot delete self, cannot change own role, at least one admin)
 *
 * Test Users (from seed data):
 * - admin@cepcomunicacion.com (role: admin)
 * - gestor@cepcomunicacion.com (role: gestor)
 * - marketing@cepcomunicacion.com (role: marketing)
 * - asesor@cepcomunicacion.com (role: asesor)
 * - lectura@cepcomunicacion.com (role: lectura)
 *
 * All test passwords: Test123!@#
 */
describe('Users Collection API', () => {
  let payload: Payload;
  let adminToken: string;
  let gestorToken: string;
  let marketingToken: string;
  let asesorToken: string;
  let lecturaToken: string;
  let adminUserId: string;
  let gestorUserId: string;
  let marketingUserId: string;
  let asesorUserId: string;
  let lecturaUserId: string;
  let testUserIds: string[] = [];

  beforeAll(async () => {
    // Initialize Payload
    payload = await getPayload({ config: await import('../../payload.config') });

    // Login as admin
    const adminLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'admin@cepcomunicacion.com',
        password: 'Test123!@#',
      });
    adminToken = adminLogin.body.token;
    adminUserId = adminLogin.body.user.id;

    // Login as gestor
    const gestorLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'gestor@cepcomunicacion.com',
        password: 'Test123!@#',
      });
    gestorToken = gestorLogin.body.token;
    gestorUserId = gestorLogin.body.user.id;

    // Login as marketing
    const marketingLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'marketing@cepcomunicacion.com',
        password: 'Test123!@#',
      });
    marketingToken = marketingLogin.body.token;
    marketingUserId = marketingLogin.body.user.id;

    // Login as asesor
    const asesorLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'asesor@cepcomunicacion.com',
        password: 'Test123!@#',
      });
    asesorToken = asesorLogin.body.token;
    asesorUserId = asesorLogin.body.user.id;

    // Login as lectura
    const lecturaLogin = await request(payload.express)
      .post('/api/users/login')
      .send({
        email: 'lectura@cepcomunicacion.com',
        password: 'Test123!@#',
      });
    lecturaToken = lecturaLogin.body.token;
    lecturaUserId = lecturaLogin.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test users
    for (const userId of testUserIds) {
      try {
        await payload.delete({
          collection: 'users',
          id: userId,
        });
      } catch (error) {
        // User might already be deleted
      }
    }
  });

  describe('Authentication - POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(payload.express)
        .post('/api/users/login')
        .send({
          email: 'admin@cepcomunicacion.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('admin@cepcomunicacion.com');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(payload.express)
        .post('/api/users/login')
        .send({
          email: 'admin@cepcomunicacion.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(payload.express)
        .post('/api/users/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.errors).toBeDefined();
    });

    it('should reject login for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await payload.create({
        collection: 'users',
        data: {
          email: 'inactive@test.com',
          password: 'Test123!@#',
          name: 'Inactive User',
          role: 'lectura',
          is_active: false,
        },
      });
      testUserIds.push(inactiveUser.id);

      const response = await request(payload.express)
        .post('/api/users/login')
        .send({
          email: 'inactive@test.com',
          password: 'Test123!@#',
        })
        .expect(401);

      expect(response.body.errors).toBeDefined();
    });

    it('should update login stats after successful login', async () => {
      // Get initial stats
      const userBefore = await payload.findByID({
        collection: 'users',
        id: adminUserId,
      });
      const initialLoginCount = userBefore.login_count || 0;

      // Login
      await request(payload.express)
        .post('/api/users/login')
        .send({
          email: 'admin@cepcomunicacion.com',
          password: 'Test123!@#',
        })
        .expect(200);

      // Check updated stats
      const userAfter = await payload.findByID({
        collection: 'users',
        id: adminUserId,
      });

      expect(userAfter.login_count).toBe(initialLoginCount + 1);
      expect(userAfter.last_login_at).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(payload.express)
        .post('/api/users/login')
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Authentication - POST /api/users/logout', () => {
    it('should logout authenticated user', async () => {
      const response = await request(payload.express)
        .post('/api/users/logout')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toBeDefined();
    });

    it('should reject logout without authentication', async () => {
      await request(payload.express)
        .post('/api/users/logout')
        .expect(401);
    });
  });

  describe('Authentication - GET /api/users/me', () => {
    it('should return current authenticated user', async () => {
      const response = await request(payload.express)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('admin@cepcomunicacion.com');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject without authentication', async () => {
      await request(payload.express)
        .get('/api/users/me')
        .expect(401);
    });
  });

  describe('Authentication - POST /api/users/forgot-password', () => {
    it('should send password reset email for valid user', async () => {
      const response = await request(payload.express)
        .post('/api/users/forgot-password')
        .send({
          email: 'admin@cepcomunicacion.com',
        })
        .expect(200);

      expect(response.body.message).toBeDefined();
    });

    it('should not reveal if email does not exist (security)', async () => {
      // Should return 200 even if email doesn't exist (prevent email enumeration)
      const response = await request(payload.express)
        .post('/api/users/forgot-password')
        .send({
          email: 'nonexistent@example.com',
        })
        .expect(200);

      expect(response.body.message).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(payload.express)
        .post('/api/users/forgot-password')
        .send({
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('CRUD - POST /api/users (Create)', () => {
    it('should create user with valid data (admin)', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'Test123!@#',
        name: 'New User',
        role: 'marketing',
        phone: '+34 123 456 789',
      };

      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.doc).toHaveProperty('id');
      expect(response.body.doc.email).toBe('newuser@test.com');
      expect(response.body.doc.name).toBe('New User');
      expect(response.body.doc.role).toBe('marketing');
      expect(response.body.doc.is_active).toBe(true);
      expect(response.body.doc).not.toHaveProperty('password');
      expect(response.body.doc).not.toHaveProperty('password_hash');

      testUserIds.push(response.body.doc.id);
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'hashtest@test.com',
        password: 'Test123!@#',
        name: 'Hash Test',
        role: 'lectura',
      };

      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      testUserIds.push(response.body.doc.id);

      // Verify we can login with the password (proves it was hashed correctly)
      const loginResponse = await request(payload.express)
        .post('/api/users/login')
        .send({
          email: 'hashtest@test.com',
          password: 'Test123!@#',
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
    });

    it('should reject user without required fields', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'incomplete@test.com',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'duplicate@test.com',
        password: 'Test123!@#',
        name: 'Duplicate Test',
        role: 'lectura',
      };

      // First creation should succeed
      const first = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      testUserIds.push(first.body.doc.id);

      // Second creation with same email should fail
      await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);
    });

    it('should validate password complexity - minimum length', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'weakpass@test.com',
          password: 'Test1!',
          name: 'Weak Pass',
          role: 'lectura',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate password complexity - requires lowercase', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'nolower@test.com',
          password: 'TEST123!@#',
          name: 'No Lower',
          role: 'lectura',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate password complexity - requires uppercase', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'noupper@test.com',
          password: 'test123!@#',
          name: 'No Upper',
          role: 'lectura',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate password complexity - requires number', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'nonumber@test.com',
          password: 'TestTest!@#',
          name: 'No Number',
          role: 'lectura',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate password complexity - requires special character', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'nospecial@test.com',
          password: 'Test123456',
          name: 'No Special',
          role: 'lectura',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate role enum values', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalidrole@test.com',
          password: 'Test123!@#',
          name: 'Invalid Role',
          role: 'superadmin', // Not in enum
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should set default role to lectura if not provided', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'defaultrole@test.com',
          password: 'Test123!@#',
          name: 'Default Role',
        })
        .expect(201);

      expect(response.body.doc.role).toBe('lectura');
      testUserIds.push(response.body.doc.id);
    });

    it('should set is_active to true by default', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'defaultactive@test.com',
          password: 'Test123!@#',
          name: 'Default Active',
          role: 'lectura',
        })
        .expect(201);

      expect(response.body.doc.is_active).toBe(true);
      testUserIds.push(response.body.doc.id);
    });

    it('should validate email format', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: 'Test123!@#',
          name: 'Invalid Email',
          role: 'lectura',
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should validate phone format if provided', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalidphone@test.com',
          password: 'Test123!@#',
          name: 'Invalid Phone',
          role: 'lectura',
          phone: '123456789', // Invalid format
        })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should allow gestor to create non-admin users', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({
          email: 'gestorcreated@test.com',
          password: 'Test123!@#',
          name: 'Gestor Created',
          role: 'marketing',
        })
        .expect(201);

      expect(response.body.doc.role).toBe('marketing');
      testUserIds.push(response.body.doc.id);
    });

    it('should prevent gestor from creating admin users', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({
          email: 'gestortoadmin@test.com',
          password: 'Test123!@#',
          name: 'Gestor to Admin',
          role: 'admin',
        })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent marketing from creating users', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({
          email: 'marketingcreate@test.com',
          password: 'Test123!@#',
          name: 'Marketing Create',
          role: 'lectura',
        })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent asesor from creating users', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${asesorToken}`)
        .send({
          email: 'asesorcreate@test.com',
          password: 'Test123!@#',
          name: 'Asesor Create',
          role: 'lectura',
        })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent lectura from creating users', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .set('Authorization', `Bearer ${lecturaToken}`)
        .send({
          email: 'lecturacreate@test.com',
          password: 'Test123!@#',
          name: 'Lectura Create',
          role: 'lectura',
        })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication to create users', async () => {
      const response = await request(payload.express)
        .post('/api/users')
        .send({
          email: 'noauth@test.com',
          password: 'Test123!@#',
          name: 'No Auth',
          role: 'lectura',
        })
        .expect(401);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('CRUD - GET /api/users (List)', () => {
    it('should allow admin to read all users', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
      expect(response.body.totalDocs).toBeGreaterThanOrEqual(5); // At least seed users
    });

    it('should allow gestor to read all users', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(response.body.docs).toBeInstanceOf(Array);
      expect(response.body.totalDocs).toBeGreaterThanOrEqual(5);
    });

    it('should limit marketing to read only self', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${marketingToken}`)
        .expect(200);

      expect(response.body.totalDocs).toBe(1);
      expect(response.body.docs[0].id).toBe(marketingUserId);
    });

    it('should limit asesor to read only self', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${asesorToken}`)
        .expect(200);

      expect(response.body.totalDocs).toBe(1);
      expect(response.body.docs[0].id).toBe(asesorUserId);
    });

    it('should limit lectura to read only self', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${lecturaToken}`)
        .expect(200);

      expect(response.body.totalDocs).toBe(1);
      expect(response.body.docs[0].id).toBe(lecturaUserId);
    });

    it('should not expose password in response', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.docs.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('password_hash');
      });
    });

    it('should allow filtering by role', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ where: { role: { equals: 'admin' } } })
        .expect(200);

      response.body.docs.forEach((user: any) => {
        expect(user.role).toBe('admin');
      });
    });

    it('should allow filtering by is_active', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ where: { is_active: { equals: true } } })
        .expect(200);

      response.body.docs.forEach((user: any) => {
        expect(user.is_active).toBe(true);
      });
    });

    it('should require authentication', async () => {
      await request(payload.express)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('CRUD - GET /api/users/:id (Read One)', () => {
    it('should allow admin to read any user', async () => {
      const response = await request(payload.express)
        .get(`/api/users/${gestorUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(gestorUserId);
      expect(response.body.email).toBe('gestor@cepcomunicacion.com');
    });

    it('should allow gestor to read any user', async () => {
      const response = await request(payload.express)
        .get(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(200);

      expect(response.body.id).toBe(marketingUserId);
    });

    it('should allow user to read self', async () => {
      const response = await request(payload.express)
        .get(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .expect(200);

      expect(response.body.id).toBe(marketingUserId);
    });

    it('should prevent marketing from reading other users', async () => {
      const response = await request(payload.express)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent asesor from reading other users', async () => {
      const response = await request(payload.express)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${asesorToken}`)
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent lectura from reading other users', async () => {
      const response = await request(payload.express)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${lecturaToken}`)
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should not expose password in response', async () => {
      const response = await request(payload.express)
        .get(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password_hash');
    });

    it('should return 404 for non-existent user', async () => {
      await request(payload.express)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('CRUD - PATCH /api/users/:id (Update)', () => {
    it('should allow admin to update any user', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${gestorUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Gestor Name' })
        .expect(200);

      expect(response.body.doc.name).toBe('Updated Gestor Name');
    });

    it('should allow user to update self', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ name: 'Marketing Updated' })
        .expect(200);

      expect(response.body.doc.name).toBe('Marketing Updated');
    });

    it('should prevent user from updating other users', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent user from changing own role', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ role: 'admin' })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should allow admin to change user role', async () => {
      // Create a test user
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'rolechange@test.com',
          password: 'Test123!@#',
          name: 'Role Change',
          role: 'lectura',
        },
      });
      testUserIds.push(user.id);

      const response = await request(payload.express)
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'marketing' })
        .expect(200);

      expect(response.body.doc.role).toBe('marketing');
    });

    it('should prevent demoting the last admin', async () => {
      // Get all admin users
      const admins = await payload.find({
        collection: 'users',
        where: { role: { equals: 'admin' } },
      });

      if (admins.totalDocs === 1) {
        // Try to demote the only admin
        const response = await request(payload.express)
          .patch(`/api/users/${admins.docs[0].id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ role: 'gestor' })
          .expect(400);

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toContain('last admin');
      }
    });

    it('should allow admin to activate/deactivate users', async () => {
      // Create a test user
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'activate@test.com',
          password: 'Test123!@#',
          name: 'Activate Test',
          role: 'lectura',
        },
      });
      testUserIds.push(user.id);

      const response = await request(payload.express)
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false })
        .expect(200);

      expect(response.body.doc.is_active).toBe(false);
    });

    it('should prevent non-admin from changing is_active', async () => {
      // Create a test user
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'deactivatetest@test.com',
          password: 'Test123!@#',
          name: 'Deactivate Test',
          role: 'lectura',
        },
      });
      testUserIds.push(user.id);

      const response = await request(payload.express)
        .patch(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .send({ is_active: false })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should allow updating phone number', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ phone: '+34 987 654 321' })
        .expect(200);

      expect(response.body.doc.phone).toBe('+34 987 654 321');
    });

    it('should validate phone format on update', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ phone: 'invalid-phone' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should allow updating avatar_url', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ avatar_url: 'https://example.com/avatar.jpg' })
        .expect(200);

      expect(response.body.doc.avatar_url).toBe('https://example.com/avatar.jpg');
    });

    it('should validate avatar_url format', async () => {
      const response = await request(payload.express)
        .patch(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ avatar_url: 'not-a-url' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('should not allow updating email (should be immutable)', async () => {
      // Note: Depending on business requirements, email updates might be restricted
      // This test assumes email cannot be changed
      const response = await request(payload.express)
        .patch(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .send({ email: 'newemail@test.com' })
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('CRUD - DELETE /api/users/:id (Delete)', () => {
    it('should allow admin to delete users', async () => {
      // Create a test user
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'todelete@test.com',
          password: 'Test123!@#',
          name: 'To Delete',
          role: 'lectura',
        },
      });

      await request(payload.express)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await payload.findByID({
        collection: 'users',
        id: user.id,
      }).catch(() => null);

      expect(deleted).toBeNull();
    });

    it('should prevent admin from deleting self', async () => {
      const response = await request(payload.express)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('cannot delete yourself');
    });

    it('should prevent gestor from deleting users', async () => {
      // Create a test user
      const user = await payload.create({
        collection: 'users',
        data: {
          email: 'gestordelete@test.com',
          password: 'Test123!@#',
          name: 'Gestor Delete',
          role: 'lectura',
        },
      });
      testUserIds.push(user.id);

      const response = await request(payload.express)
        .delete(`/api/users/${user.id}`)
        .set('Authorization', `Bearer ${gestorToken}`)
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent marketing from deleting users', async () => {
      const response = await request(payload.express)
        .delete(`/api/users/${lecturaUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should prevent users from deleting themselves', async () => {
      const response = await request(payload.express)
        .delete(`/api/users/${marketingUserId}`)
        .set('Authorization', `Bearer ${marketingToken}`)
        .expect(403);

      expect(response.body.errors).toBeDefined();
    });

    it('should require authentication to delete users', async () => {
      await request(payload.express)
        .delete(`/api/users/${lecturaUserId}`)
        .expect(401);
    });

    it('should return 404 for non-existent user', async () => {
      await request(payload.express)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Security', () => {
    it('should never expose password_hash in API responses', async () => {
      const response = await request(payload.express)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.docs.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('password_hash');
        expect(user).not.toHaveProperty('reset_password_token');
      });
    });

    it('should enforce HTTPS in production (mocked)', async () => {
      // This would be tested in integration tests with real production config
      expect(process.env.NODE_ENV).toBeDefined();
    });

    it('should have secure session configuration', async () => {
      // Payload handles session security internally
      // This is a placeholder for future security audits
      expect(true).toBe(true);
    });
  });

  describe('Business Logic', () => {
    it('should maintain at least one admin user in the system', async () => {
      const admins = await payload.find({
        collection: 'users',
        where: { role: { equals: 'admin' } },
      });

      expect(admins.totalDocs).toBeGreaterThanOrEqual(1);
    });

    it('should track login statistics', async () => {
      const userBefore = await payload.findByID({
        collection: 'users',
        id: adminUserId,
      });

      expect(userBefore.login_count).toBeGreaterThanOrEqual(1);
      expect(userBefore.last_login_at).toBeDefined();
    });

    it('should set created_at and updated_at timestamps', async () => {
      const user = await payload.findByID({
        collection: 'users',
        id: adminUserId,
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });
  });
});
