import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ============================================================================
// GET /api/v1/openapi.json
// Returns the OpenAPI 3.1 specification for the Akademate V1 API.
// This endpoint does NOT require authentication.
// ============================================================================

const OPENAPI_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'Akademate V1 API',
    version: '1.0.0',
    description:
      'REST API para gestión de centros de formación con Akademate. Permite listar y crear cursos, gestionar alumnos, matrículas y obtener analíticas del dashboard.',
    contact: {
      name: 'Akademate Support',
      email: 'hola@akademate.com',
      url: 'https://akademate.com',
    },
    license: {
      name: 'Proprietary',
      url: 'https://akademate.com/legal/terminos',
    },
  },
  servers: [
    {
      url: 'https://app.akademate.com',
      description: 'Production server',
    },
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'AkKey',
        description:
          'API Key obtenida desde /configuracion/apis. Formato: Authorization: Bearer ak_live_...',
      },
    },
    schemas: {
      ApiError: {
        type: 'object',
        required: ['error', 'code'],
        properties: {
          error: {
            type: 'string',
            description: 'Human-readable error message',
            example: 'API key is invalid or inactive',
          },
          code: {
            type: 'string',
            description: 'Machine-readable error code',
            enum: [
              'UNAUTHORIZED',
              'FORBIDDEN',
              'NOT_FOUND',
              'VALIDATION_ERROR',
              'INVALID_BODY',
              'INTERNAL_ERROR',
            ],
            example: 'UNAUTHORIZED',
          },
        },
      },
      PaginatedMeta: {
        type: 'object',
        required: ['total', 'limit', 'offset'],
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of records available',
            example: 42,
          },
          limit: {
            type: 'integer',
            description: 'Number of records returned per page',
            example: 20,
          },
          offset: {
            type: 'integer',
            description: 'Number of records skipped',
            example: 0,
          },
        },
      },
      Course: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique course identifier',
            example: 'clxyz123',
          },
          title: {
            type: 'string',
            description: 'Course title',
            example: 'Administración de Sistemas Informáticos en Red',
          },
          slug: {
            type: 'string',
            description: 'URL-friendly course identifier',
            example: 'asir-2024',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Full course description',
          },
          status: {
            type: 'string',
            enum: ['draft', 'published', 'archived'],
            description: 'Publication status of the course',
            example: 'published',
          },
          tenant: {
            oneOf: [
              { type: 'string' },
              { type: 'integer' },
            ],
            description: 'Tenant identifier (ID or object)',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 creation timestamp',
            example: '2024-09-01T08:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 last update timestamp',
            example: '2024-11-15T14:30:00.000Z',
          },
        },
      },
      Student: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique student identifier',
            example: 'stu_abc123',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Student email address',
            example: 'maria.garcia@example.com',
          },
          name: {
            type: 'string',
            nullable: true,
            description: 'Student full name',
            example: 'María García López',
          },
          phone: {
            type: 'string',
            nullable: true,
            description: 'Student phone number',
            example: '+34 612 345 678',
          },
          tenant: {
            oneOf: [
              { type: 'string' },
              { type: 'integer' },
            ],
            description: 'Tenant identifier',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-09-10T09:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-10-01T12:00:00.000Z',
          },
        },
      },
      Enrollment: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique enrollment identifier',
            example: 'enr_xyz789',
          },
          student: {
            oneOf: [
              { type: 'string' },
              { '$ref': '#/components/schemas/Student' },
            ],
            description: 'Student ID or populated student object (depth=1)',
          },
          course_run: {
            oneOf: [
              { type: 'string' },
              { type: 'object', description: 'Populated course run object' },
            ],
            description: 'CourseRun ID or populated object (depth=1)',
          },
          status: {
            type: 'string',
            enum: ['active', 'completed', 'cancelled', 'pending'],
            description: 'Current enrollment status',
            example: 'active',
          },
          enrollment_date: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 enrollment date',
            example: '2024-09-15T10:00:00.000Z',
          },
          tenant: {
            oneOf: [
              { type: 'string' },
              { type: 'integer' },
            ],
            description: 'Tenant identifier',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Analytics: {
        type: 'object',
        required: [
          'total_students',
          'total_courses',
          'total_enrollments',
          'active_enrollments',
          'completion_rate',
        ],
        properties: {
          total_students: {
            type: 'integer',
            description: 'Total number of students in the tenant',
            example: 285,
          },
          total_courses: {
            type: 'integer',
            description: 'Total number of courses in the tenant',
            example: 12,
          },
          total_enrollments: {
            type: 'integer',
            description: 'Total number of enrollments',
            example: 430,
          },
          active_enrollments: {
            type: 'integer',
            description: 'Number of currently active enrollments',
            example: 310,
          },
          completion_rate: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            description: 'Percentage of completed enrollments (0-100)',
            example: 72,
          },
        },
      },
      ApiKeyInfo: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'API Key document ID',
            example: 'key_abc123',
          },
          name: {
            type: 'string',
            description: 'Human-readable name for this API key',
            example: 'Integración CRM',
          },
          scopes: {
            type: 'array',
            items: {
              type: 'string',
              enum: [
                'courses:read',
                'courses:write',
                'students:read',
                'students:write',
                'enrollments:read',
                'enrollments:write',
                'analytics:read',
                'keys:manage',
                'cycles:read',
                'cycles:write',
                'campuses:read',
                'campuses:write',
                'staff:read',
                'staff:write',
                'convocatorias:read',
                'convocatorias:write',
              ],
            },
            description: 'List of permission scopes granted to this key',
            example: ['courses:read', 'cycles:read', 'analytics:read'],
          },
          tenant_id: {
            type: 'string',
            description: 'Tenant this key belongs to',
            example: '3',
          },
          rate_limit_per_day: {
            type: 'integer',
            nullable: true,
            description: 'Maximum requests per day (null = unlimited)',
            example: 1000,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'ISO 8601 key creation timestamp',
          },
          last_used_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'ISO 8601 timestamp of the last request made with this key',
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid API key',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/ApiError' },
            example: { error: 'API key is invalid or inactive', code: 'UNAUTHORIZED' },
          },
        },
      },
      Forbidden: {
        description: 'API key lacks the required scope',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/ApiError' },
            example: {
              error: 'API key missing required scope: courses:read',
              code: 'FORBIDDEN',
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found or does not belong to your tenant',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/ApiError' },
            example: { error: 'Course not found', code: 'NOT_FOUND' },
          },
        },
      },
      InternalError: {
        description: 'Unexpected server error',
        content: {
          'application/json': {
            schema: { '$ref': '#/components/schemas/ApiError' },
            example: { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          },
        },
      },
    },
  },
  paths: {
    '/api/v1/me': {
      get: {
        operationId: 'getMe',
        tags: ['Auth'],
        summary: 'Get API key info',
        description:
          'Returns metadata about the authenticated API key: name, scopes, tenant, rate limits, and last usage timestamp. Useful to verify that a key is valid and check its permissions before making other requests.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'API key info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { '$ref': '#/components/schemas/ApiKeyInfo' },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
    },
    '/api/v1/courses': {
      get: {
        operationId: 'listCourses',
        tags: ['Courses'],
        summary: 'List courses',
        description:
          'Returns a paginated list of courses belonging to the authenticated tenant, ordered by creation date (newest first).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return (max 100)',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip for pagination',
            schema: { type: 'integer', default: 0, minimum: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of courses',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'total', 'limit', 'offset'],
                  properties: {
                    data: {
                      type: 'array',
                      items: { '$ref': '#/components/schemas/Course' },
                    },
                    total: { type: 'integer', example: 12 },
                    limit: { type: 'integer', example: 20 },
                    offset: { type: 'integer', example: 0 },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
      post: {
        operationId: 'createCourse',
        tags: ['Courses'],
        summary: 'Create a course',
        description:
          'Creates a new course associated with the authenticated tenant. The `tenant` field is automatically set and cannot be overridden.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: {
                    type: 'string',
                    description: 'Course title',
                    example: 'Desarrollo de Aplicaciones Web',
                  },
                  slug: {
                    type: 'string',
                    description: 'URL-friendly slug (auto-generated if omitted)',
                    example: 'daw-2024',
                  },
                  description: {
                    type: 'string',
                    description: 'Course description',
                  },
                  status: {
                    type: 'string',
                    enum: ['draft', 'published', 'archived'],
                    default: 'draft',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Course created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { '$ref': '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
    },
    '/api/v1/courses/{id}': {
      get: {
        operationId: 'getCourse',
        tags: ['Courses'],
        summary: 'Get course detail',
        description:
          'Returns the full details of a single course. Returns 404 if the course does not exist or belongs to a different tenant.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Course ID',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Course detail',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { '$ref': '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '404': { '$ref': '#/components/responses/NotFound' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
      patch: {
        operationId: 'updateCourse',
        tags: ['Courses'],
        summary: 'Update a course',
        description:
          'Partially updates a course. Only fields provided in the request body are modified. The `tenant` field cannot be changed.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Course ID',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['draft', 'published', 'archived'],
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated course',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { '$ref': '#/components/schemas/Course' },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '404': { '$ref': '#/components/responses/NotFound' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
    },
    '/api/v1/students': {
      get: {
        operationId: 'listStudents',
        tags: ['Students'],
        summary: 'List students',
        description:
          'Returns a paginated list of students belonging to the authenticated tenant.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return (max 100)',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip',
            schema: { type: 'integer', default: 0, minimum: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of students',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'total', 'limit', 'offset'],
                  properties: {
                    data: {
                      type: 'array',
                      items: { '$ref': '#/components/schemas/Student' },
                    },
                    total: { type: 'integer', example: 285 },
                    limit: { type: 'integer', example: 20 },
                    offset: { type: 'integer', example: 0 },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
      post: {
        operationId: 'createStudent',
        tags: ['Students'],
        summary: 'Create a student',
        description:
          'Creates a new student associated with the authenticated tenant. The `email` field is required.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'nuevo.alumno@example.com',
                  },
                  name: {
                    type: 'string',
                    example: 'Juan Martínez',
                  },
                  phone: {
                    type: 'string',
                    example: '+34 600 123 456',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Student created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { '$ref': '#/components/schemas/Student' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error (missing required fields)',
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ApiError' },
                example: { error: 'Field "email" is required', code: 'VALIDATION_ERROR' },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
    },
    '/api/v1/enrollments': {
      get: {
        operationId: 'listEnrollments',
        tags: ['Enrollments'],
        summary: 'List enrollments',
        description:
          'Returns a paginated list of enrollments for the authenticated tenant. Student and course run references are populated (depth=1).',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'limit',
            in: 'query',
            description: 'Number of results to return (max 100)',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          },
          {
            name: 'offset',
            in: 'query',
            description: 'Number of results to skip',
            schema: { type: 'integer', default: 0, minimum: 0 },
          },
        ],
        responses: {
          '200': {
            description: 'Paginated list of enrollments',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data', 'total', 'limit', 'offset'],
                  properties: {
                    data: {
                      type: 'array',
                      items: { '$ref': '#/components/schemas/Enrollment' },
                    },
                    total: { type: 'integer', example: 430 },
                    limit: { type: 'integer', example: 20 },
                    offset: { type: 'integer', example: 0 },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
      post: {
        operationId: 'createEnrollment',
        tags: ['Enrollments'],
        summary: 'Create an enrollment',
        description:
          'Enrolls a student in a course run. Both `studentId` and `courseRunId` are required. The enrollment is created with status `active` and the current date as `enrollment_date`.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['studentId', 'courseRunId'],
                properties: {
                  studentId: {
                    type: 'string',
                    description: 'ID of the student to enroll',
                    example: 'stu_abc123',
                  },
                  courseRunId: {
                    type: 'string',
                    description: 'ID of the course run (convocatoria) to enroll in',
                    example: 'run_xyz789',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Enrollment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { '$ref': '#/components/schemas/Enrollment' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { '$ref': '#/components/schemas/ApiError' },
                example: {
                  error: 'Fields "studentId" and "courseRunId" are required',
                  code: 'VALIDATION_ERROR',
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
    },
    '/api/v1/cycles': {
      get: {
        operationId: 'listCycles', tags: ['Cycles'], summary: 'List ciclos formativos',
        description: 'Returns paginated list of ciclos for the authenticated tenant.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: { '200': { description: 'Paginated list of cycles' }, '401': { '$ref': '#/components/responses/Unauthorized' } },
      },
      post: {
        operationId: 'createCycle', tags: ['Cycles'], summary: 'Create a ciclo formativo',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['title'] } } } },
        responses: { '201': { description: 'Cycle created' }, '401': { '$ref': '#/components/responses/Unauthorized' } },
      },
    },
    '/api/v1/cycles/{id}': {
      get: { operationId: 'getCycle', tags: ['Cycles'], summary: 'Get cycle detail', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Cycle detail' } } },
      patch: { operationId: 'updateCycle', tags: ['Cycles'], summary: 'Update a cycle', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated cycle' } } },
      delete: { operationId: 'deleteCycle', tags: ['Cycles'], summary: 'Delete a cycle', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/v1/campuses': {
      get: { operationId: 'listCampuses', tags: ['Campuses'], summary: 'List campuses/sedes', security: [{ bearerAuth: [] }], parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }, { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }], responses: { '200': { description: 'Paginated list' } } },
      post: { operationId: 'createCampus', tags: ['Campuses'], summary: 'Create a campus/sede', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'] } } } }, responses: { '201': { description: 'Campus created' } } },
    },
    '/api/v1/campuses/{id}': {
      get: { operationId: 'getCampus', tags: ['Campuses'], summary: 'Get campus detail', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Campus detail' } } },
      patch: { operationId: 'updateCampus', tags: ['Campuses'], summary: 'Update campus', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { operationId: 'deleteCampus', tags: ['Campuses'], summary: 'Delete campus', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/v1/staff': {
      get: { operationId: 'listStaff', tags: ['Staff'], summary: 'List staff/professors', security: [{ bearerAuth: [] }], parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }, { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }], responses: { '200': { description: 'Paginated list' } } },
      post: { operationId: 'createStaff', tags: ['Staff'], summary: 'Create staff member', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name'] } } } }, responses: { '201': { description: 'Staff created' } } },
    },
    '/api/v1/staff/{id}': {
      get: { operationId: 'getStaff', tags: ['Staff'], summary: 'Get staff detail', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Staff detail' } } },
      patch: { operationId: 'updateStaff', tags: ['Staff'], summary: 'Update staff', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { operationId: 'deleteStaff', tags: ['Staff'], summary: 'Delete staff', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/v1/convocatorias': {
      get: { operationId: 'listConvocatorias', tags: ['Convocatorias'], summary: 'List convocatorias (course runs)', security: [{ bearerAuth: [] }], parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }, { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }], responses: { '200': { description: 'Paginated list' } } },
      post: { operationId: 'createConvocatoria', tags: ['Convocatorias'], summary: 'Create convocatoria', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } }, responses: { '201': { description: 'Convocatoria created' } } },
    },
    '/api/v1/convocatorias/{id}': {
      get: { operationId: 'getConvocatoria', tags: ['Convocatorias'], summary: 'Get convocatoria detail', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Convocatoria detail' } } },
      patch: { operationId: 'updateConvocatoria', tags: ['Convocatorias'], summary: 'Update convocatoria', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Updated' } } },
      delete: { operationId: 'deleteConvocatoria', tags: ['Convocatorias'], summary: 'Delete convocatoria', security: [{ bearerAuth: [] }], parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }], responses: { '200': { description: 'Deleted' } } },
    },
    '/api/v1/leads': {
      get: { operationId: 'listLeads', tags: ['Leads'], summary: 'List leads', security: [{ bearerAuth: [] }], parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }, { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } }], responses: { '200': { description: 'Paginated list' } } },
      post: { operationId: 'createLead', tags: ['Leads'], summary: 'Create a lead', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['email'] } } } }, responses: { '201': { description: 'Lead created' } } },
    },
    '/api/v1/keys': {
      get: { operationId: 'listKeys', tags: ['Keys'], summary: 'List API keys', security: [{ bearerAuth: [] }], responses: { '200': { description: 'List of API keys for tenant' } } },
      post: { operationId: 'createKey', tags: ['Keys'], summary: 'Create API key', description: 'Creates a new API key. The plaintext key is returned ONCE in the response.', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'scopes'], properties: { name: { type: 'string' }, scopes: { type: 'array', items: { type: 'string' } }, rate_limit_per_day: { type: 'integer', default: 1000 } } } } } }, responses: { '201': { description: 'Key created — plaintext key included in response' } } },
    },
    '/api/v1/media': {
      post: { operationId: 'uploadMedia', tags: ['Media'], summary: 'Upload a file', security: [{ bearerAuth: [] }], requestBody: { required: true, content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } } }, responses: { '201': { description: 'File uploaded' } } },
    },
    '/api/v1/analytics': {
      get: {
        operationId: 'getAnalytics',
        tags: ['Analytics'],
        summary: 'Get analytics KPIs',
        description:
          'Returns aggregated KPI metrics for the authenticated tenant: total students, courses, enrollments, active enrollments, and completion rate.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Analytics KPIs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { '$ref': '#/components/schemas/Analytics' },
                  },
                },
              },
            },
          },
          '401': { '$ref': '#/components/responses/Unauthorized' },
          '403': { '$ref': '#/components/responses/Forbidden' },
          '500': { '$ref': '#/components/responses/InternalError' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'API key verification and metadata' },
    { name: 'Courses', description: 'Course catalog management' },
    { name: 'Cycles', description: 'Ciclos formativos (FP, grado medio/superior)' },
    { name: 'Campuses', description: 'Campus/sede management' },
    { name: 'Staff', description: 'Profesores y personal docente' },
    { name: 'Convocatorias', description: 'Convocatorias (course runs / scheduled editions)' },
    { name: 'Students', description: 'Student registration and lookup' },
    { name: 'Enrollments', description: 'Student-course enrollment management' },
    { name: 'Leads', description: 'Lead capture and management' },
    { name: 'Analytics', description: 'Dashboard KPI metrics' },
    { name: 'Keys', description: 'API key management' },
    { name: 'Media', description: 'File uploads (images, documents)' },
  ],
}

export async function GET() {
  return NextResponse.json(OPENAPI_SPEC, {
    headers: {
      'Content-Type': 'application/json',
      // Allow browsers and tools to fetch the spec cross-origin
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
