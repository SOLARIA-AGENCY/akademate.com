import { z } from 'zod';

/**
 * Zod Validation Schema for Classrooms Collection
 */

export const classroomSchema = z.object({
  code: z
    .string()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(20, 'El código debe tener menos de 20 caracteres')
    .describe('Código único del aula'),

  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre debe tener menos de 100 caracteres')
    .transform((val) => val.trim())
    .describe('Nombre descriptivo del aula'),

  capacity: z
    .number()
    .int('La capacidad debe ser un número entero')
    .min(1, 'La capacidad debe ser al menos 1')
    .max(500, 'La capacidad no puede superar 500')
    .describe('Capacidad máxima de alumnos'),

  floor: z
    .number()
    .int('La planta debe ser un número entero')
    .min(-5, 'La planta no puede ser inferior a -5')
    .max(50, 'La planta no puede superar 50')
    .optional()
    .nullable()
    .describe('Planta del edificio'),

  resources: z
    .array(z.enum(['projector', 'whiteboard', 'computers', 'lab', 'av', 'ac', 'wifi']))
    .optional()
    .describe('Recursos disponibles en el aula'),

  usage_policy: z
    .enum(['private_only', 'fped_only', 'cycle_only', 'mixed', 'restricted'])
    .default('mixed')
    .describe('Regla operativa para uso del aula'),

  enabled_shifts: z
    .array(z.enum(['morning', 'afternoon', 'evening_extra']))
    .optional()
    .describe('Turnos habilitados para el aula'),

  data_quality_status: z
    .enum(['complete', 'pending_validation'])
    .default('complete')
    .describe('Estado de calidad del dato'),

  is_active: z
    .boolean()
    .default(true)
    .describe('Si el aula está disponible'),

  notes: z
    .string()
    .max(500, 'Las notas deben tener menos de 500 caracteres')
    .optional()
    .nullable()
    .describe('Notas adicionales'),

  operational_notes: z
    .string()
    .max(1000, 'Las notas operativas deben tener menos de 1000 caracteres')
    .optional()
    .nullable()
    .describe('Notas operativas de planificación'),
});

export const classroomCreateSchema = classroomSchema;
export const classroomUpdateSchema = classroomSchema.partial();

export type ClassroomData = z.infer<typeof classroomSchema>;
export type ClassroomCreateData = z.infer<typeof classroomCreateSchema>;
export type ClassroomUpdateData = z.infer<typeof classroomUpdateSchema>;

export function validateClassroom(data: unknown) {
  return classroomSchema.safeParse(data);
}

export function formatValidationErrors(errors: z.ZodError) {
  return errors.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}
