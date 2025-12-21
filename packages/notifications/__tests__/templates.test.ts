/**
 * @fileoverview Email Templates Tests
 */

import { describe, it, expect } from 'vitest';
import { renderTemplate, getSubject, formatDate, formatCurrency } from '../src/templates';
import type {
  WelcomeTemplateData,
  PasswordResetTemplateData,
  EnrollmentConfirmedTemplateData,
  PaymentReceivedTemplateData,
  CertificateIssuedTemplateData,
} from '../src/types';

describe('Email Templates', () => {
  const baseData = {
    recipientName: 'John Doe',
    recipientEmail: 'john@example.com',
    tenantName: 'Akademate',
    supportEmail: 'support@test.com',
    year: 2024,
  };

  // ============================================================================
  // RENDER TEMPLATE
  // ============================================================================

  describe('renderTemplate', () => {
    it('should render welcome template', () => {
      const data: WelcomeTemplateData = {
        ...baseData,
        loginUrl: 'https://app.example.com/login',
      };

      const html = renderTemplate('welcome', data);

      expect(html).toContain('Bienvenido');
      expect(html).toContain('John Doe');
      expect(html).toContain('https://app.example.com/login');
      expect(html).toContain('Akademate');
    });

    it('should render password_reset template', () => {
      const data: PasswordResetTemplateData = {
        ...baseData,
        resetUrl: 'https://app.example.com/reset',
        expiresIn: '1 hora',
        requestedAt: new Date('2024-01-15T10:00:00Z'),
      };

      const html = renderTemplate('password_reset', data);

      expect(html).toContain('Restablecer');
      expect(html).toContain('https://app.example.com/reset');
      expect(html).toContain('1 hora');
    });

    it('should render enrollment_confirmed template', () => {
      const data: EnrollmentConfirmedTemplateData = {
        ...baseData,
        courseName: 'React Advanced',
        courseStartDate: new Date('2024-02-01'),
        accessUrl: 'https://campus.example.com/course/1',
        instructorName: 'Jane Smith',
      };

      const html = renderTemplate('enrollment_confirmed', data);

      expect(html).toContain('React Advanced');
      expect(html).toContain('Jane Smith');
      expect(html).toContain('Inscripción Confirmada');
    });

    it('should render payment_received template', () => {
      const data: PaymentReceivedTemplateData = {
        ...baseData,
        amount: 299.99,
        currency: 'EUR',
        description: 'Course enrollment',
        invoiceUrl: 'https://billing.example.com/invoice/123',
        paymentDate: new Date('2024-01-15'),
        paymentMethod: 'Visa **** 4242',
      };

      const html = renderTemplate('payment_received', data);

      expect(html).toContain('299');
      expect(html).toContain('€');
      expect(html).toContain('Pago');
    });

    it('should render certificate_issued template', () => {
      const data: CertificateIssuedTemplateData = {
        ...baseData,
        courseName: 'TypeScript Mastery',
        completionDate: new Date('2024-01-20'),
        certificateUrl: 'https://certs.example.com/abc123',
        certificateCode: 'CERT-2024-001',
        grade: 95,
      };

      const html = renderTemplate('certificate_issued', data);

      expect(html).toContain('TypeScript Mastery');
      expect(html).toContain('https://certs.example.com/abc123');
      expect(html).toContain('Certificado');
    });

    it('should include base layout elements', () => {
      const data: WelcomeTemplateData = {
        ...baseData,
        loginUrl: 'https://app.example.com',
      };

      const html = renderTemplate('welcome', data);

      // Header
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="es">');

      // Footer
      expect(html).toContain('2024');
      expect(html).toContain('Akademate');
      expect(html).toContain('support@test.com');
    });

    it('should handle templates with optional fields', () => {
      const data: EnrollmentConfirmedTemplateData = {
        ...baseData,
        courseName: 'Basic Course',
        courseStartDate: new Date('2024-02-01'),
        accessUrl: 'https://campus.example.com/course/1',
        instructorName: 'Dr. Smith', // Instructor name provided
      };

      const html = renderTemplate('enrollment_confirmed', data);

      expect(html).toContain('Basic Course');
      expect(html).toContain('Dr. Smith');
    });
  });

  // ============================================================================
  // GET SUBJECT
  // ============================================================================

  describe('getSubject', () => {
    it('should return correct subject for welcome', () => {
      const subject = getSubject('welcome', baseData);
      expect(subject).toContain('Bienvenido');
      expect(subject).toContain('Akademate');
    });

    it('should return correct subject for password_reset', () => {
      const subject = getSubject('password_reset', baseData);
      expect(subject).toContain('Contraseña');
    });

    it('should return correct subject for enrollment_confirmed', () => {
      const subject = getSubject('enrollment_confirmed', {
        ...baseData,
        courseName: 'React Course',
      } as EnrollmentConfirmedTemplateData);
      expect(subject).toContain('Inscripción');
    });

    it('should return correct subject for payment_received', () => {
      const subject = getSubject('payment_received', {
        ...baseData,
        amount: 100,
        currency: 'EUR',
      } as PaymentReceivedTemplateData);
      expect(subject).toContain('Pago');
    });

    it('should return correct subject for certificate_issued', () => {
      const subject = getSubject('certificate_issued', {
        ...baseData,
        courseName: 'TypeScript',
      } as CertificateIssuedTemplateData);
      expect(subject).toContain('Certificado');
    });
  });

  // ============================================================================
  // FORMAT UTILITIES
  // ============================================================================

  describe('formatDate', () => {
    it('should format date in Spanish', () => {
      const date = new Date('2024-03-15');
      const formatted = formatDate(date);

      expect(formatted).toContain('15');
      expect(formatted).toContain('marzo');
      expect(formatted).toContain('2024');
    });

    it('should include time when specified', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDate(date, true);

      expect(formatted).toContain('14:30');
    });

    it('should not include time by default', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDate(date);

      expect(formatted).not.toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatCurrency', () => {
    it('should format EUR correctly', () => {
      const formatted = formatCurrency(1234.56, 'EUR');

      expect(formatted).toContain('1234');
      expect(formatted).toContain('€');
    });

    it('should format USD correctly', () => {
      const formatted = formatCurrency(1234.56, 'USD');

      expect(formatted).toContain('1234');
      expect(formatted).toContain('$');
    });

    it('should handle zero amounts', () => {
      const formatted = formatCurrency(0, 'EUR');

      expect(formatted).toContain('0');
    });

    it('should handle large amounts', () => {
      const formatted = formatCurrency(1000000, 'EUR');

      // Format includes thousand separators and currency symbol
      expect(formatted).toMatch(/1.*000.*000/);
      expect(formatted).toContain('€');
    });
  });
});
