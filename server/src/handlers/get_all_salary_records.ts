import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type SalaryRecord } from '../schema';

export const getAllSalaryRecords = async (): Promise<SalaryRecord[]> => {
  try {
    const results = await db.select()
      .from(salaryRecordsTable)
      .execute();

    // Convert numeric fields from strings to numbers
    return results.map(record => ({
      ...record,
      salary_amount: parseFloat(record.salary_amount),
      bonus_amount: record.bonus_amount ? parseFloat(record.bonus_amount) : null
    }));
  } catch (error) {
    console.error('Failed to fetch all salary records:', error);
    throw error;
  }
};