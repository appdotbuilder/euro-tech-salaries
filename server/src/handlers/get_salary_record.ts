import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type SalaryRecord } from '../schema';
import { eq } from 'drizzle-orm';

export async function getSalaryRecord(id: number): Promise<SalaryRecord | null> {
  try {
    // Query the database for the salary record by ID
    const results = await db.select()
      .from(salaryRecordsTable)
      .where(eq(salaryRecordsTable.id, id))
      .limit(1)
      .execute();

    // Return null if no record found
    if (results.length === 0) {
      return null;
    }

    const record = results[0];

    // Convert numeric fields back to numbers for the response
    return {
      ...record,
      salary_amount: parseFloat(record.salary_amount),
      bonus_amount: record.bonus_amount ? parseFloat(record.bonus_amount) : null
    };
  } catch (error) {
    console.error('Failed to get salary record:', error);
    throw error;
  }
}