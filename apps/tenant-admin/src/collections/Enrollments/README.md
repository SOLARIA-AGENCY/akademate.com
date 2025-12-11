# Enrollments Collection

## Overview

The **Enrollments** collection manages student enrollments in specific course runs, providing comprehensive tracking of:

- Enrollment lifecycle (pending → confirmed → completed)
- Payment processing and financial aid
- Academic tracking (attendance, grades, certificates)
- Real-time capacity management with CourseRuns

**Database Table:** `enrollments` (PostgreSQL)
**Migration:** `/infra/postgres/migrations/007_create_enrollments.sql`

---

## Table of Contents

1. [Features](#features)
2. [Access Control (6-Tier RBAC)](#access-control-6-tier-rbac)
3. [Field Reference](#field-reference)
4. [Validation Rules](#validation-rules)
5. [Business Logic](#business-logic)
6. [Hooks](#hooks)
7. [Security Patterns](#security-patterns)
8. [API Examples](#api-examples)
9. [Testing](#testing)

---

## Features

### Enrollment Management
- **One enrollment per student per course run** (unique constraint enforced)
- Status workflow tracking from application to completion
- Automatic waitlist management when courses are full
- Integration with CourseRuns for real-time capacity updates

### Payment Tracking
- Total amount and amount paid tracking
- Auto-calculated payment status (pending/partial/paid/refunded/waived)
- Financial aid application and approval workflow
- Support for refunds and fee waivers

### Academic Tracking
- Attendance percentage (0-100)
- Final grade (0-100)
- Certificate issuance with immutable URL storage
- Completion tracking with timestamps

### Real-Time Capacity
- Validates against `CourseRun.max_students` before enrollment
- Automatically increments/decrements `CourseRun.current_enrollments`
- Waitlist status when course is full

---

## Access Control (6-Tier RBAC)

### Public (Unauthenticated)
- **CREATE:** ❌ No
- **READ:** ❌ No (privacy protection)
- **UPDATE:** ❌ No
- **DELETE:** ❌ No

**Rationale:** Enrollments contain student PII and must be protected.

### Lectura Role
- **CREATE:** ❌ No
- **READ:** ✅ All enrollments (view only)
- **UPDATE:** ❌ No
- **DELETE:** ❌ No

**Rationale:** Read-only access for reporting purposes.

### Asesor Role
- **CREATE:** ✅ Yes (manual enrollment during consultations)
- **READ:** ✅ All enrollments
- **UPDATE:** ✅ Status changes and notes
- **DELETE:** ❌ No

**Rationale:** Asesors can enroll students and track their progress.

### Marketing Role
- **CREATE:** ✅ Yes (manual enrollment for campaign conversions)
- **READ:** ✅ All enrollments
- **UPDATE:** ✅ Limited to notes only
- **DELETE:** ❌ No

**Rationale:** Marketing can create enrollments and add campaign notes.

### Gestor Role
- **CREATE:** ✅ Yes
- **READ:** ✅ All enrollments
- **UPDATE:** ✅ All fields except financial
- **DELETE:** ✅ Yes (with restrictions)

**Rationale:** Gestors manage enrollments but Admin approval needed for financial changes.

### Admin Role
- **CREATE:** ✅ Yes
- **READ:** ✅ All enrollments
- **UPDATE:** ✅ All fields (including financial)
- **DELETE:** ✅ Yes (unrestricted)

**Rationale:** Full control for system administration.

---

## Field Reference

### Required Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `student` | relationship | Student enrolling (→ `leads`) | Required, must exist |
| `course_run` | relationship | Course run instance (→ `course-runs`) | Required, must exist, status must be `enrollment_open` |
| `status` | select | Enrollment status | One of: pending, confirmed, waitlisted, cancelled, completed, withdrawn |
| `payment_status` | select | Payment status (auto-calculated) | One of: pending, partial, paid, refunded, waived |
| `total_amount` | number | Total amount due | >= 0 |
| `amount_paid` | number | Amount already paid | >= 0, <= total_amount, default: 0 |

### Optional Fields

| Field | Type | Description | Validation |
|-------|------|-------------|------------|
| `financial_aid_applied` | checkbox | Financial aid application flag | boolean, default: false |
| `financial_aid_amount` | number | Financial aid amount | >= 0, <= total_amount, default: 0 |
| `financial_aid_status` | select | Financial aid approval status | One of: none, pending, approved, rejected |
| `attendance_percentage` | number | Student attendance (%) | 0-100 |
| `final_grade` | number | Student final grade | 0-100 |
| `certificate_issued` | checkbox | Certificate issued flag | boolean, default: false, **immutable once true** |
| `certificate_url` | text | Certificate download URL | Valid URL, **immutable once set** |
| `notes` | textarea | Internal notes | Free text |
| `cancellation_reason` | textarea | Reason for cancellation | Free text, shown only when status is cancelled/withdrawn |

### System-Managed Fields (Immutable)

| Field | Type | Description | Set When |
|-------|------|-------------|----------|
| `enrolled_at` | date | Enrollment creation timestamp | On create |
| `confirmed_at` | date | Confirmation timestamp | When status → confirmed |
| `completed_at` | date | Completion timestamp | When status → completed |
| `cancelled_at` | date | Cancellation timestamp | When status → cancelled/withdrawn |
| `created_by` | relationship | User who created enrollment | On create |

---

## Validation Rules

### Relationship Validation
```typescript
// Student must exist
student_id → leads.id (or students.id in production)

// Course run must exist and be accepting enrollments
course_run_id → course_runs.id
course_run.status === 'enrollment_open'
```

### Financial Validation
```typescript
// All amounts must be non-negative
amount_paid >= 0
total_amount >= 0
financial_aid_amount >= 0

// Payment cannot exceed total
amount_paid <= total_amount
financial_aid_amount <= total_amount

// Financial aid requires status
if (financial_aid_applied === true) {
  financial_aid_status is required
}
```

### Academic Validation
```typescript
// Percentages must be 0-100
attendance_percentage: 0-100 (optional)
final_grade: 0-100 (optional)
```

### Uniqueness Validation
```sql
-- Database constraint: One enrollment per student per course run
UNIQUE(student_id, course_run_id)
```

### Status Workflow Validation
```typescript
// Cannot change from 'completed' to any other status
if (currentStatus === 'completed') {
  newStatus must be 'completed'
}
```

---

## Business Logic

### Status Workflow

```
┌─────────┐
│ pending │ ──────────────┐
└─────────┘               │
     │                    │
     │ payment confirmed  │
     ▼                    │
┌───────────┐             │
│ confirmed │             │ (any time)
└───────────┘             │
     │                    │
     │ course completed   │
     ▼                    ▼
┌───────────┐      ┌──────────────┐
│ completed │      │ cancelled/   │
└───────────┘      │ withdrawn    │
                   └──────────────┘
```

**Rules:**
- `pending → confirmed`: When payment is confirmed
- `confirmed → completed`: When course run completes
- Any status → `cancelled`/`withdrawn`: Student or admin cancellation
- `completed` is terminal - cannot change to other status

### Payment Status Auto-Calculation

```typescript
if (amount_paid === 0) {
  payment_status = 'pending'
} else if (amount_paid >= total_amount) {
  payment_status = 'paid'
} else {
  payment_status = 'partial'
}
```

### Capacity Management

```typescript
// On enrollment creation:
if (course_run.current_enrollments >= course_run.max_students) {
  enrollment.status = 'waitlisted'
}

// When enrollment status → 'confirmed':
course_run.current_enrollments += 1

// When enrollment status: 'confirmed' → 'cancelled'/'withdrawn':
course_run.current_enrollments -= 1
```

---

## Hooks

### Hook Execution Order

#### beforeValidate (earliest)
1. **validateEnrollmentRelationships**: Validates student and course_run exist
2. **validateEnrollmentCapacity**: Checks capacity, sets waitlisted if full
3. **validateFinancialData**: Validates amounts, auto-calculates payment_status

#### beforeChange (after validation)
4. **trackEnrollmentCreator**: Auto-populates and protects `created_by`
5. **captureEnrollmentTimestamps**: Auto-captures lifecycle timestamps

#### afterChange (after database write)
6. **updateCourseRunEnrollmentCount**: Updates `course_run.current_enrollments`

### Hook Details

#### validateEnrollmentRelationships
```typescript
// Validates:
// 1. Student exists in database
// 2. CourseRun exists in database
// 3. CourseRun.status === 'enrollment_open'

// Throws error if any validation fails
```

#### validateEnrollmentCapacity
```typescript
// Checks:
// - course_run.current_enrollments < course_run.max_students

// If full:
//   enrollment.status = 'waitlisted'
// Else:
//   enrollment.status = (requested status, usually 'pending')
```

#### validateFinancialData
```typescript
// Validates:
// - amount_paid <= total_amount
// - financial_aid_amount <= total_amount
// - If financial_aid_applied, financial_aid_status required

// Auto-calculates:
//   payment_status = calculatePaymentStatus(amount_paid, total_amount)
```

#### trackEnrollmentCreator
```typescript
// On CREATE:
//   created_by = req.user.id

// On UPDATE:
//   created_by = originalDoc.created_by (immutable)
```

#### captureEnrollmentTimestamps
```typescript
// On CREATE:
//   enrolled_at = now()

// On UPDATE (status changes):
//   if (status → 'confirmed'): confirmed_at = now()
//   if (status → 'completed'): completed_at = now()
//   if (status → 'cancelled'/'withdrawn'): cancelled_at = now()

// All timestamps are immutable once set
```

#### updateCourseRunEnrollmentCount
```typescript
// When enrollment.status → 'confirmed':
//   course_run.current_enrollments += 1

// When enrollment.status: 'confirmed' → 'cancelled'/'withdrawn':
//   course_run.current_enrollments -= 1
```

---

## Security Patterns

### SP-001: Immutable Fields with Defense in Depth

All immutable fields implement three layers of protection:

#### Layer 1: UX Protection
```typescript
admin: {
  readOnly: true, // Prevents UI modification
}
```

#### Layer 2: Security Protection
```typescript
access: {
  read: () => true,
  update: () => false, // API cannot modify
}
```

#### Layer 3: Business Logic Protection
```typescript
// Hook enforces immutability
if (operation === 'update' && data.immutable_field !== originalDoc.immutable_field) {
  data.immutable_field = originalDoc.immutable_field; // Restore
}
```

### Immutable Fields

| Field | Reason |
|-------|--------|
| `created_by` | Audit trail integrity |
| `enrolled_at` | Historical accuracy |
| `confirmed_at` | Payment audit trail |
| `completed_at` | Academic record integrity |
| `cancelled_at` | Cancellation audit trail |
| `certificate_issued` | Once issued, cannot be revoked |
| `certificate_url` | Prevents certificate fraud |

### SP-004: No PII in Logs

**CRITICAL:** Students have PII (names, emails, phone numbers).

**Never log:**
```typescript
// ❌ WRONG - Logs PII
console.log('Enrolling student:', student.first_name, student.email);
```

**Always log IDs only:**
```typescript
// ✅ CORRECT - No PII
console.log('Creating enrollment:', { enrollment_id, student_id, course_run_id });
```

### Financial Data Protection

Payment fields have restricted field-level access:

```typescript
access: {
  read: () => true, // All authenticated users can read
  update: ({ req: { user } }) => {
    // Only Admin and Gestor can modify
    return ['admin', 'gestor'].includes(user.role);
  },
}
```

Protected fields:
- `payment_status`
- `total_amount`
- `amount_paid`
- `financial_aid_applied`
- `financial_aid_amount`
- `financial_aid_status`

---

## API Examples

### Create Enrollment

```typescript
const enrollment = await payload.create({
  collection: 'enrollments',
  data: {
    student: 123, // Student ID
    course_run: 456, // Course Run ID
    status: 'pending',
    payment_status: 'pending',
    total_amount: 1000,
    amount_paid: 0,
  },
  user: currentUser,
});

// Auto-populated fields:
// - created_by: currentUser.id
// - enrolled_at: current timestamp
```

### Confirm Enrollment (with payment)

```typescript
const confirmed = await payload.update({
  collection: 'enrollments',
  id: enrollment.id,
  data: {
    status: 'confirmed',
    amount_paid: 1000, // Full payment
    // payment_status will auto-calculate to 'paid'
  },
  user: adminUser,
});

// Auto-populated fields:
// - confirmed_at: current timestamp
// - payment_status: 'paid' (auto-calculated)

// Side effect:
// - course_run.current_enrollments incremented
```

### Complete Enrollment

```typescript
const completed = await payload.update({
  collection: 'enrollments',
  id: enrollment.id,
  data: {
    status: 'completed',
    attendance_percentage: 95.5,
    final_grade: 87.3,
    certificate_issued: true,
    certificate_url: 'https://cdn.example.com/cert123.pdf',
  },
  user: adminUser,
});

// Auto-populated fields:
// - completed_at: current timestamp
```

### Cancel Enrollment

```typescript
const cancelled = await payload.update({
  collection: 'enrollments',
  id: enrollment.id,
  data: {
    status: 'cancelled',
    cancellation_reason: 'Student requested withdrawal',
    payment_status: 'refunded',
  },
  user: gestorUser,
});

// Auto-populated fields:
// - cancelled_at: current timestamp

// Side effect:
// - course_run.current_enrollments decremented (if was 'confirmed')
```

### Query Enrollments

```typescript
// Find all confirmed enrollments for a course run
const result = await payload.find({
  collection: 'enrollments',
  where: {
    course_run: { equals: 456 },
    status: { equals: 'confirmed' },
  },
  user: currentUser,
});

// Find enrollments with financial aid
const aidEnrollments = await payload.find({
  collection: 'enrollments',
  where: {
    financial_aid_applied: { equals: true },
    financial_aid_status: { equals: 'approved' },
  },
  user: adminUser,
});

// Find waitlisted students
const waitlist = await payload.find({
  collection: 'enrollments',
  where: {
    course_run: { equals: 456 },
    status: { equals: 'waitlisted' },
  },
  sort: 'enrolled_at', // FIFO order
  user: gestorUser,
});
```

---

## Testing

### Test Coverage

The Enrollments collection has **100+ comprehensive tests** covering:

1. **CRUD Operations (15+ tests)**
   - Create with required/optional fields
   - Read by ID and list
   - Update status, payment, academic fields
   - Delete operations
   - Pagination and filtering

2. **Validation Tests (25+ tests)**
   - Required field validation
   - Unique constraint (student + course_run)
   - Financial validation (amounts, relationships)
   - Academic validation (0-100 ranges)
   - Status workflow validation
   - Relationship existence validation

3. **Access Control Tests (18+ tests)**
   - Public: No access
   - Lectura: Read only
   - Asesor: Create, read, update (limited)
   - Marketing: Create, read, update notes
   - Gestor: Full CRUD except delete
   - Admin: Full CRUD

4. **Relationship Tests (12+ tests)**
   - Population of student, course_run, created_by
   - CASCADE delete when student deleted
   - CASCADE delete when course_run deleted
   - SET NULL when created_by user deleted
   - Filtering by relationships
   - Deep population

5. **Hook Tests (15+ tests)**
   - Relationship validation
   - Capacity validation and waitlist
   - Creator tracking and immutability
   - Timestamp auto-population and immutability
   - Financial data validation and auto-calculation
   - Enrollment count updates

6. **Security Tests (12+ tests)**
   - SP-001: Immutable field enforcement (3 layers)
   - Field-level access control on financial data
   - No PII in logs (manual verification)
   - Status downgrade prevention
   - Certificate immutability

7. **Business Logic Tests (10+ tests)**
   - Status workflow transitions
   - Payment status auto-calculation
   - Financial aid workflow
   - Waitlist management

### Running Tests

```bash
# Run all Enrollments tests
npm test -- Enrollments.test.ts

# Run specific test suite
npm test -- Enrollments.test.ts -t "Validation Tests"

# Run with coverage
npm test -- Enrollments.test.ts --coverage
```

### Expected Results
- **Total Tests:** 100+
- **Expected Pass Rate:** 100%
- **Security Vulnerabilities:** ZERO

---

## Database Schema

```sql
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,

    -- Required relationships
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_run_id INTEGER NOT NULL REFERENCES course_runs(id) ON DELETE CASCADE,

    -- Enrollment status workflow
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'pending',

    -- Financial
    amount_paid DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    financial_aid_applied BOOLEAN DEFAULT false,
    financial_aid_amount DECIMAL(10,2) DEFAULT 0.00,
    financial_aid_status VARCHAR(50),

    -- Dates
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,

    -- Academic tracking
    attendance_percentage DECIMAL(5,2),
    final_grade DECIMAL(5,2),
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,

    -- Notes
    notes TEXT,
    cancellation_reason TEXT,

    -- Tracking
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    UNIQUE(student_id, course_run_id),
    CHECK (amount_paid >= 0),
    CHECK (total_amount >= 0),
    CHECK (amount_paid <= total_amount),
    CHECK (financial_aid_amount >= 0),
    CHECK (financial_aid_amount <= total_amount),
    CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
    CHECK (final_grade >= 0 AND final_grade <= 100)
);

-- Indexes
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_run ON enrollments(course_run_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_payment_status ON enrollments(payment_status);
CREATE INDEX idx_enrollments_created_by ON enrollments(created_by);
```

---

## Future Enhancements

### Planned Features
- [ ] Email notifications on status changes
- [ ] Automated certificate generation
- [ ] Payment gateway integration
- [ ] Installment payment plans
- [ ] Waitlist auto-promotion when spots open
- [ ] Student self-service enrollment portal

### Migration Notes
- **Current:** Using `leads` collection as students
- **Production:** Should use dedicated `students` collection
- **Migration Path:** Create Students collection, migrate data, update relationship

---

## Related Collections

- **Students (Leads):** Student information (PII)
- **CourseRuns:** Specific course offerings with capacity
- **Courses:** Course catalog
- **Users:** Creator and modifier tracking

---

## Support

For questions or issues:
1. Check the [test suite](./Enrollments.test.ts) for usage examples
2. Review [validation schemas](./Enrollments.validation.ts) for business rules
3. Examine [hooks](./hooks/) for business logic implementation
4. Contact: dev-team@cepcomunicacion.com

---

**Last Updated:** 2025-10-22
**Version:** 1.0.0
**Status:** Production Ready ✅
