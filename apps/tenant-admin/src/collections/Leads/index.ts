/**
 * Leads Collection - Main Export
 *
 * This is a GDPR-compliant lead management collection for CEPComunicacion.
 *
 * Key features:
 * - Public form submission (no auth required)
 * - Mandatory GDPR consent enforcement
 * - Automatic consent metadata capture
 * - Spanish phone format validation
 * - Lead scoring (0-100)
 * - Duplicate prevention
 * - Role-based access control
 * - External service integrations (MailChimp, WhatsApp)
 *
 * Database: PostgreSQL table 'leads'
 * Migration: /infra/postgres/migrations/004_create_leads.sql
 *
 * @see README.md for detailed documentation
 */

export { Leads } from './Leads';
