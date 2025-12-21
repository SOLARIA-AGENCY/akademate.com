
import type { CollectionConfig } from 'payload'
import {
    readOwnTenant,
    createWithTenant,
    updateOwnTenant,
    deleteOwnTenant,
} from '../../access/tenantAccess'
import { injectTenantId, preventTenantChange } from '../../hooks/injectTenantId'
import {
    emitBadgeEarned,
    emitPointsEarned,
    emitStreakUpdate,
} from '../../hooks/emitSocketEvent'
import { tenantField, timestampFields } from '../fields'

export const BadgeDefinitions: CollectionConfig = {
    slug: 'badge-definitions', // using kebab-case to match potential table needs or simple slug
    labels: { singular: 'Badge Definition', plural: 'Badge Definitions' },
    admin: {
        useAsTitle: 'name',
        group: 'Gamification',
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
        { name: 'code', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        {
            name: 'type',
            type: 'select',
            required: true,
            options: [
                { label: 'Course Complete', value: 'course_complete' },
                { label: 'Module Complete', value: 'module_complete' },
                { label: 'Streak', value: 'streak' },
                { label: 'First Lesson', value: 'first_lesson' },
                { label: 'Perfect Score', value: 'perfect_score' },
                { label: 'Early Bird', value: 'early_bird' },
                { label: 'Night Owl', value: 'night_owl' },
                { label: 'Speed Learner', value: 'speed_learner' },
                { label: 'Dedicated', value: 'dedicated' },
                { label: 'Custom', value: 'custom' },
            ],
        },
        { name: 'pointsValue', type: 'number', defaultValue: 0 },
        { name: 'icon', type: 'upload', relationTo: 'media' },
        { name: 'criteria', type: 'json', defaultValue: {} },
        { name: 'isActive', type: 'checkbox', defaultValue: true },
        ...timestampFields,
    ],
}

export const UserBadges: CollectionConfig = {
    slug: 'user-badges',
    admin: {
        group: 'Gamification',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
        afterChange: [emitBadgeEarned],
    },
    fields: [
        tenantField,
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
        { name: 'badge', type: 'relationship', relationTo: 'badge-definitions', required: true },
        { name: 'earnedAt', type: 'date', defaultValue: () => new Date().toISOString() },
        ...timestampFields,
    ],
}

export const PointsTransactions: CollectionConfig = {
    slug: 'points-transactions',
    admin: {
        group: 'Gamification',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant, // Typically immutable logic? Allowing update for admin fix
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
        afterChange: [emitPointsEarned],
    },
    fields: [
        tenantField,
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
        { name: 'points', type: 'number', required: true },
        { name: 'reason', type: 'text', required: true },
        {
            name: 'sourceType',
            type: 'select',
            required: true,
            options: [
                { label: 'Lesson', value: 'lesson' },
                { label: 'Resource', value: 'resource' },
                { label: 'Badge', value: 'badge' },
                { label: 'Streak', value: 'streak' },
                { label: 'Bonus', value: 'bonus' },
                { label: 'Manual', value: 'manual' },
            ],
        },
        { name: 'sourceId', type: 'text' },
        ...timestampFields,
    ],
}

export const UserStreaks: CollectionConfig = {
    slug: 'user-streaks',
    admin: {
        group: 'Gamification',
    },
    access: {
        read: readOwnTenant,
        create: createWithTenant,
        update: updateOwnTenant,
        delete: deleteOwnTenant,
    },
    hooks: {
        beforeValidate: [injectTenantId, preventTenantChange],
        afterChange: [emitStreakUpdate],
    },
    fields: [
        tenantField,
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
        { name: 'currentStreak', type: 'number', defaultValue: 0 },
        { name: 'longestStreak', type: 'number', defaultValue: 0 },
        { name: 'lastActivityAt', type: 'date' },
        ...timestampFields,
    ],
}
