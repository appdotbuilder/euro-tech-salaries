import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type UpdateSalaryRecordInput, type SalaryRecord } from '../schema';
import { eq } from 'drizzle-orm';

export const updateSalaryRecord = async (input: UpdateSalaryRecordInput): Promise<SalaryRecord> => {
  try {
    // First check if the record exists
    const existingRecord = await db.select()
      .from(salaryRecordsTable)
      .where(eq(salaryRecordsTable.id, input.id))
      .execute();

    if (existingRecord.length === 0) {
      throw new Error(`Salary record with id ${input.id} not found`);
    }

    // Prepare update values - only include fields that are provided
    const updateValues: any = {};
    
    if (input.job_title !== undefined) updateValues.job_title = input.job_title;
    if (input.company_name !== undefined) updateValues.company_name = input.company_name;
    if (input.location_country !== undefined) updateValues.location_country = input.location_country;
    if (input.location_city !== undefined) updateValues.location_city = input.location_city;
    if (input.salary_amount !== undefined) updateValues.salary_amount = input.salary_amount.toString();
    if (input.salary_currency !== undefined) updateValues.salary_currency = input.salary_currency;
    if (input.experience_level !== undefined) updateValues.experience_level = input.experience_level;
    if (input.employment_type !== undefined) updateValues.employment_type = input.employment_type;
    if (input.work_arrangement !== undefined) updateValues.work_arrangement = input.work_arrangement;
    if (input.company_size !== undefined) updateValues.company_size = input.company_size;
    if (input.years_of_experience !== undefined) updateValues.years_of_experience = input.years_of_experience;
    if (input.years_at_company !== undefined) updateValues.years_at_company = input.years_at_company;
    if (input.bonus_amount !== undefined) updateValues.bonus_amount = input.bonus_amount !== null ? input.bonus_amount.toString() : null;
    if (input.stock_options !== undefined) updateValues.stock_options = input.stock_options;
    if (input.benefits_description !== undefined) updateValues.benefits_description = input.benefits_description;
    if (input.tech_stack !== undefined) updateValues.tech_stack = input.tech_stack;
    if (input.is_verified !== undefined) updateValues.is_verified = input.is_verified;

    // Update the record
    const result = await db.update(salaryRecordsTable)
      .set(updateValues)
      .where(eq(salaryRecordsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedRecord = result[0];
    return {
      ...updatedRecord,
      salary_amount: parseFloat(updatedRecord.salary_amount),
      bonus_amount: updatedRecord.bonus_amount ? parseFloat(updatedRecord.bonus_amount) : null
    };
  } catch (error) {
    console.error('Salary record update failed:', error);
    throw error;
  }
};