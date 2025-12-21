
import type { CollectionConfig } from 'payload'
import {
    readOwnTenant,
    createWithTenant,
    updateOwnTenant,
    deleteOwnTenant,
} from '../../access/tenantAccess'
import { injectTenantId, preventTenantChange } from '../../hooks/injectTenantId'
import { tenantField, timestampFields } from '../fields'

export const Attendance: CollectionConfig = {
    slug: 'attendance',
    admin: {
        group: 'Operations',
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
        { name: 'enrollment', type: 'relationship', relationTo: 'enrollments', required: true },
        { name: 'sessionDate', type: 'date', required: true },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'present',
            options: [
                { label: 'Present', value: 'present' },
                { label: 'Absent', value: 'absent' },
                { label: 'Late', value: 'late' },
                { label: 'Excused', value: 'excused' },
            ],
        },
        { name: 'checkInAt', type: 'date' },
        { name: 'checkOutAt', type: 'date' },
        { name: 'notes', type: 'textarea' },
        { name: 'recordedBy', type: 'relationship', relationTo: 'users' },
        ...timestampFields,
    ],
}

export const CalendarEvents: CollectionConfig = {
    slug: 'calendar-events',
    admin: {
        useAsTitle: 'title',
        group: 'Operations',
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
        { name: 'courseRun', type: 'relationship', relationTo: 'course-runs' },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        {
            name: 'type',
            type: 'select',
            defaultValue: 'class',
            options: [
                { label: 'Class', value: 'class' },
                { label: 'Exam', value: 'exam' },
                { label: 'Holiday', value: 'holiday' },
                { label: 'Meeting', value: 'meeting' },
                { label: 'Deadline', value: 'deadline' },
                { label: 'Other', value: 'other' },
            ],
        },
        { name: 'startAt', type: 'date', required: true },
        { name: 'endAt', type: 'date', required: true },
        { name: 'location', type: 'text' },
        { name: 'isAllDay', type: 'checkbox', defaultValue: false },
        { name: 'isRecurring', type: 'checkbox', defaultValue: false },
        { name: 'recurrenceRule', type: 'text' },
        { name: 'color', type: 'text' },
        ...timestampFields,
    ],
}

export const LiveSessions: CollectionConfig = {
    slug: 'live-sessions',
    admin: {
        useAsTitle: 'title',
        group: 'Operations',
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
        { name: 'courseRun', type: 'relationship', relationTo: 'course-runs', required: true },
        { name: 'lesson', type: 'relationship', relationTo: 'lessons' },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'provider', type: 'text', required: true, admin: { description: 'zoom, google_meet, teams, custom' } },
        { name: 'joinUrl', type: 'text', required: true },
        { name: 'hostUrl', type: 'text' },
        { name: 'scheduledAt', type: 'date', required: true },
        { name: 'durationMinutes', type: 'number', required: true },
        { name: 'recordingUrl', type: 'text' },
        { name: 'recordingAvailableAt', type: 'date' },
        { name: 'maxParticipants', type: 'number' },
        ...timestampFields,
    ],
}

export const Certificates: CollectionConfig = {
    slug: 'certificates',
    admin: {
        useAsTitle: 'verificationHash',
        group: 'Operations',
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
        { name: 'enrollment', type: 'relationship', relationTo: 'enrollments', required: true },
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
        { name: 'courseRun', type: 'relationship', relationTo: 'course-runs', required: true },
        { name: 'templateId', type: 'text' },
        { name: 'verificationHash', type: 'text', required: true, unique: true },
        { name: 'issuedAt', type: 'date', defaultValue: () => new Date().toISOString() },
        { name: 'expiresAt', type: 'date' },
        { name: 'pdfUrl', type: 'text' },
        ...timestampFields,
    ],
}
