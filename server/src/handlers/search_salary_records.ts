import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type SearchSalaryRecordsInput, type SalaryRecord } from '../schema';
import { eq, gte, lte, ilike, and, desc, SQL } from 'drizzle-orm';

export async function searchSalaryRecords(input: SearchSalaryRecordsInput): Promise<SalaryRecord[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Job title filter (case-insensitive partial match)
    if (input.job_title) {
      conditions.push(ilike(salaryRecordsTable.job_title, `%${input.job_title}%`));
    }

    // Location filters (exact match)
    if (input.location_country) {
      conditions.push(eq(salaryRecordsTable.location_country, input.location_country));
    }

    if (input.location_city) {
      conditions.push(eq(salaryRecordsTable.location_city, input.location_city));
    }

    // Experience level filter
    if (input.experience_level) {
      conditions.push(eq(salaryRecordsTable.experience_level, input.experience_level));
    }

    // Employment type filter
    if (input.employment_type) {
      conditions.push(eq(salaryRecordsTable.employment_type, input.employment_type));
    }

    // Work arrangement filter
    if (input.work_arrangement) {
      conditions.push(eq(salaryRecordsTable.work_arrangement, input.work_arrangement));
    }

    // Company size filter
    if (input.company_size) {
      conditions.push(eq(salaryRecordsTable.company_size, input.company_size));
    }

    // Salary range filters
    if (input.min_salary !== undefined) {
      conditions.push(gte(salaryRecordsTable.salary_amount, input.min_salary.toString()));
    }

    if (input.max_salary !== undefined) {
      conditions.push(lte(salaryRecordsTable.salary_amount, input.max_salary.toString()));
    }

    // Currency filter
    if (input.salary_currency) {
      conditions.push(eq(salaryRecordsTable.salary_currency, input.salary_currency));
    }

    // Tech stack filter (partial match in JSON array stored as text)
    if (input.tech_stack) {
      conditions.push(ilike(salaryRecordsTable.tech_stack, `%${input.tech_stack}%`));
    }

    // Experience range filters
    if (input.min_experience !== undefined) {
      conditions.push(gte(salaryRecordsTable.years_of_experience, input.min_experience));
    }

    if (input.max_experience !== undefined) {
      conditions.push(lte(salaryRecordsTable.years_of_experience, input.max_experience));
    }

    // Verified only filter
    if (input.verified_only === true) {
      conditions.push(eq(salaryRecordsTable.is_verified, true));
    }

    // Build query with conditional where clause
    const baseQuery = db.select().from(salaryRecordsTable);
    
    const results = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(salaryRecordsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
          .execute()
      : await baseQuery
          .orderBy(desc(salaryRecordsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
          .execute();

    // Convert numeric fields back to numbers
    return results.map(record => ({
      ...record,
      salary_amount: parseFloat(record.salary_amount),
      bonus_amount: record.bonus_amount ? parseFloat(record.bonus_amount) : null
    }));
  } catch (error) {
    console.error('Salary records search failed:', error);
    throw error;
  }
}