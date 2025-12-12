/**
 * @module @akademate/catalog/__tests__/slugify
 * Tests for slug generation utilities
 */

import { describe, it, expect } from 'vitest'
import { slugify, generateUniqueSlug, isValidSlug } from '../src/index.js'

describe('Slugify Utilities', () => {
  describe('slugify', () => {
    it('should convert to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world')
    })

    it('should replace spaces with hyphens', () => {
      expect(slugify('multiple words here')).toBe('multiple-words-here')
    })

    it('should remove special characters', () => {
      expect(slugify('Hello! @World#')).toBe('hello-world')
    })

    it('should normalize accented characters', () => {
      expect(slugify('Técnicas de Comunicación')).toBe('tecnicas-de-comunicacion')
    })

    it('should handle Spanish accents', () => {
      expect(slugify('Gestión Administrativa')).toBe('gestion-administrativa')
      expect(slugify('Educación Infantil')).toBe('educacion-infantil')
      expect(slugify('Diseño y Moda')).toBe('diseno-y-moda')
    })

    it('should collapse multiple hyphens', () => {
      expect(slugify('hello   world')).toBe('hello-world')
      expect(slugify('hello---world')).toBe('hello-world')
    })

    it('should trim hyphens from edges', () => {
      expect(slugify(' hello world ')).toBe('hello-world')
      expect(slugify('-hello-world-')).toBe('hello-world')
    })

    it('should handle empty strings', () => {
      expect(slugify('')).toBe('')
    })

    it('should handle strings with only special chars', () => {
      expect(slugify('!@#$%')).toBe('')
    })

    it('should preserve numbers', () => {
      expect(slugify('Curso 2025')).toBe('curso-2025')
      expect(slugify('DAW 1')).toBe('daw-1')
    })

    it('should handle underscores', () => {
      expect(slugify('hello_world')).toBe('hello-world')
    })
  })

  describe('generateUniqueSlug', () => {
    it('should return base slug if unique', async () => {
      const checkExists = async () => false
      const slug = await generateUniqueSlug('Hello World', checkExists)
      expect(slug).toBe('hello-world')
    })

    it('should append counter if slug exists', async () => {
      let callCount = 0
      const checkExists = async (slug: string) => {
        callCount++
        return slug === 'hello-world' // Only first slug exists
      }
      const slug = await generateUniqueSlug('Hello World', checkExists)
      expect(slug).toBe('hello-world-1')
      expect(callCount).toBe(2)
    })

    it('should increment counter until unique', async () => {
      const existingSlugs = new Set(['curso', 'curso-1', 'curso-2', 'curso-3'])
      const checkExists = async (slug: string) => existingSlugs.has(slug)
      const slug = await generateUniqueSlug('Curso', checkExists)
      expect(slug).toBe('curso-4')
    })

    it('should throw error after 100 attempts', async () => {
      const checkExists = async () => true // Always exists
      await expect(generateUniqueSlug('test', checkExists))
        .rejects.toThrow('Unable to generate unique slug after 100 attempts')
    })
  })

  describe('isValidSlug', () => {
    it('should accept valid slugs', () => {
      expect(isValidSlug('hello-world')).toBe(true)
      expect(isValidSlug('curso-2025')).toBe(true)
      expect(isValidSlug('gestion-administrativa')).toBe(true)
      expect(isValidSlug('daw1')).toBe(true)
    })

    it('should reject slugs with uppercase', () => {
      expect(isValidSlug('Hello-World')).toBe(false)
    })

    it('should reject slugs with special characters', () => {
      expect(isValidSlug('hello_world')).toBe(false)
      expect(isValidSlug('hello.world')).toBe(false)
      expect(isValidSlug('hello@world')).toBe(false)
    })

    it('should reject slugs starting with hyphen', () => {
      expect(isValidSlug('-hello')).toBe(false)
    })

    it('should reject slugs ending with hyphen', () => {
      expect(isValidSlug('hello-')).toBe(false)
    })

    it('should reject slugs with consecutive hyphens', () => {
      expect(isValidSlug('hello--world')).toBe(false)
    })

    it('should reject empty strings', () => {
      expect(isValidSlug('')).toBe(false)
    })

    it('should accept single word slugs', () => {
      expect(isValidSlug('curso')).toBe(true)
      expect(isValidSlug('daw')).toBe(true)
    })
  })
})
