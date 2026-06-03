import type { CollectionBeforeValidateHook } from 'payload';

type StaffType = 'profesor' | 'academico' | 'administrativo' | 'jefatura_administracion';

type RelationValue = string | number | { id?: string | number | null } | null | undefined;

type StaffHookData = {
  staff_type?: StaffType | null;
  qualified_areas?: RelationValue[] | RelationValue | null;
};

function isTeachingStaffType(staffType?: string | null): boolean {
  return staffType === 'profesor' || staffType === 'academico';
}

function relationIds(value: RelationValue[] | RelationValue | null | undefined): Array<string | number> {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return item;
      if (item && typeof item === 'object' && item.id != null) return item.id;
      return null;
    })
    .filter((item): item is string | number => item != null && item !== '');
}

/**
 * A teaching staff profile is not operational without at least one enabled area.
 * Enforce this at collection level so admin UI, API routes, imports and scripts
 * cannot create future unassignable teachers.
 */
export const validateTeachingAreas: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const incoming = (data ?? {}) as StaffHookData;
  const existing = (originalDoc ?? {}) as StaffHookData;
  const staffType = incoming.staff_type ?? existing.staff_type;
  const qualifiedAreas = incoming.qualified_areas !== undefined
    ? incoming.qualified_areas
    : existing.qualified_areas;

  if (isTeachingStaffType(staffType) && relationIds(qualifiedAreas).length === 0) {
    throw new Error('Selecciona al menos un área habilitada para guardar una ficha docente.');
  }

  return data;
};
