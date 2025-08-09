import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type LocationStatsInput, type LocationStatsResponse } from '../schema';
import { eq, and, sql, SQL } from 'drizzle-orm';

export async function getLocationStats(input: LocationStatsInput): Promise<LocationStatsResponse[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input.country) {
      conditions.push(eq(salaryRecordsTable.location_country, input.country));
    }

    if (input.job_title) {
      conditions.push(sql`LOWER(${salaryRecordsTable.job_title}) LIKE LOWER(${'%' + input.job_title + '%'})`);
    }

    if (input.experience_level) {
      conditions.push(eq(salaryRecordsTable.experience_level, input.experience_level));
    }

    // Build the main aggregation query based on whether filters exist
    const baseQuery = db
      .select({
        country: salaryRecordsTable.location_country,
        city: salaryRecordsTable.location_city,
        average_salary: sql<string>`AVG(${salaryRecordsTable.salary_amount})`.as('average_salary'),
        median_salary: sql<string>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${salaryRecordsTable.salary_amount})`.as('median_salary'),
        count: sql<string>`COUNT(*)`.as('count') // COUNT returns string in PostgreSQL
      })
      .from(salaryRecordsTable);

    // Execute query with or without conditions
    const mainResults = conditions.length > 0
      ? await baseQuery
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .groupBy(salaryRecordsTable.location_country, salaryRecordsTable.location_city)
          .orderBy(sql`AVG(${salaryRecordsTable.salary_amount}) DESC`)
          .execute()
      : await baseQuery
          .groupBy(salaryRecordsTable.location_country, salaryRecordsTable.location_city)
          .orderBy(sql`AVG(${salaryRecordsTable.salary_amount}) DESC`)
          .execute();

    // For each location, get currency distribution
    const resultsWithCurrency: LocationStatsResponse[] = [];

    for (const result of mainResults) {
      // Build currency distribution query for this specific location
      const currencyConditions: SQL<unknown>[] = [
        eq(salaryRecordsTable.location_country, result.country),
        eq(salaryRecordsTable.location_city, result.city)
      ];

      if (input.job_title) {
        currencyConditions.push(sql`LOWER(${salaryRecordsTable.job_title}) LIKE LOWER(${'%' + input.job_title + '%'})`);
      }

      if (input.experience_level) {
        currencyConditions.push(eq(salaryRecordsTable.experience_level, input.experience_level));
      }

      if (input.country) {
        currencyConditions.push(eq(salaryRecordsTable.location_country, input.country));
      }

      const currencyResults = await db
        .select({
          currency: salaryRecordsTable.salary_currency,
          count: sql<string>`COUNT(*)`.as('count') // COUNT returns string
        })
        .from(salaryRecordsTable)
        .where(and(...currencyConditions))
        .groupBy(salaryRecordsTable.salary_currency)
        .execute();

      // Build currency distribution object
      const currencyDistribution: Record<string, number> = {};
      currencyResults.forEach((curr: { currency: string; count: string }) => {
        currencyDistribution[curr.currency] = parseInt(curr.count); // Convert string to number
      });

      resultsWithCurrency.push({
        location: `${result.city}, ${result.country}`,
        country: result.country,
        city: result.city,
        average_salary: parseFloat(result.average_salary), // Convert numeric string to number
        median_salary: parseFloat(result.median_salary), // Convert numeric string to number
        count: parseInt(result.count), // Convert COUNT string to number
        currency_distribution: currencyDistribution
      });
    }

    return resultsWithCurrency;
  } catch (error) {
    console.error('Location stats retrieval failed:', error);
    throw error;
  }
}