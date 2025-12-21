
import type { CollectionConfig } from 'payload'
import {
    readOwnTenant,
    createWithTenant,
    updateOwnTenant,
    deleteOwnTenant,
    publicRead,
} from '../../access/tenantAccess'
import { injectTenantId, preventTenantChange } from '../../hooks/injectTenantId'
import {
    emitLessonProgressUpdate,
    emitEnrollmentUpdate,
    emitGradeUpdate,
    emitSubmissionUpdate,
} from '../../hooks/emitSocketEvent'
import { tenantField, timestampFields } from '../fields'

export const Modules: CollectionConfig = {
    slug: 'modules',
    admin: {
        useAsTitle: 'title',
        group: 'LMS',
    },
    access: {
        read: publicRead,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
    },
    fields: [
        tenantField,
        { name: 'course', type: 'relationship', relationTo: 'courses', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'order', type: 'number', defaultValue: 0 },
        { name: 'duration', type: 'number', admin: { description: 'Estimated minutes' } },
        { name: 'isPublished', type: 'checkbox', defaultValue: false },
        { name: 'metadata', type: 'json', defaultValue: {} },
        ...timestampFields,
    ],
}

export const Lessons: CollectionConfig = {
    slug: 'lessons',
    admin: {
        useAsTitle: 'title',
        group: 'LMS',
    },
    access: {
        read: publicRead,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
    },
    fields: [
        tenantField,
        { name: 'module', type: 'relationship', relationTo: 'modules', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true },
        {
            name: 'type',
            type: 'select',
            required: true,
            defaultValue: 'text',
            options: [
                { label: 'Text', value: 'text' },
                { label: 'Video', value: 'video' },
                { label: 'Quiz', value: 'quiz' },
                { label: 'Assignment', value: 'assignment' },
                { label: 'Live Session', value: 'live_session' },
            ],
        },
        { name: 'content', type: 'richText' },
        { name: 'videoUrl', type: 'text' },
        { name: 'duration', type: 'number', admin: { description: 'Minutes' } },
        { name: 'order', type: 'number', defaultValue: 0 },
        { name: 'isPublished', type: 'checkbox', defaultValue: false },
        { name: 'isFree', type: 'checkbox', defaultValue: false },
        { name: 'metadata', type: 'json', defaultValue: {} },
        ...timestampFields,
    ],
}

export const Materials: CollectionConfig = {
    slug: 'materials',
    admin: {
        useAsTitle: 'title',
        group: 'LMS',
    },
    access: {
        read: publicRead,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
    },
    fields: [
        tenantField,
        { name: 'lesson', type: 'relationship', relationTo: 'lessons' },
        { name: 'module', type: 'relationship', relationTo: 'modules' },
        { name: 'course', type: 'relationship', relationTo: 'courses' },
        { name: 'title', type: 'text', required: true },
        {
            name: 'type',
            type: 'select',
            defaultValue: 'document',
            options: [
                { label: 'PDF', value: 'pdf' },
                { label: 'Video', value: 'video' },
                { label: 'Audio', value: 'audio' },
                { label: 'Document', value: 'document' },
                { label: 'Link', value: 'link' },
                { label: 'Other', value: 'other' },
            ],
        },
        { name: 'fileUrl', type: 'text' },
        { name: 'file', type: 'upload', relationTo: 'media' },
        { name: 'description', type: 'textarea' },
        { name: 'isPublic', type: 'checkbox', defaultValue: false },
        ...timestampFields,
    ],
}

export const Assignments: CollectionConfig = {
    slug: 'assignments',
    admin: {
        useAsTitle: 'title',
        group: 'LMS',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
    },
    fields: [
        tenantField,
        { name: 'lesson', type: 'relationship', relationTo: 'lessons' },
        { name: 'module', type: 'relationship', relationTo: 'modules' },
        { name: 'course', type: 'relationship', relationTo: 'courses', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        {
            name: 'type',
            type: 'select',
            defaultValue: 'practice',
            options: [
                { label: 'Practice', value: 'practice' },
                { label: 'Quiz', value: 'quiz' },
                { label: 'Essay', value: 'essay' },
                { label: 'Project', value: 'project' },
                { label: 'Exam', value: 'exam' },
            ],
        },
        { name: 'maxScore', type: 'number', defaultValue: 100 },
        { name: 'passingScore', type: 'number' },
        { name: 'dueDate', type: 'date' },
        { name: 'timeLimit', type: 'number', admin: { description: 'Minutes' } },
        { name: 'isPublished', type: 'checkbox', defaultValue: false },
        ...timestampFields,
    ],
}

export const Enrollments: CollectionConfig = {
    slug: 'enrollments',
    admin: {
        group: 'LMS',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
        afterChange: [emitEnrollmentUpdate],
    },
    fields: [
        tenantField,
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
        { name: 'courseRun', type: 'relationship', relationTo: 'course-runs', required: true },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
                { label: 'Withdrawn', value: 'withdrawn' },
                { label: 'Failed', value: 'failed' },
            ],
        },
        { name: 'enrolledAt', type: 'date', defaultValue: () => new Date().toISOString() },
        { name: 'startedAt', type: 'date' },
        { name: 'completedAt', type: 'date' },
        { name: 'expiresAt', type: 'date' },
        { name: 'progress', type: 'number', defaultValue: 0 },
        { name: 'lastAccessAt', type: 'date' },
        { name: 'certificateUrl', type: 'text' },
        { name: 'metadata', type: 'json', defaultValue: {} },
        ...timestampFields,
    ],
}

export const Submissions: CollectionConfig = {
    slug: 'submissions',
    admin: {
        group: 'LMS',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
        afterChange: [emitSubmissionUpdate],
    },
    fields: [
        tenantField,
        { name: 'enrollment', type: 'relationship', relationTo: 'enrollments', required: true },
        { name: 'assignment', type: 'relationship', relationTo: 'assignments', required: true },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Submitted', value: 'submitted' },
                { label: 'Grading', value: 'grading' },
                { label: 'Graded', value: 'graded' },
                { label: 'Returned', value: 'returned' },
            ],
        },
        { name: 'content', type: 'richText' },
        { name: 'file', type: 'upload', relationTo: 'media' },
        { name: 'submittedAt', type: 'date' },
        ...timestampFields,
    ],
}

export const Grades: CollectionConfig = {
    slug: 'grades',
    admin: {
        group: 'LMS',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
        afterChange: [emitGradeUpdate],
    },
    fields: [
        tenantField,
        { name: 'submission', type: 'relationship', relationTo: 'submissions', required: true },
        { name: 'grader', type: 'relationship', relationTo: 'users' },
        { name: 'score', type: 'number', required: true },
        { name: 'maxScore', type: 'number', required: true },
        { name: 'feedback', type: 'textarea' },
        { name: 'isPass', type: 'checkbox', defaultValue: false },
        { name: 'gradedAt', type: 'date' },
        ...timestampFields,
    ],
}

export const LessonProgress: CollectionConfig = {
    slug: 'lesson-progress',
    admin: {
        group: 'LMS',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
        afterChange: [emitLessonProgressUpdate],
    },
    fields: [
        tenantField,
        { name: 'enrollment', type: 'relationship', relationTo: 'enrollments', required: true },
        { name: 'lesson', type: 'relationship', relationTo: 'lessons', required: true },
        { name: 'isCompleted', type: 'checkbox', defaultValue: false },
        { name: 'completedAt', type: 'date' },
        { name: 'timeSpent', type: 'number', defaultValue: 0 },
        { name: 'lastPosition', type: 'number' },
        ...timestampFields,
    ],
}
