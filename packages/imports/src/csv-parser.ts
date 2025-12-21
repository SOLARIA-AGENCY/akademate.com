/**
 * @fileoverview CSV Parser
 * Robust CSV parsing with validation
 */

import { parse } from 'csv-parse/sync';
import { z } from 'zod';
import type {
  CsvParseOptions,
  ImportResult,
  ImportError,
  ImportWarning,
} from './types';

// =============================================================================
// DEFAULT OPTIONS
// =============================================================================

const defaultOptions: CsvParseOptions = {
  delimiter: ',',
  quote: '"',
  escape: '"',
  encoding: 'utf-8',
  skipEmptyLines: true,
  trimValues: true,
  hasHeader: true,
};

// =============================================================================
// CSV PARSER CLASS
// =============================================================================

export class CsvParser<T> {
  private schema: z.ZodSchema<T>;
  private options: CsvParseOptions;
  private columnMappings: Record<string, string>;

  constructor(
    schema: z.ZodSchema<T>,
    columnMappings: Record<string, string> = {},
    options: CsvParseOptions = {}
  ) {
    this.schema = schema;
    this.columnMappings = columnMappings;
    this.options = { ...defaultOptions, ...options };
  }

  /**
   * Parse CSV content and validate against schema
   */
  parse(content: string | Buffer): ImportResult<T> {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    const validData: T[] = [];

    try {
      // Parse CSV
      const records = this.parseRaw(content);

      if (records.length === 0) {
        return {
          success: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          data: [],
          errors: [{ row: 0, message: 'No data found in CSV', code: 'EMPTY_FILE' }],
          warnings: [],
        };
      }

      // Apply max rows limit
      const rowsToProcess = this.options.maxRows
        ? records.slice(0, this.options.maxRows)
        : records;

      if (this.options.maxRows && records.length > this.options.maxRows) {
        warnings.push({
          row: 0,
          message: `File contains ${records.length} rows, only processing first ${this.options.maxRows}`,
        });
      }

      // Validate each row
      rowsToProcess.forEach((record, index) => {
        const rowNumber = index + 2; // +2 because index is 0-based and header is row 1
        const mappedRecord = this.mapColumns(record);
        const result = this.validateRow(mappedRecord, rowNumber);

        if (result.success) {
          validData.push(result.data as T);
        } else {
          errors.push(...result.errors);
        }

        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      });

      return {
        success: errors.length === 0,
        totalRows: rowsToProcess.length,
        validRows: validData.length,
        invalidRows: errors.length,
        data: validData,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        data: [],
        errors: [
          {
            row: 0,
            message: error instanceof Error ? error.message : 'Unknown parsing error',
            code: 'PARSE_ERROR',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Parse raw CSV without validation
   */
  private parseRaw(content: string | Buffer): Record<string, string>[] {
    const stringContent = Buffer.isBuffer(content)
      ? content.toString(this.options.encoding)
      : content;

    // Remove BOM if present
    const cleanContent = stringContent.replace(/^\uFEFF/, '');

    return parse(cleanContent, {
      columns: this.options.hasHeader,
      skip_empty_lines: this.options.skipEmptyLines,
      trim: this.options.trimValues,
      delimiter: this.options.delimiter,
      quote: this.options.quote,
      escape: this.options.escape,
      relax_column_count: true,
    });
  }

  /**
   * Map CSV columns to schema fields
   */
  private mapColumns(record: Record<string, string>): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    for (const [csvCol, value] of Object.entries(record)) {
      const targetField = this.columnMappings[csvCol] || this.normalizeColumnName(csvCol);
      mapped[targetField] = this.options.trimValues ? value?.trim() : value;
    }

    return mapped;
  }

  /**
   * Normalize column name to camelCase
   */
  private normalizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
      .replace(/^./, (chr) => chr.toLowerCase());
  }

  /**
   * Validate a single row against schema
   */
  private validateRow(
    record: Record<string, unknown>,
    rowNumber: number
  ): {
    success: boolean;
    data?: T;
    errors: ImportError[];
    warnings: ImportWarning[];
  } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    // Check for empty required values
    for (const [key, value] of Object.entries(record)) {
      if (value === '' || value === null || value === undefined) {
        // Will be caught by schema validation if required
        record[key] = undefined;
      }
    }

    // Validate against schema
    const result = this.schema.safeParse(record);

    if (result.success) {
      return { success: true, data: result.data, errors: [], warnings };
    }

    // Extract errors from Zod
    for (const issue of result.error.issues) {
      errors.push({
        row: rowNumber,
        column: issue.path.join('.'),
        value: String(record[issue.path[0]] ?? ''),
        message: issue.message,
        code: issue.code,
      });
    }

    return { success: false, errors, warnings };
  }

  /**
   * Get detected headers from CSV
   */
  getHeaders(content: string | Buffer): string[] {
    const stringContent = Buffer.isBuffer(content)
      ? content.toString(this.options.encoding)
      : content;

    const cleanContent = stringContent.replace(/^\uFEFF/, '');
    const firstLine = cleanContent.split(/\r?\n/)[0];

    if (!firstLine) return [];

    return parse(firstLine, {
      columns: false,
      delimiter: this.options.delimiter,
      quote: this.options.quote,
    })[0] as string[];
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Parse CSV with automatic schema inference
 */
export function parseCsv<T>(
  content: string | Buffer,
  schema: z.ZodSchema<T>,
  columnMappings: Record<string, string> = {},
  options: CsvParseOptions = {}
): ImportResult<T> {
  const parser = new CsvParser(schema, columnMappings, options);
  return parser.parse(content);
}

/**
 * Get headers from CSV content
 */
export function getCsvHeaders(
  content: string | Buffer,
  options: CsvParseOptions = {}
): string[] {
  const parser = new CsvParser(z.object({}), {}, options);
  return parser.getHeaders(content);
}

/**
 * Validate CSV structure without parsing data
 */
export function validateCsvStructure(
  content: string | Buffer,
  requiredColumns: string[],
  options: CsvParseOptions = {}
): { valid: boolean; missing: string[]; extra: string[] } {
  const headers = getCsvHeaders(content, options);
  const normalizedHeaders = headers.map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );
  const normalizedRequired = requiredColumns.map((c) =>
    c.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  const missing = normalizedRequired.filter((r) => !normalizedHeaders.includes(r));
  const extra = normalizedHeaders.filter((h) => !normalizedRequired.includes(h));

  return {
    valid: missing.length === 0,
    missing: missing.map((m) => requiredColumns[normalizedRequired.indexOf(m)]),
    extra: headers.filter((_, i) => extra.includes(normalizedHeaders[i])),
  };
}
