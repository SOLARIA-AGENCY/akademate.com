import { queryFirst } from '@/@payload-config/lib/db';

type TableExistsRow = {
  exists: boolean;
};

let lessonProgressTableAvailable: boolean | null = null;

export function resetLessonProgressAvailabilityCache(): void {
  lessonProgressTableAvailable = null;
}

export async function isLessonProgressStorageAvailable(): Promise<boolean> {
  if (lessonProgressTableAvailable !== null) {
    return lessonProgressTableAvailable;
  }

  try {
    const row = await queryFirst<TableExistsRow>(
      `SELECT EXISTS (
         SELECT 1
         FROM information_schema.tables
         WHERE table_schema = 'public'
           AND table_name = 'lesson_progress'
       ) AS "exists"`
    );

    lessonProgressTableAvailable = Boolean(row?.exists);
    return lessonProgressTableAvailable;
  } catch {
    lessonProgressTableAvailable = false;
    return false;
  }
}
