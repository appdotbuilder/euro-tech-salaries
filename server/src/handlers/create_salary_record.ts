import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type CreateSalaryRecordInput, type SalaryRecord } from '../schema';

export const createSalaryRecord = async (input: CreateSalaryRecordInput): Promise<SalaryRecord> => {
  try {
    // Insert salary record into database
    const result = await db.insert(salaryRecordsTable)
      .values({
        job_title: input.job_title,
        company_name: input.company_name,
        location_country: input.location_country,
        location_city: input.location_city,
        salary_amount: input.salary_amount.toString(), // Convert number to string for numeric column
        salary_currency: input.salary_currency,
        experience_level: input.experience_level,
        employment_type: input.employment_type,
        work_arrangement: input.work_arrangement,
        company_size: input.company_size,
        years_of_experience: input.years_of_experience,
        years_at_company: input.years_at_company,
        bonus_amount: input.bonus_amount !== null && input.bonus_amount !== undefined ? input.bonus_amount.toString() : null, // Convert number to string for numeric column
        stock_options: input.stock_options,
        benefits_description: input.benefits_description,
        tech_stack: input.tech_stack,
        // submission_date and created_at will use database defaults
        is_verified: false // New submissions start unverified
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const salaryRecord = result[0];
    return {
      ...salaryRecord,
      salary_amount: parseFloat(salaryRecord.salary_amount), // Convert string back to number
      bonus_amount: salaryRecord.bonus_amount !== null ? parseFloat(salaryRecord.bonus_amount) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Salary record creation failed:', error);
    throw error;
  }
};