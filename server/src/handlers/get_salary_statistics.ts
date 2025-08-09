import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type SalaryStatisticsInput, type SalaryStatisticsResponse } from '../schema';
import { eq, and, ilike, SQL } from 'drizzle-orm';

export const getSalaryStatistics = async (input: SalaryStatisticsInput): Promise<SalaryStatisticsResponse> => {
  try {
    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];

    if (input.job_title) {
      conditions.push(ilike(salaryRecordsTable.job_title, `%${input.job_title}%`));
    }

    if (input.location_country) {
      conditions.push(eq(salaryRecordsTable.location_country, input.location_country));
    }

    if (input.experience_level) {
      conditions.push(eq(salaryRecordsTable.experience_level, input.experience_level));
    }

    if (input.employment_type) {
      conditions.push(eq(salaryRecordsTable.employment_type, input.employment_type));
    }

    // Build and execute query with conditions
    const results = conditions.length === 0
      ? await db.select().from(salaryRecordsTable).execute()
      : await db.select()
          .from(salaryRecordsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute();

    // If no records found, return empty statistics
    if (results.length === 0) {
      return {
        count: 0,
        average_salary: 0,
        median_salary: 0,
        min_salary: 0,
        max_salary: 0,
        percentile_25: 0,
        percentile_75: 0,
        currency_breakdown: {}
      };
    }

    // Convert salary amounts to numbers and sort for statistical calculations
    const salaries = results
      .map(record => parseFloat(record.salary_amount))
      .sort((a, b) => a - b);

    // Calculate basic statistics
    const count = salaries.length;
    const sum = salaries.reduce((acc, salary) => acc + salary, 0);
    const average_salary = sum / count;
    const min_salary = salaries[0];
    const max_salary = salaries[count - 1];

    // Calculate median
    const median_salary = count % 2 === 0
      ? (salaries[Math.floor(count / 2) - 1] + salaries[Math.floor(count / 2)]) / 2
      : salaries[Math.floor(count / 2)];

    // Calculate percentiles
    const percentile25Index = Math.ceil(count * 0.25) - 1;
    const percentile75Index = Math.ceil(count * 0.75) - 1;
    const percentile_25 = salaries[Math.max(0, percentile25Index)];
    const percentile_75 = salaries[Math.min(count - 1, percentile75Index)];

    // Calculate currency breakdown
    const currency_breakdown: Record<string, number> = {};
    results.forEach(record => {
      const currency = record.salary_currency;
      currency_breakdown[currency] = (currency_breakdown[currency] || 0) + 1;
    });

    return {
      count,
      average_salary: Math.round(average_salary * 100) / 100, // Round to 2 decimal places
      median_salary: Math.round(median_salary * 100) / 100,
      min_salary: Math.round(min_salary * 100) / 100,
      max_salary: Math.round(max_salary * 100) / 100,
      percentile_25: Math.round(percentile_25 * 100) / 100,
      percentile_75: Math.round(percentile_75 * 100) / 100,
      currency_breakdown
    };
  } catch (error) {
    console.error('Salary statistics calculation failed:', error);
    throw error;
  }
};