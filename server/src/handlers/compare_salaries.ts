import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type CompareSalariesInput, type SalaryRecord } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const compareSalaries = async (input: CompareSalariesInput): Promise<SalaryRecord[]> => {
  try {
    // Fetch salary records by IDs
    const results = await db.select()
      .from(salaryRecordsTable)
      .where(inArray(salaryRecordsTable.id, input.salary_ids))
      .execute();

    // Convert numeric fields from string to number
    const convertedResults = results.map(record => ({
      ...record,
      salary_amount: parseFloat(record.salary_amount),
      bonus_amount: record.bonus_amount ? parseFloat(record.bonus_amount) : null
    }));

    // Sort results to match the order of input IDs
    const sortedResults = input.salary_ids.map(id => {
      const found = convertedResults.find(record => record.id === id);
      return found;
    }).filter((record): record is SalaryRecord => record !== undefined);

    return sortedResults;
  } catch (error) {
    console.error('Salary comparison failed:', error);
    throw error;
  }
};