import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { sql, eq, isNotNull } from 'drizzle-orm';

export async function getUniqueJobTitles(): Promise<string[]> {
  try {
    const result = await db
      .selectDistinct({ job_title: salaryRecordsTable.job_title })
      .from(salaryRecordsTable)
      .orderBy(salaryRecordsTable.job_title)
      .execute();

    return result.map(row => row.job_title);
  } catch (error) {
    console.error('Failed to fetch unique job titles:', error);
    throw error;
  }
}

export async function getUniqueCountries(): Promise<string[]> {
  try {
    const result = await db
      .selectDistinct({ location_country: salaryRecordsTable.location_country })
      .from(salaryRecordsTable)
      .orderBy(salaryRecordsTable.location_country)
      .execute();

    return result.map(row => row.location_country);
  } catch (error) {
    console.error('Failed to fetch unique countries:', error);
    throw error;
  }
}

export async function getUniqueCities(country?: string): Promise<string[]> {
  try {
    // Build the base query
    const baseQuery = db
      .selectDistinct({ location_city: salaryRecordsTable.location_city })
      .from(salaryRecordsTable);

    // Execute with or without country filter
    const result = country
      ? await baseQuery
          .where(eq(salaryRecordsTable.location_country, country))
          .orderBy(salaryRecordsTable.location_city)
          .execute()
      : await baseQuery
          .orderBy(salaryRecordsTable.location_city)
          .execute();

    return result.map(row => row.location_city);
  } catch (error) {
    console.error('Failed to fetch unique cities:', error);
    throw error;
  }
}

export async function getUniqueTechnologies(): Promise<string[]> {
  try {
    // Get all non-null tech_stack entries
    const result = await db
      .select({ tech_stack: salaryRecordsTable.tech_stack })
      .from(salaryRecordsTable)
      .where(isNotNull(salaryRecordsTable.tech_stack))
      .execute();

    // Extract unique technologies from JSON arrays
    const uniqueTechs = new Set<string>();

    for (const row of result) {
      if (row.tech_stack) {
        try {
          const techArray = JSON.parse(row.tech_stack) as string[];
          if (Array.isArray(techArray)) {
            techArray.forEach(tech => {
              if (typeof tech === 'string' && tech.trim()) {
                uniqueTechs.add(tech.trim());
              }
            });
          }
        } catch (parseError) {
          // Skip invalid JSON entries
          console.warn('Invalid JSON in tech_stack:', row.tech_stack);
        }
      }
    }

    // Convert to sorted array
    return Array.from(uniqueTechs).sort();
  } catch (error) {
    console.error('Failed to fetch unique technologies:', error);
    throw error;
  }
}