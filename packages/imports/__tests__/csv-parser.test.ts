/**
 * @fileoverview CSV Parser Tests
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { CsvParser, parseCsv, getCsvHeaders, validateCsvStructure } from '../src/csv-parser';

describe('CsvParser', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    age: z.coerce.number().optional(),
  });

  // ============================================================================
  // BASIC PARSING
  // ============================================================================

  describe('Basic Parsing', () => {
    it('should parse valid CSV with headers', () => {
      const csv = `name,email,age
John Doe,john@example.com,30
Jane Smith,jane@example.com,25`;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.validRows).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      });
    });

    it('should handle Buffer input', () => {
      const csv = Buffer.from('name,email\nTest,test@example.com');

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('Test');
    });

    it('should handle BOM in UTF-8 content', () => {
      const csv = '\uFEFFname,email\nTest,test@example.com';

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('Test');
    });

    it('should trim values by default', () => {
      const csv = `name,email
  John Doe  ,  john@example.com  `;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.data[0].name).toBe('John Doe');
      expect(result.data[0].email).toBe('john@example.com');
    });

    it('should skip empty lines', () => {
      const csv = `name,email

John,john@example.com

Jane,jane@example.com
`;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.totalRows).toBe(2);
    });

    it('should handle different line endings', () => {
      const csvUnix = 'name,email\nJohn,john@example.com';
      const csvWindows = 'name,email\r\nJohn,john@example.com';

      const parser = new CsvParser(testSchema);

      expect(parser.parse(csvUnix).data).toHaveLength(1);
      expect(parser.parse(csvWindows).data).toHaveLength(1);
    });
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe('Validation', () => {
    it('should report validation errors', () => {
      const csv = `name,email
John,invalid-email`;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.invalidRows).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].column).toBe('email');
    });

    it('should report missing required fields', () => {
      const csv = `name,email
,john@example.com`;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.errors[0].column).toBe('name');
    });

    it('should handle partial valid data', () => {
      const csv = `name,email
Valid,valid@example.com
Invalid,bad-email
Another,another@example.com`;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.validRows).toBe(2);
      expect(result.invalidRows).toBe(1);
      expect(result.data).toHaveLength(2);
    });

    it('should handle empty file', () => {
      const csv = '';

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_FILE');
    });

    it('should handle header-only file', () => {
      const csv = 'name,email';

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.success).toBe(false);
      expect(result.errors[0].code).toBe('EMPTY_FILE');
    });
  });

  // ============================================================================
  // COLUMN MAPPING
  // ============================================================================

  describe('Column Mapping', () => {
    it('should apply custom column mappings', () => {
      const csv = `Full Name,Email Address
John Doe,john@example.com`;

      const mappings = {
        'Full Name': 'name',
        'Email Address': 'email',
      };

      const parser = new CsvParser(testSchema, mappings);
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('John Doe');
    });

    it('should normalize unmapped column names to camelCase', () => {
      const csv = `user name,email address
John,john@example.com`;

      const schema = z.object({
        userName: z.string(),
        emailAddress: z.string().email(),
      });

      const parser = new CsvParser(schema);
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.data[0]).toHaveProperty('userName', 'John');
    });
  });

  // ============================================================================
  // OPTIONS
  // ============================================================================

  describe('Parser Options', () => {
    it('should respect custom delimiter', () => {
      const csv = `name;email
John;john@example.com`;

      const parser = new CsvParser(testSchema, {}, { delimiter: ';' });
      const result = parser.parse(csv);

      expect(result.success).toBe(true);
      expect(result.data[0].name).toBe('John');
    });

    it('should respect maxRows option', () => {
      const csv = `name,email
John,john@example.com
Jane,jane@example.com
Bob,bob@example.com`;

      const parser = new CsvParser(testSchema, {}, { maxRows: 2 });
      const result = parser.parse(csv);

      expect(result.totalRows).toBe(2);
      expect(result.warnings).toHaveLength(1);
    });

    it('should handle quoted fields', () => {
      const csv = `name,email
"John, Jr.",john@example.com`;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.data[0].name).toBe('John, Jr.');
    });

    it('should handle escaped quotes', () => {
      const csv = `name,email
"John ""Johnny"" Doe",john@example.com`;

      const parser = new CsvParser(testSchema);
      const result = parser.parse(csv);

      expect(result.data[0].name).toBe('John "Johnny" Doe');
    });
  });

  // ============================================================================
  // HEADERS
  // ============================================================================

  describe('getHeaders', () => {
    it('should extract headers from CSV', () => {
      const csv = `Name,Email,Phone
John,john@example.com,123456`;

      const parser = new CsvParser(testSchema);
      const headers = parser.getHeaders(csv);

      expect(headers).toEqual(['Name', 'Email', 'Phone']);
    });

    it('should handle BOM in headers', () => {
      const csv = '\uFEFFName,Email';

      const parser = new CsvParser(testSchema);
      const headers = parser.getHeaders(csv);

      expect(headers).toEqual(['Name', 'Email']);
    });
  });
});

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

describe('Convenience Functions', () => {
  describe('parseCsv', () => {
    it('should parse CSV with schema', () => {
      const schema = z.object({
        id: z.coerce.number(),
        value: z.string(),
      });

      const csv = `id,value
1,one
2,two`;

      const result = parseCsv(csv, schema);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([
        { id: 1, value: 'one' },
        { id: 2, value: 'two' },
      ]);
    });
  });

  describe('getCsvHeaders', () => {
    it('should extract headers', () => {
      const csv = 'A,B,C\n1,2,3';
      const headers = getCsvHeaders(csv);

      expect(headers).toEqual(['A', 'B', 'C']);
    });
  });

  describe('validateCsvStructure', () => {
    it('should validate required columns present', () => {
      const csv = 'Name,Email,Phone\nJohn,john@example.com,123';

      const result = validateCsvStructure(csv, ['Name', 'Email']);

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
      expect(result.extra).toContain('Phone');
    });

    it('should report missing required columns', () => {
      const csv = 'Name,Phone\nJohn,123';

      const result = validateCsvStructure(csv, ['Name', 'Email']);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('Email');
    });
  });
});
