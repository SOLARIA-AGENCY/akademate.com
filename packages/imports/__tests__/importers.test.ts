/**
 * @fileoverview Entity Importers Tests
 */

import { describe, it, expect } from 'vitest';
import {
  StudentImporter,
  LeadImporter,
  EnrollmentImporter,
  AttendanceImporter,
  CourseImporter,
  importStudents,
  importLeads,
  importEnrollments,
  importAttendance,
  importCourses,
} from '../src/importers';

describe('StudentImporter', () => {
  it('should import valid students', () => {
    const csv = `First Name,Last Name,Email
John,Doe,john@example.com
Jane,Smith,jane@example.com`;

    const result = StudentImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    });
  });

  it('should handle Spanish column names', () => {
    const csv = `Nombre,Apellidos,Correo
Juan,García,juan@example.com`;

    const result = StudentImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data[0].firstName).toBe('Juan');
    expect(result.data[0].lastName).toBe('García');
  });

  it('should import optional fields', () => {
    const csv = `First Name,Last Name,Email,Phone,City
John,Doe,john@example.com,+34 600 123 456,Madrid`;

    const result = StudentImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data[0].phone).toBe('+34 600 123 456');
    expect(result.data[0].city).toBe('Madrid');
  });

  it('should reject invalid email', () => {
    const csv = `First Name,Last Name,Email
John,Doe,not-an-email`;

    const result = StudentImporter.import(csv);

    expect(result.success).toBe(false);
    expect(result.errors[0].column).toBe('email');
  });

  it('should reject missing required fields', () => {
    const csv = `First Name,Email
John,john@example.com`;

    const result = StudentImporter.import(csv);

    expect(result.success).toBe(false);
    expect(result.errors[0].column).toBe('lastName');
  });

  it('should provide required columns', () => {
    const required = StudentImporter.getRequiredColumns();
    expect(required).toContain('First Name');
    expect(required).toContain('Last Name');
    expect(required).toContain('Email');
  });

  it('should provide optional columns', () => {
    const optional = StudentImporter.getOptionalColumns();
    expect(optional).toContain('Phone');
    expect(optional).toContain('City');
  });
});

describe('LeadImporter', () => {
  it('should import valid leads', () => {
    const csv = `Name,Email,Phone,Source
John Doe,john@example.com,+34 600 123 456,Google Ads`;

    const result = LeadImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data[0]).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+34 600 123 456',
      source: 'Google Ads',
    });
  });

  it('should handle Spanish column names', () => {
    const csv = `Nombre,Correo,Fuente,Campaña
Juan García,juan@example.com,Facebook,Invierno 2024`;

    const result = LeadImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data[0].name).toBe('Juan García');
    expect(result.data[0].campaign).toBe('Invierno 2024');
  });

  it('should reject invalid email', () => {
    const csv = `Name,Email
John,invalid`;

    const result = LeadImporter.import(csv);

    expect(result.success).toBe(false);
  });
});

describe('EnrollmentImporter', () => {
  it('should import valid enrollments', () => {
    const csv = `Student Email,Course Code,Status
john@example.com,REACT-001,active
jane@example.com,TS-001,pending`;

    const result = EnrollmentImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toEqual({
      studentEmail: 'john@example.com',
      courseCode: 'REACT-001',
      status: 'active',
    });
  });

  it('should handle Spanish column names', () => {
    const csv = `Email Alumno,Código Curso,Estado
juan@example.com,CURSO-001,active`;

    const result = EnrollmentImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data[0].studentEmail).toBe('juan@example.com');
  });

  it('should reject invalid status', () => {
    const csv = `Student Email,Course Code,Status
john@example.com,REACT-001,invalid_status`;

    const result = EnrollmentImporter.import(csv);

    expect(result.success).toBe(false);
    expect(result.errors[0].column).toBe('status');
  });
});

describe('AttendanceImporter', () => {
  it('should import valid attendance', () => {
    const csv = `Student Email,Course Run Code,Session Date,Status
john@example.com,REACT-001-JAN24,2024-01-15,present
jane@example.com,REACT-001-JAN24,2024-01-15,absent`;

    const result = AttendanceImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('should handle check in/out times', () => {
    const csv = `Student Email,Course Run Code,Session Date,Status,Check In,Check Out
john@example.com,RUN-001,2024-01-15,present,09:00,13:00`;

    const result = AttendanceImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data[0].checkInTime).toBe('09:00');
    expect(result.data[0].checkOutTime).toBe('13:00');
  });

  it('should validate status enum', () => {
    const csv = `Student Email,Course Run Code,Session Date,Status
john@example.com,RUN-001,2024-01-15,present
john@example.com,RUN-001,2024-01-16,late
john@example.com,RUN-001,2024-01-17,excused
john@example.com,RUN-001,2024-01-18,absent`;

    const result = AttendanceImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(4);
  });
});

describe('CourseImporter', () => {
  it('should import valid courses', () => {
    const csv = `Code,Name,Description,Category,Price,Currency
REACT-001,React Advanced,Advanced React course,Frontend,499,EUR
TS-001,TypeScript,TypeScript fundamentals,Backend,299,EUR`;

    const result = CourseImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].code).toBe('REACT-001');
    expect(result.data[0].name).toBe('React Advanced');
  });

  it('should handle Spanish column names', () => {
    const csv = `Código,Nombre,Descripción,Categoría,Precio
CURSO-001,Curso Básico,Descripción del curso,General,199`;

    const result = CourseImporter.import(csv);

    expect(result.success).toBe(true);
    expect(result.data[0].code).toBe('CURSO-001');
  });

  it('should validate status enum', () => {
    const csv = `Code,Name,Status
COURSE-1,Course One,draft
COURSE-2,Course Two,active
COURSE-3,Course Three,archived`;

    const result = CourseImporter.import(csv);

    expect(result.success).toBe(true);
  });
});

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

describe('Convenience Functions', () => {
  describe('importStudents', () => {
    it('should work like StudentImporter.import', () => {
      const csv = `First Name,Last Name,Email
John,Doe,john@example.com`;

      const result = importStudents(csv);

      expect(result.success).toBe(true);
      expect(result.data[0].firstName).toBe('John');
    });
  });

  describe('importLeads', () => {
    it('should work like LeadImporter.import', () => {
      const csv = `Name,Email
John Doe,john@example.com`;

      const result = importLeads(csv);

      expect(result.success).toBe(true);
    });
  });

  describe('importEnrollments', () => {
    it('should work like EnrollmentImporter.import', () => {
      const csv = `Student Email,Course Code
john@example.com,COURSE-001`;

      const result = importEnrollments(csv);

      expect(result.success).toBe(true);
    });
  });

  describe('importAttendance', () => {
    it('should work like AttendanceImporter.import', () => {
      const csv = `Student Email,Course Run Code,Session Date,Status
john@example.com,RUN-001,2024-01-15,present`;

      const result = importAttendance(csv);

      expect(result.success).toBe(true);
    });
  });

  describe('importCourses', () => {
    it('should work like CourseImporter.import', () => {
      const csv = `Code,Name
COURSE-001,Test Course`;

      const result = importCourses(csv);

      expect(result.success).toBe(true);
    });
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle large files', () => {
    const rows = Array(1000)
      .fill(null)
      .map((_, i) => `User ${i},user${i}@example.com`)
      .join('\n');
    const csv = `First Name,Email\n${rows}`;

    const result = importStudents(csv);

    // Will fail validation due to missing lastName, but should process all rows
    expect(result.totalRows).toBe(1000);
  });

  it('should handle special characters', () => {
    const csv = `First Name,Last Name,Email
José,García Álvarez,jose@example.com
María,O'Connor,maria@example.com`;

    const result = importStudents(csv);

    expect(result.success).toBe(true);
    expect(result.data[0].firstName).toBe('José');
    expect(result.data[0].lastName).toBe('García Álvarez');
    expect(result.data[1].lastName).toBe("O'Connor");
  });

  it('should handle semicolon delimiter', () => {
    const csv = `First Name;Last Name;Email
John;Doe;john@example.com`;

    const result = importStudents(csv, { delimiter: ';' });

    expect(result.success).toBe(true);
  });
});
