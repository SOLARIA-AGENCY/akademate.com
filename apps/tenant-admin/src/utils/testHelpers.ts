import request from 'supertest';
import { Express } from 'express';
import express from 'express';

// Mock Payload interface for testing
interface MockPayload {
  create: (options: any) => Promise<any>;
  find: (options: any) => Promise<any>;
  findByID: (options: any) => Promise<any>;
  update: (options: any) => Promise<any>;
  delete: (options: any) => Promise<any>;
}

// Mock Payload for testing
class PayloadMock implements MockPayload {
  private data: Map<string, any[]> = new Map();
  private nextId: number = 1;
  public logs: string[] = []; // Capture logs for PII testing

  constructor() {
    // Initialize collections
    this.data.set('users', []);
    this.data.set('students', []);
    this.data.set('enrollments', []);
    
    // Mock database interface
    this.db = {
      insert: () => { throw new Error('Database constraints violated'); },
      update: () => { throw new Error('Database constraints violated'); }
    };
  }

  // Validation helpers
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private validateSpanishPhone(phone: string): boolean {
    // Accept Spanish format: +34 6XX XXX XXX or +34 9XX XXX XXX
    const phoneRegex = /^\+34\s?[6-9]\d{2}\s?\d{3}\s?\d{3}$/;
    return phoneRegex.test(phone);
  }

  private validateDNI(dni: string): boolean {
    // Spanish DNI: 8 digits + 1 letter
    const dniRegex = /^\d{8}[A-HJ-NP-TV-Z]$/;
    if (!dniRegex.test(dni)) return false;
    
    // Validate letter checksum
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const numbers = parseInt(dni.substring(0, 8));
    const expectedLetter = letters[numbers % 23];
    return dni[8].toUpperCase() === expectedLetter;
  }

  private validateAge(dateOfBirth: string): boolean {
    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    const age = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= 16;
  }

  private validateStatus(status: string): boolean {
    const validStatuses = ['active', 'inactive', 'suspended', 'graduated'];
    return validStatuses.includes(status);
  }

  private extractIP(req?: any): string {
    // Extract IP from various sources
    if (req?.headers?.['x-forwarded-for']) {
      return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    if (req?.ip) {
      return req.ip;
    }
    return '127.0.0.1'; // Default for tests
  }

  async create(options: any): Promise<any> {
    const { collection, data, user, req } = options;
    
    // Check basic authentication (except for users collection during setup)
    if (collection !== 'users') {
      this.checkAuthentication(user, collection, 'create');
    }
    
    if (!this.data.has(collection)) {
      this.data.set(collection, []);
    }

    // Extract IP from request
    const clientIP = this.extractIP(req);

    // Validate fields based on collection
    if (collection === 'students') {
      // Email validation
      if (data.email && !this.validateEmail(data.email)) {
        throw new Error('Invalid email format');
      }
      
      // Phone validation
      if (data.phone && !this.validateSpanishPhone(data.phone)) {
        throw new Error('Invalid Spanish phone format. Must include +34 country code');
      }
      
      // DNI validation
      if (data.dni && !this.validateDNI(data.dni)) {
        throw new Error('Invalid DNI format or checksum');
      }
      
      // Age validation
      if (data.date_of_birth && !this.validateAge(data.date_of_birth)) {
        throw new Error('Student must be at least 16 years old');
      }
      
      // Status validation
      if (data.status && !this.validateStatus(data.status)) {
        throw new Error('Invalid status value');
      }
      
      // Emergency contact phone validation
      if (data.emergency_contact_phone && !this.validateSpanishPhone(data.emergency_contact_phone)) {
        throw new Error('Invalid emergency contact phone format');
      }
      
      // GDPR consent validation
      if (data.gdpr_consent !== true) {
        throw new Error('gdpr_consent is required and must be true');
      }
      
      if (data.privacy_policy_accepted !== true) {
        throw new Error('privacy_policy_accepted is required and must be true');
      }
    }

    // Validate email uniqueness
    if (data.email) {
      const existing = this.data.get(collection)?.find(item => item.email === data.email);
      if (existing) {
        throw new Error(`Email ${data.email} already exists`);
      }
    }

    // Validate DNI uniqueness
    if (data.dni) {
      const existing = this.data.get(collection)?.find(item => item.dni === data.dni);
      if (existing) {
        throw new Error(`DNI ${data.dni} already exists`);
      }
    }

    // Validate password for users
    if (collection === 'users' && !data.password) {
      throw new Error('Password is required for users');
    }

    const id = this.nextId++;
    const now = new Date();
    const doc = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
      created_by: user?.id || null,
    };

    // Auto-capture consent metadata for students
    if (collection === 'students') {
      doc.consent_timestamp = now.toISOString();
      doc.consent_ip_address = clientIP;
      
      // Validate created_by user exists
      if (doc.created_by) {
        const users = this.data.get('users') || [];
        const userExists = users.some(u => u.id === doc.created_by);
        if (!userExists) {
          throw new Error('Referenced user does not exist');
        }
      }
    }

    this.data.get(collection)!.push(doc);
    
    // Log non-PII information for testing
    this.logs.push(`Created ${collection} with ID: ${doc.id}`);
    this.logs.push(`hasEmail: ${!!doc.email}`);
    this.logs.push(`status: ${doc.status || 'N/A'}`);
    this.logs.push(`active: ${doc.status === 'active'}`);
    
    return doc;
  }

  async find(options: any): Promise<any> {
    const { collection, where, limit = 10, page = 1, user, sort } = options;
    let docs = this.data.get(collection) || [];

    // Apply filters
    if (where) {
      Object.entries(where).forEach(([field, condition]: [string, any]) => {
        if (typeof condition === 'object' && condition.equals) {
          docs = docs.filter(doc => doc[field] === condition.equals);
        }
      });
    }

    // Apply sorting
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const descending = sort.startsWith('-');
      
      docs.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        // Handle dates
        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();
        
        if (aVal < bVal) return descending ? 1 : -1;
        if (aVal > bVal) return descending ? -1 : 1;
        return 0;
      });
    }

    // Apply field access control to each document
    const filteredDocs = docs.map(doc => this.applyFieldAccessControl(doc, collection, user));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + limit);

    return {
      docs: paginatedDocs,
      totalDocs: filteredDocs.length,
      totalPages: Math.ceil(filteredDocs.length / limit),
      page,
      limit,
      hasNextPage: page * limit < filteredDocs.length,
      hasPrevPage: page > 1,
    };
  }

  async findByID(options: any): Promise<any> {
    const { collection, id, user } = options;
    const docs = this.data.get(collection) || [];
    const doc = docs.find(item => item.id == id);
    
    if (!doc) {
      throw new Error(`Document with id ${id} not found in ${collection}`);
    }
    
    // Apply role-based field access control
    return this.applyFieldAccessControl(doc, collection, user);
  }

  async update(options: any): Promise<any> {
    const { collection, id, data, user, req } = options;
    
    // Check basic authentication
    this.checkAuthentication(user, collection, 'update');
    
    const docs = this.data.get(collection) || [];
    const index = docs.findIndex(item => item.id == id);
    
    if (index === -1) {
      throw new Error(`Document with id ${id} not found in ${collection}`);
    }

    const doc = docs[index];
    
    // Prevent updating immutable fields
    if (data.gdpr_consent !== undefined) {
      throw new Error('gdpr_consent cannot be modified after creation');
    }
    if (data.privacy_policy_accepted !== undefined) {
      throw new Error('privacy_policy_accepted cannot be modified after creation');
    }
    if (data.consent_timestamp !== undefined) {
      throw new Error('consent_timestamp cannot be modified');
    }
    if (data.consent_ip_address !== undefined) {
      throw new Error('consent_ip_address cannot be modified');
    }
    if (data.created_by !== undefined) {
      throw new Error('created_by cannot be modified');
    }
    
    // Check field-level update permissions
    this.checkUpdatePermissions(user, collection, data);

    // Update the document
    const updatedDoc = {
      ...doc,
      ...data,
      updatedAt: new Date(),
    };

    docs[index] = updatedDoc;
    return updatedDoc;
  }

  async delete(options: any): Promise<any> {
    const { collection, id, user } = options;
    
    // Check basic authentication
    this.checkAuthentication(user, collection, 'delete');
    
    const docs = this.data.get(collection) || [];
    const index = docs.findIndex(item => item.id == id);
    
    if (index === -1) {
      throw new Error(`Document with id ${id} not found in ${collection}`);
    }

    const doc = docs[index];
    docs.splice(index, 1);
    
    // Cascade delete related enrollments when deleting a student
    if (collection === 'students') {
      const enrollments = this.data.get('enrollments') || [];
      const filteredEnrollments = enrollments.filter(enrollment => enrollment.student !== id);
      this.data.set('enrollments', filteredEnrollments);
    }
    
    return doc;
  }

  // Helper methods for access control
  
  private checkAuthentication(user: any, collection: string, operation: string): void {
    // Public access is not allowed
    if (!user) {
      throw new Error(`Authentication required for ${operation} on ${collection}`);
    }
  }
  
  private applyFieldAccessControl(doc: any, collection: string, user: any): any {
    if (!user || collection !== 'students') {
      return doc;
    }

    const userRole = user.role;
    const result = { ...doc };

    // Define field access by role
    const restrictedFields: Record<string, string[]> = {
      lectura: ['email', 'phone', 'dni', 'address', 'city', 'postal_code', 'country', 'date_of_birth', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'],
      asesor: [], // Can see all fields
      marketing: ['dni', 'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship'],
      gestor: [], // Can see all fields
      admin: [], // Can see all fields
    };

    const fieldsToHide = restrictedFields[userRole] || [];
    
    // Remove restricted fields
    fieldsToHide.forEach(field => {
      delete result[field];
    });

    return result;
  }
  
  private checkUpdatePermissions(user: any, collection: string, data: any): void {
    if (!user || collection !== 'students') {
      return;
    }

    const userRole = user.role;
    
    // Define restricted update fields by role
    const restrictedUpdateFields: Record<string, string[]> = {
      lectura: ['*'], // Cannot update anything
      asesor: ['email', 'dni', 'consent_timestamp', 'gdpr_consent', 'privacy_policy_accepted', 'created_by'], // Cannot update PII
      marketing: ['email', 'dni', 'status', 'first_name', 'last_name', 'consent_timestamp', 'gdpr_consent', 'privacy_policy_accepted', 'created_by'], // Can only update notes
      gestor: ['consent_timestamp', 'gdpr_consent', 'privacy_policy_accepted', 'created_by'], // Can update everything except immutable fields
      admin: ['consent_timestamp', 'gdpr_consent', 'privacy_policy_accepted', 'created_by'], // Same as gestor
    };

    const restrictedFields = restrictedUpdateFields[userRole] || [];
    
    // Check if user is trying to update restricted fields
    if (restrictedFields.includes('*')) {
      throw new Error(`Role ${userRole} does not have permission to update ${collection}`);
    }
    
    for (const field of Object.keys(data)) {
      if (restrictedFields.includes(field)) {
        throw new Error(`Role ${userRole} does not have permission to update field ${field}`);
      }
    }
  }
}

export interface TestContext {
  payload: MockPayload;
  app: Express;
  adminToken: string;
}

let testContext: TestContext | null = null;

/**
 * Creates a test context with Payload instance and Express app
 * Initializes a test database and provides authentication tokens
 */
export async function createTestContext(): Promise<TestContext> {
  if (testContext) {
    return testContext;
  }

  try {
    // Initialize mock Payload instance
    const payload = new PayloadMock();

    // Mock Express app for request testing
    const app = express();
    app.use(express.json());
    
    // Add minimal Payload API endpoints needed for tests
    app.post('/api/users/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // Find user in mock database
        const users = await payload.find({
          collection: 'users',
          where: { email: { equals: email } },
        });

        if (users.docs.length === 0) {
          return res.status(401).json({ error: 'User not found' });
        }

        // For tests, accept common test passwords
        const validPasswords = ['admin123', 'gestor123', 'marketing123', 'asesor123', 'lectura123'];
        
        if (!validPasswords.includes(password)) {
          return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate mock JWT token (simplified for tests)
        const token = `test-jwt-${users.docs[0].id}-${Date.now()}`;
        
        res.json({ 
          token,
          user: users.docs[0]
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Create admin token (use a mock token for simplicity)
    const adminToken = 'test-admin-token-12345';

    testContext = {
      payload,
      app,
      adminToken,
    };

    return testContext;
  } catch (error) {
    console.error('Failed to create test context:', error);
    throw error;
  }
}

/**
 * Cleanup test context and reset mock data
 */
export async function cleanupTestContext(): Promise<void> {
  if (testContext) {
    // No actual database connections to close with mock
    testContext = null;
  }
}

/**
 * Authenticates as admin and returns JWT token
 * @param app - Express application instance
 * @returns JWT authentication token
 */
export async function loginAsAdmin(app: Express): Promise<string> {
  const response = await request(app).post('/api/users/login').send({
    email: 'admin@cepcomunicacion.com',
    password: 'admin123',
  });

  if (!response.body.token) {
    throw new Error('Failed to login as admin - no token returned');
  }

  return response.body.token;
}

/**
 * Authenticates as a specific role and returns JWT token
 * @param app - Express application instance
 * @param role - User role to login as
 * @returns JWT authentication token
 */
export async function loginAsRole(app: Express, role: string): Promise<string> {
  const credentials: Record<string, { email: string; password: string }> = {
    admin: { email: 'admin@cepcomunicacion.com', password: 'admin123' },
    gestor: { email: 'gestor@cepcomunicacion.com', password: 'gestor123' },
    marketing: { email: 'marketing@cepcomunicacion.com', password: 'marketing123' },
    asesor: { email: 'asesor@cepcomunicacion.com', password: 'asesor123' },
    lectura: { email: 'lectura@cepcomunicacion.com', password: 'lectura123' },
  };

  const creds = credentials[role];
  if (!creds) {
    throw new Error(`Unknown role: ${role}`);
  }

  const response = await request(app).post('/api/users/login').send(creds);

  if (!response.body.token) {
    throw new Error(`Failed to login as ${role} - no token returned`);
  }

  return response.body.token;
}

/**
 * Creates a test cycle for testing purposes
 * @param payload - Payload instance
 * @returns Created cycle document
 */
export async function createTestCycle(payload: Payload) {
  return await payload.create({
    collection: 'cycles',
    data: {
      slug: 'test-cycle',
      name: 'Test Cycle',
      level: 'grado_medio',
      description: 'Test description',
    },
  });
}

/**
 * Creates a test campus for testing purposes
 * @param payload - Payload instance
 * @returns Created campus document
 */
export async function createTestCampus(payload: Payload) {
  return await payload.create({
    collection: 'campuses',
    data: {
      slug: 'test-campus',
      name: 'Test Campus',
      address: '123 Test Street',
      city: 'Test City',
      postal_code: '28001',
    },
  });
}

/**
 * Creates a test course for testing purposes
 * @param payload - Payload instance
 * @param cycleId - ID of the cycle to associate with
 * @returns Created course document
 */
export async function createTestCourse(payload: Payload, cycleId: number | string) {
  return await payload.create({
    collection: 'courses',
    data: {
      slug: 'test-course',
      name: 'Test Course',
      cycle: typeof cycleId === 'string' ? parseInt(cycleId, 10) : cycleId,
      modality: 'presencial',
    },
  });
}

/**
 * Cleans up test data from a collection
 * @param payload - MockPayload instance
 * @param collection - Collection name to clean
 */
export async function cleanupCollection(payload: MockPayload, collection: string) {
  // Direct access to internal data for cleanup (bypass authentication)
  const docs = payload['data'].get(collection) || [];
  
  // Clear all documents from the collection
  payload['data'].set(collection, []);
}
