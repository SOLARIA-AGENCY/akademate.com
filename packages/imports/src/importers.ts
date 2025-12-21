/**
 * @fileoverview Entity-Specific Importers
 * Pre-configured importers for common entity types
 */

import { CsvParser } from './csv-parser';
import {
  studentImportSchema,
  leadImportSchema,
  enrollmentImportSchema,
  attendanceImportSchema,
  courseImportSchema,
} from './types';
import type {
  StudentImportData,
  LeadImportData,
  EnrollmentImportData,
  AttendanceImportData,
  CourseImportData,
  ImportResult,
  CsvParseOptions,
} from './types';

// =============================================================================
// COLUMN MAPPINGS
// =============================================================================

const studentColumnMappings: Record<string, string> = {
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Nombre': 'firstName',
  'Apellidos': 'lastName',
  'Email': 'email',
  'Correo': 'email',
  'Phone': 'phone',
  'Teléfono': 'phone',
  'Date of Birth': 'dateOfBirth',
  'Fecha de Nacimiento': 'dateOfBirth',
  'National ID': 'nationalId',
  'DNI': 'nationalId',
  'NIF': 'nationalId',
  'Address': 'address',
  'Dirección': 'address',
  'City': 'city',
  'Ciudad': 'city',
  'Postal Code': 'postalCode',
  'Código Postal': 'postalCode',
  'Country': 'country',
  'País': 'country',
};

const leadColumnMappings: Record<string, string> = {
  'Name': 'name',
  'Nombre': 'name',
  'Full Name': 'name',
  'Nombre Completo': 'name',
  'Email': 'email',
  'Correo': 'email',
  'Phone': 'phone',
  'Teléfono': 'phone',
  'Source': 'source',
  'Fuente': 'source',
  'Campaign': 'campaign',
  'Campaña': 'campaign',
  'Notes': 'notes',
  'Notas': 'notes',
  'Tags': 'tags',
  'Etiquetas': 'tags',
};

const enrollmentColumnMappings: Record<string, string> = {
  'Student Email': 'studentEmail',
  'Email Alumno': 'studentEmail',
  'Course Code': 'courseCode',
  'Código Curso': 'courseCode',
  'Enrolled At': 'enrolledAt',
  'Fecha Matrícula': 'enrolledAt',
  'Status': 'status',
  'Estado': 'status',
  'Notes': 'notes',
  'Notas': 'notes',
};

const attendanceColumnMappings: Record<string, string> = {
  'Student Email': 'studentEmail',
  'Email Alumno': 'studentEmail',
  'Course Run Code': 'courseRunCode',
  'Código Convocatoria': 'courseRunCode',
  'Session Date': 'sessionDate',
  'Fecha Sesión': 'sessionDate',
  'Status': 'status',
  'Estado': 'status',
  'Check In': 'checkInTime',
  'Entrada': 'checkInTime',
  'Check Out': 'checkOutTime',
  'Salida': 'checkOutTime',
  'Notes': 'notes',
  'Notas': 'notes',
};

const courseColumnMappings: Record<string, string> = {
  'Code': 'code',
  'Código': 'code',
  'Name': 'name',
  'Nombre': 'name',
  'Description': 'description',
  'Descripción': 'description',
  'Category': 'category',
  'Categoría': 'category',
  'Duration': 'duration',
  'Duración': 'duration',
  'Price': 'price',
  'Precio': 'price',
  'Currency': 'currency',
  'Moneda': 'currency',
  'Status': 'status',
  'Estado': 'status',
};

// =============================================================================
// IMPORTER CLASSES
// =============================================================================

export class StudentImporter extends CsvParser<StudentImportData> {
  constructor(options: CsvParseOptions = {}) {
    super(studentImportSchema, studentColumnMappings, options);
  }

  static import(
    content: string | Buffer,
    options: CsvParseOptions = {}
  ): ImportResult<StudentImportData> {
    const importer = new StudentImporter(options);
    return importer.parse(content);
  }

  static getRequiredColumns(): string[] {
    return ['First Name', 'Last Name', 'Email'];
  }

  static getOptionalColumns(): string[] {
    return ['Phone', 'Date of Birth', 'National ID', 'Address', 'City', 'Postal Code', 'Country'];
  }
}

export class LeadImporter extends CsvParser<LeadImportData> {
  constructor(options: CsvParseOptions = {}) {
    super(leadImportSchema, leadColumnMappings, options);
  }

  static import(
    content: string | Buffer,
    options: CsvParseOptions = {}
  ): ImportResult<LeadImportData> {
    const importer = new LeadImporter(options);
    return importer.parse(content);
  }

  static getRequiredColumns(): string[] {
    return ['Name', 'Email'];
  }

  static getOptionalColumns(): string[] {
    return ['Phone', 'Source', 'Campaign', 'Notes', 'Tags'];
  }
}

export class EnrollmentImporter extends CsvParser<EnrollmentImportData> {
  constructor(options: CsvParseOptions = {}) {
    super(enrollmentImportSchema, enrollmentColumnMappings, options);
  }

  static import(
    content: string | Buffer,
    options: CsvParseOptions = {}
  ): ImportResult<EnrollmentImportData> {
    const importer = new EnrollmentImporter(options);
    return importer.parse(content);
  }

  static getRequiredColumns(): string[] {
    return ['Student Email', 'Course Code'];
  }

  static getOptionalColumns(): string[] {
    return ['Enrolled At', 'Status', 'Notes'];
  }
}

export class AttendanceImporter extends CsvParser<AttendanceImportData> {
  constructor(options: CsvParseOptions = {}) {
    super(attendanceImportSchema, attendanceColumnMappings, options);
  }

  static import(
    content: string | Buffer,
    options: CsvParseOptions = {}
  ): ImportResult<AttendanceImportData> {
    const importer = new AttendanceImporter(options);
    return importer.parse(content);
  }

  static getRequiredColumns(): string[] {
    return ['Student Email', 'Course Run Code', 'Session Date', 'Status'];
  }

  static getOptionalColumns(): string[] {
    return ['Check In', 'Check Out', 'Notes'];
  }
}

export class CourseImporter extends CsvParser<CourseImportData> {
  constructor(options: CsvParseOptions = {}) {
    super(courseImportSchema, courseColumnMappings, options);
  }

  static import(
    content: string | Buffer,
    options: CsvParseOptions = {}
  ): ImportResult<CourseImportData> {
    const importer = new CourseImporter(options);
    return importer.parse(content);
  }

  static getRequiredColumns(): string[] {
    return ['Code', 'Name'];
  }

  static getOptionalColumns(): string[] {
    return ['Description', 'Category', 'Duration', 'Price', 'Currency', 'Status'];
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Import students from CSV
 */
export function importStudents(
  content: string | Buffer,
  options: CsvParseOptions = {}
): ImportResult<StudentImportData> {
  return StudentImporter.import(content, options);
}

/**
 * Import leads from CSV
 */
export function importLeads(
  content: string | Buffer,
  options: CsvParseOptions = {}
): ImportResult<LeadImportData> {
  return LeadImporter.import(content, options);
}

/**
 * Import enrollments from CSV
 */
export function importEnrollments(
  content: string | Buffer,
  options: CsvParseOptions = {}
): ImportResult<EnrollmentImportData> {
  return EnrollmentImporter.import(content, options);
}

/**
 * Import attendance from CSV
 */
export function importAttendance(
  content: string | Buffer,
  options: CsvParseOptions = {}
): ImportResult<AttendanceImportData> {
  return AttendanceImporter.import(content, options);
}

/**
 * Import courses from CSV
 */
export function importCourses(
  content: string | Buffer,
  options: CsvParseOptions = {}
): ImportResult<CourseImportData> {
  return CourseImporter.import(content, options);
}
