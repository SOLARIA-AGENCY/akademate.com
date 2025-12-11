# CourseRuns Collection

## Overview

The **CourseRuns** collection manages specific offerings/instances of courses in the CEPComunicación CMS. Each course run represents a concrete instance of a course with specific dates, schedule, capacity, and enrollment tracking.

This collection is essential for:
- Scheduling course offerings throughout the year
- Managing student enrollment capacity
- Tracking course run status through its lifecycle
- Supporting multi-campus operations
- Enabling flexible pricing per course run

## Database Schema

**PostgreSQL Table:** `course_runs`

**Migration:** `/infra/postgres/migrations/006_create_course_runs.sql`

### Key Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `course` | relationship | YES | Reference to parent course |
| `campus` | relationship | NO | Campus where run takes place (optional for online) |
| `start_date` | date | YES | Course run start date |
| `end_date` | date | YES | Course run end date (must be > start_date) |
| `enrollment_deadline` | date | NO | Last date to enroll (must be < start_date) |
| `schedule_days` | array | NO | Days of week (e.g., ['monday', 'wednesday']) |
| `schedule_time_start` | time | NO | Daily start time (HH:MM:SS) |
| `schedule_time_end` | time | NO | Daily end time (HH:MM:SS) |
| `max_students` | number | YES | Maximum capacity (default: 30) |
| `min_students` | number | YES | Minimum to run (default: 5) |
| `current_enrollments` | number | YES | Current enrolled count (system-managed) |
| `status` | enum | YES | Workflow status (default: draft) |
| `price_override` | decimal | NO | Override course price |
| `financial_aid_available` | boolean | NO | Financial aid flag |
| `instructor_name` | string | NO | Instructor name |
| `instructor_bio` | text | NO | Instructor biography |
| `notes` | text | NO | Internal notes |
| `created_by` | relationship | AUTO | User who created (immutable) |

## Access Control (6-Tier RBAC)

### Public (Unauthenticated)
- **CREATE:** ❌ No
- **READ:** ✅ Only published/enrollment_open runs
- **UPDATE:** ❌ No
- **DELETE:** ❌ No

### Lectura Role
- **CREATE:** ❌ No
- **READ:** ✅ All active runs (not draft/cancelled)
- **UPDATE:** ❌ No
- **DELETE:** ❌ No

### Asesor Role
- **CREATE:** ❌ No
- **READ:** ✅ All runs
- **UPDATE:** ❌ No
- **DELETE:** ❌ No

### Marketing Role
- **CREATE:** ✅ Yes
- **READ:** ✅ All runs
- **UPDATE:** ✅ Own runs only (created_by = user.id)
- **DELETE:** ❌ No

### Gestor Role
- **CREATE:** ✅ Yes
- **READ:** ✅ All runs
- **UPDATE:** ✅ All runs
- **DELETE:** ✅ Yes

### Admin Role
- **CREATE:** ✅ Yes
- **READ:** ✅ All runs
- **UPDATE:** ✅ All runs
- **DELETE:** ✅ Yes

## Status Workflow

Course runs follow this lifecycle:

```
draft → published → enrollment_open → enrollment_closed → in_progress → completed
                                                              ↓
                                                         cancelled
```

### Status Definitions

1. **draft:** Initial state, not visible to public. Used for planning.
2. **published:** Visible to public but not accepting enrollments yet.
3. **enrollment_open:** Actively accepting student enrollments.
4. **enrollment_closed:** No longer accepting enrollments, preparing to start.
5. **in_progress:** Course run has started, classes are ongoing.
6. **completed:** Course run has finished successfully.
7. **cancelled:** Course run was cancelled (insufficient enrollments, etc.).

## Validation Rules

### Date Validation
- `end_date` must be **after** `start_date`
- `enrollment_deadline` must be **before** `start_date` (if provided)
- All dates must be valid ISO 8601 format

### Time Validation
- If `schedule_time_start` is provided, `schedule_time_end` is **required**
- If `schedule_time_end` is provided, `schedule_time_start` is **required**
- `schedule_time_end` must be **after** `schedule_time_start`
- Time format: `HH:MM:SS` (e.g., `09:00:00`)

### Capacity Validation
- `max_students` must be **greater than** `min_students`
- `min_students` must be **greater than 0**
- `current_enrollments` must be **>= 0**
- `current_enrollments` must be **<= max_students**
- `current_enrollments` can **ONLY** be modified by enrollment system (not manually)

### Schedule Days Validation
- Valid values: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`
- No duplicate days allowed
- Case-sensitive (must be lowercase)

### Pricing Validation
- `price_override` must be **>= 0** (can be 0 for free courses)

### Relationship Validation
- `course` must exist in `courses` table
- `campus` must exist in `campuses` table (if provided)

## Security Patterns

This collection implements **SP-001: Immutable Fields with Defense in Depth**.

### Immutable Field: `created_by`

**Purpose:** Track who created each course run for ownership-based permissions.

**Protection Layers:**
1. **Layer 1 (UX):** `admin.readOnly = true` prevents UI editing
2. **Layer 2 (Security):** `access.update = false` prevents API manipulation
3. **Layer 3 (Business Logic):** `trackCourseRunCreator` hook enforces immutability

**Behavior:**
- On CREATE: Auto-populated with current user's ID
- On UPDATE: Attempts to change are silently ignored (reverted to original)

### Immutable Field: `current_enrollments`

**Purpose:** Prevent manual modification to ensure enrollment tracking accuracy.

**Protection Layers:**
1. **Layer 1 (UX):** `admin.readOnly = true` prevents UI editing
2. **Layer 2 (Security):** `access.update = false` prevents API manipulation
3. **Layer 3 (Business Logic):** `validateEnrollmentCapacity` hook rejects manual changes

**Behavior:**
- On CREATE: Auto-set to 0
- On UPDATE: Manual changes throw error
- ONLY enrollment system hooks can modify this field

## Hooks

### 1. validateCourseRunDates (beforeValidate)
Validates all date and time logic before Payload's built-in validation.

**Validations:**
- end_date > start_date
- enrollment_deadline < start_date
- schedule_time_end > schedule_time_start
- Both schedule times must be provided together

**Location:** `/hooks/validateCourseRunDates.ts`

### 2. validateCourseRunRelationships (beforeValidate)
Ensures all relationship IDs exist in their respective tables.

**Validations:**
- course_id exists in courses table
- campus_id exists in campuses table (if provided)

**Location:** `/hooks/validateCourseRunRelationships.ts`

### 3. validateEnrollmentCapacity (beforeValidate)
Validates capacity constraints and prevents manual enrollment manipulation.

**Validations:**
- max_students > min_students
- current_enrollments <= max_students
- min_students > 0
- Rejects manual changes to current_enrollments

**Location:** `/hooks/validateEnrollmentCapacity.ts`

### 4. trackCourseRunCreator (beforeChange)
Auto-populates and protects the created_by field.

**Behavior:**
- On CREATE: Sets created_by to current user's ID
- On UPDATE: Prevents modification (restores original value)

**Location:** `/hooks/trackCourseRunCreator.ts`

## Usage Examples

### Create a Course Run (Marketing User)

```typescript
const courseRun = await payload.create({
  collection: 'course-runs',
  data: {
    course: 1, // Course ID
    campus: 2, // Campus ID (optional)
    start_date: '2025-09-01',
    end_date: '2025-12-31',
    enrollment_deadline: '2025-08-15',
    schedule_days: ['monday', 'wednesday', 'friday'],
    schedule_time_start: '09:00:00',
    schedule_time_end: '13:00:00',
    max_students: 25,
    min_students: 10,
    status: 'draft',
    price_override: 4500.00,
    financial_aid_available: true,
    instructor_name: 'Prof. Maria García',
    instructor_bio: 'Expert in digital marketing with 15 years experience.',
  },
  user: marketingUser,
});
```

### Update Status to Published (Gestor/Admin)

```typescript
const updated = await payload.update({
  collection: 'course-runs',
  id: courseRunId,
  data: {
    status: 'published',
  },
  user: gestorUser,
});
```

### Query Published Runs (Public)

```typescript
const runs = await payload.find({
  collection: 'course-runs',
  where: {
    status: {
      in: ['published', 'enrollment_open'],
    },
    start_date: {
      greater_than: new Date().toISOString(),
    },
  },
  depth: 1, // Populate course and campus relationships
});
```

### Marketing User Updates Own Run

```typescript
// This works - Marketing user owns this run
const updated = await payload.update({
  collection: 'course-runs',
  id: ownRunId,
  data: {
    max_students: 30,
  },
  user: marketingUser,
});

// This fails - Marketing user doesn't own this run
await payload.update({
  collection: 'course-runs',
  id: othersRunId,
  data: {
    max_students: 30,
  },
  user: marketingUser,
}); // Throws access denied error
```

## Relationships

### Parent: Course (REQUIRED)
- **Relationship:** Many-to-One (many runs belong to one course)
- **Cascade:** ON DELETE CASCADE
- **Behavior:** Deleting a course deletes all its course runs

### Optional: Campus
- **Relationship:** Many-to-One (many runs can occur at one campus)
- **Cascade:** ON DELETE SET NULL
- **Behavior:** Deleting a campus sets course_run.campus to NULL

### Audit: created_by
- **Relationship:** Many-to-One (many runs created by one user)
- **Cascade:** ON DELETE SET NULL
- **Behavior:** Deleting a user sets course_run.created_by to NULL

## Testing

This collection has **80+ comprehensive tests** covering:
- ✅ CRUD operations (15 tests)
- ✅ Validation rules (20 tests)
- ✅ Access control for all 6 roles (15 tests)
- ✅ Relationship handling (10 tests)
- ✅ Hook functionality (10 tests)
- ✅ Security patterns (10 tests)

**Test File:** `/CourseRuns.test.ts`

**Run Tests:**
```bash
npm test -- CourseRuns.test.ts
```

## Future Enhancements

1. **Status Transition Validation:**
   - Enforce valid status transitions (e.g., can't go from completed to draft)
   - Hook to validate state machine transitions

2. **Enrollment Integration:**
   - Hook to update current_enrollments when students enroll/withdraw
   - Trigger notifications when capacity thresholds are reached

3. **Calendar Integration:**
   - Generate iCal feeds for course schedules
   - Sync with external calendar systems

4. **Automated Status Updates:**
   - Cron job to update status based on dates
   - Auto-transition to `in_progress` on start_date
   - Auto-transition to `completed` on end_date

5. **Capacity Warnings:**
   - Notify when enrollment approaches max_students
   - Alert when enrollment below min_students near start date

6. **Search Integration:**
   - Index course runs for full-text search
   - Filter by date ranges, campus, status

## Architecture Decisions

### Why separate Course and CourseRun?

**Separation of Concerns:**
- **Course:** Describes the educational offering (curriculum, credits, syllabus)
- **CourseRun:** Describes a specific instance (when, where, who, how many)

**Benefits:**
- Same course can run multiple times with different schedules
- Different pricing per run (early bird, location-based, etc.)
- Independent capacity management per run
- Easier reporting (enrollments per run vs. course popularity)

### Why make current_enrollments immutable?

**Data Integrity:**
- Prevents accidental overbooking
- Ensures enrollment count matches actual student records
- Single source of truth (enrollment system owns this field)

**Audit Trail:**
- All enrollment changes tracked through enrollment system
- No manual adjustments that could corrupt data

### Why ownership-based permissions for Marketing?

**Collaboration Without Conflict:**
- Multiple marketing users can work independently
- Prevents accidental modifications of others' work
- Clear accountability (who created what)

**Escalation Path:**
- Marketing creates draft runs
- Gestor reviews and publishes
- Maintains quality control

## Related Collections

- **Courses:** Parent collection (each run belongs to one course)
- **Campuses:** Location reference (optional)
- **Users:** Creator tracking (created_by)
- **Enrollments (Future):** Student enrollment records

## API Endpoints

### REST API

- `GET /api/course-runs` - List course runs (filtered by access control)
- `GET /api/course-runs/:id` - Get single course run
- `POST /api/course-runs` - Create course run (Marketing/Gestor/Admin)
- `PATCH /api/course-runs/:id` - Update course run (Marketing own/Gestor/Admin)
- `DELETE /api/course-runs/:id` - Delete course run (Gestor/Admin)

### GraphQL API

```graphql
query {
  CourseRuns(where: { status: { equals: "published" } }) {
    docs {
      id
      course {
        title
      }
      campus {
        name
      }
      start_date
      end_date
      current_enrollments
      max_students
      status
    }
  }
}
```

## Support

For questions or issues related to the CourseRuns collection:
1. Review this README
2. Check test file for usage examples
3. Review security patterns documentation
4. Consult the development team

---

**Last Updated:** 2025-10-22
**Version:** 2.0.0
**Maintained By:** CEPComunicación Development Team
