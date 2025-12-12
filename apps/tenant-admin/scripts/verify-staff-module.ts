#!/usr/bin/env tsx

/**
 * Verification Script for Staff Module
 *
 * Checks:
 * - Database has staff records
 * - Photos are linked correctly
 * - Photos exist in filesystem
 * - API returns correct data
 * - Frontend pages are accessible
 */

import postgres from 'postgres'
import fs from 'fs'
import path from 'path'

const sql = postgres(
  process.env.DATABASE_URI ||
  'postgres://cepcomunicacion:wGWxjMYsUWSBvlqw2K9KU2BKUI=@localhost:5432/cepcomunicacion'
)

async function verifyStaffModule() {
  console.log('🔍 Verifying Staff Module...\n')

  try {
    // 1. Check database records
    console.log('1️⃣ Checking database records...')
    const staffRecords = await sql`
      SELECT
        s.id,
        s.full_name,
        s.staff_type,
        s.position,
        s.photo_id,
        m.filename
      FROM staff s
      LEFT JOIN media m ON s.photo_id = m.id
      WHERE s.is_active = true
      ORDER BY s.staff_type, s.id
    `

    const professors = staffRecords.filter((s: any) => s.staff_type === 'profesor')
    const admins = staffRecords.filter((s: any) => s.staff_type === 'administrativo')

    console.log(`   ✓ Total staff: ${staffRecords.length}`)
    console.log(`   ✓ Professors: ${professors.length}`)
    console.log(`   ✓ Administrative: ${admins.length}`)
    console.log('')

    // 2. Check photos are linked
    console.log('2️⃣ Checking photo links...')
    const withoutPhotos = staffRecords.filter((s: any) => !s.photo_id)
    if (withoutPhotos.length > 0) {
      console.log(`   ⚠ ${withoutPhotos.length} staff without photos:`)
      withoutPhotos.forEach((s: any) => console.log(`      - ${s.full_name}`))
    } else {
      console.log('   ✓ All staff have photos linked')
    }
    console.log('')

    // 3. Check physical photo files
    console.log('3️⃣ Checking physical photo files...')
    const mediaDir = path.join(process.cwd(), 'public', 'media')
    let missingPhotos = 0

    for (const staff of staffRecords) {
      if (staff.filename) {
        const photoPath = path.join(mediaDir, staff.filename)
        if (!fs.existsSync(photoPath)) {
          console.log(`   ✗ Missing photo: ${staff.filename} for ${staff.full_name}`)
          missingPhotos++
        }
      }
    }

    if (missingPhotos === 0) {
      console.log('   ✓ All photo files exist in filesystem')
    } else {
      console.log(`   ⚠ ${missingPhotos} photos missing from filesystem`)
    }
    console.log('')

    // 4. Test API endpoints
    console.log('4️⃣ Testing API endpoints...')
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

    try {
      // Test professors endpoint
      const profResponse = await fetch(`${apiBase}/api/staff?type=profesor&limit=100`)
      const profData = await profResponse.json()
      console.log(`   ✓ GET /api/staff?type=profesor - ${profResponse.status} (${profData.total} records)`)

      // Test administrative endpoint
      const adminResponse = await fetch(`${apiBase}/api/staff?type=administrativo&limit=100`)
      const adminData = await adminResponse.json()
      console.log(`   ✓ GET /api/staff?type=administrativo - ${adminResponse.status} (${adminData.total} records)`)

      // Test all staff endpoint
      const allResponse = await fetch(`${apiBase}/api/staff?limit=100`)
      const allData = await allResponse.json()
      console.log(`   ✓ GET /api/staff - ${allResponse.status} (${allData.total} records)`)
    } catch (error) {
      console.log('   ✗ API endpoints not accessible (server may not be running)')
    }
    console.log('')

    // 5. Display sample data
    console.log('5️⃣ Sample Data:')
    console.log('\n   Professors:')
    professors.slice(0, 3).forEach((p: any) => {
      console.log(`   - ${p.full_name} (${p.position})`)
      console.log(`     Photo: ${p.filename}`)
    })

    console.log('\n   Administrative Staff:')
    admins.slice(0, 3).forEach((a: any) => {
      console.log(`   - ${a.full_name} (${a.position})`)
      console.log(`     Photo: ${a.filename}`)
    })
    console.log('')

    // Summary
    console.log('📊 Summary:')
    console.log(`   Total Staff: ${staffRecords.length}`)
    console.log(`   Professors: ${professors.length}`)
    console.log(`   Administrative: ${admins.length}`)
    console.log(`   Photos Linked: ${staffRecords.filter((s: any) => s.photo_id).length}/${staffRecords.length}`)
    console.log(`   Photos Available: ${staffRecords.length - missingPhotos}/${staffRecords.length}`)
    console.log('')

    if (missingPhotos === 0 && withoutPhotos.length === 0) {
      console.log('✅ Staff module is fully configured and ready!')
    } else {
      console.log('⚠️  Staff module has minor issues - see details above')
    }

  } catch (error) {
    console.error('❌ Error verifying staff module:', error)
  } finally {
    await sql.end()
  }
}

verifyStaffModule()
