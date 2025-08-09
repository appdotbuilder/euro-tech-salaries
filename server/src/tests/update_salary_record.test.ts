import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type UpdateSalaryRecordInput, type CreateSalaryRecordInput } from '../schema';
import { updateSalaryRecord } from '../handlers/update_salary_record';
import { eq } from 'drizzle-orm';

// Helper function to create a test salary record
const createTestRecord = async (): Promise<number> => {
  const testInput: CreateSalaryRecordInput = {
    job_title: 'Software Developer',
    company_name: 'Tech Corp',
    location_country: 'United States',
    location_city: 'San Francisco',
    salary_amount: 120000,
    salary_currency: 'USD',
    experience_level: 'mid',
    employment_type: 'full_time',
    work_arrangement: 'hybrid',
    company_size: 'medium',
    years_of_experience: 5,
    years_at_company: 2,
    bonus_amount: 15000,
    stock_options: true,
    benefits_description: 'Health, dental, vision',
    tech_stack: '["React", "Node.js", "PostgreSQL"]'
  };

  const result = await db.insert(salaryRecordsTable)
    .values({
      ...testInput,
      salary_amount: testInput.salary_amount.toString(),
      bonus_amount: testInput.bonus_amount?.toString()
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateSalaryRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a salary record with all fields', async () => {
    // Create a test record first
    const recordId = await createTestRecord();

    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      job_title: 'Senior Software Engineer',
      company_name: 'New Tech Corp',
      location_country: 'Canada',
      location_city: 'Toronto',
      salary_amount: 150000,
      salary_currency: 'USD',
      experience_level: 'senior',
      employment_type: 'full_time',
      work_arrangement: 'remote',
      company_size: 'large',
      years_of_experience: 8,
      years_at_company: 3,
      bonus_amount: 25000,
      stock_options: true,
      benefits_description: 'Full benefits package',
      tech_stack: '["React", "TypeScript", "AWS"]',
      is_verified: true
    };

    const result = await updateSalaryRecord(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(recordId);
    expect(result.job_title).toEqual('Senior Software Engineer');
    expect(result.company_name).toEqual('New Tech Corp');
    expect(result.location_country).toEqual('Canada');
    expect(result.location_city).toEqual('Toronto');
    expect(result.salary_amount).toEqual(150000);
    expect(typeof result.salary_amount).toEqual('number');
    expect(result.salary_currency).toEqual('USD');
    expect(result.experience_level).toEqual('senior');
    expect(result.employment_type).toEqual('full_time');
    expect(result.work_arrangement).toEqual('remote');
    expect(result.company_size).toEqual('large');
    expect(result.years_of_experience).toEqual(8);
    expect(result.years_at_company).toEqual(3);
    expect(result.bonus_amount).toEqual(25000);
    expect(typeof result.bonus_amount).toEqual('number');
    expect(result.stock_options).toEqual(true);
    expect(result.benefits_description).toEqual('Full benefits package');
    expect(result.tech_stack).toEqual('["React", "TypeScript", "AWS"]');
    expect(result.is_verified).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.submission_date).toBeInstanceOf(Date);
  });

  it('should update record in database', async () => {
    const recordId = await createTestRecord();

    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      job_title: 'Updated Title',
      salary_amount: 200000,
      is_verified: true
    };

    await updateSalaryRecord(updateInput);

    // Verify the record was updated in database
    const records = await db.select()
      .from(salaryRecordsTable)
      .where(eq(salaryRecordsTable.id, recordId))
      .execute();

    expect(records).toHaveLength(1);
    const record = records[0];
    expect(record.job_title).toEqual('Updated Title');
    expect(parseFloat(record.salary_amount)).toEqual(200000);
    expect(record.is_verified).toEqual(true);
  });

  it('should perform partial updates', async () => {
    const recordId = await createTestRecord();

    // Update only job_title and salary_amount
    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      job_title: 'Lead Developer',
      salary_amount: 180000
    };

    const result = await updateSalaryRecord(updateInput);

    // Verify updated fields
    expect(result.job_title).toEqual('Lead Developer');
    expect(result.salary_amount).toEqual(180000);
    
    // Verify unchanged fields remain the same
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.location_country).toEqual('United States');
    expect(result.experience_level).toEqual('mid');
    expect(result.years_of_experience).toEqual(5);
  });

  it('should handle nullable fields correctly', async () => {
    const recordId = await createTestRecord();

    // Set nullable fields to null
    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      company_name: null,
      bonus_amount: null,
      years_at_company: null,
      benefits_description: null,
      tech_stack: null,
      company_size: null
    };

    const result = await updateSalaryRecord(updateInput);

    expect(result.company_name).toBeNull();
    expect(result.bonus_amount).toBeNull();
    expect(result.years_at_company).toBeNull();
    expect(result.benefits_description).toBeNull();
    expect(result.tech_stack).toBeNull();
    expect(result.company_size).toBeNull();
  });

  it('should handle numeric conversions correctly', async () => {
    const recordId = await createTestRecord();

    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      salary_amount: 99999.99,
      bonus_amount: 5000.50
    };

    const result = await updateSalaryRecord(updateInput);

    expect(result.salary_amount).toEqual(99999.99);
    expect(typeof result.salary_amount).toEqual('number');
    expect(result.bonus_amount).toEqual(5000.50);
    expect(typeof result.bonus_amount).toEqual('number');
  });

  it('should throw error when record does not exist', async () => {
    const updateInput: UpdateSalaryRecordInput = {
      id: 99999,
      job_title: 'Non-existent Record'
    };

    await expect(updateSalaryRecord(updateInput))
      .rejects
      .toThrow(/Salary record with id 99999 not found/i);
  });

  it('should handle updates with zero values', async () => {
    const recordId = await createTestRecord();

    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      years_of_experience: 0,
      years_at_company: 0,
      bonus_amount: 0
    };

    const result = await updateSalaryRecord(updateInput);

    expect(result.years_of_experience).toEqual(0);
    expect(result.years_at_company).toEqual(0);
    expect(result.bonus_amount).toEqual(0);
  });

  it('should handle boolean field updates', async () => {
    const recordId = await createTestRecord();

    // Test setting stock_options to false and is_verified to true
    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      stock_options: false,
      is_verified: true
    };

    const result = await updateSalaryRecord(updateInput);

    expect(result.stock_options).toEqual(false);
    expect(result.is_verified).toEqual(true);
  });

  it('should handle enum field updates', async () => {
    const recordId = await createTestRecord();

    const updateInput: UpdateSalaryRecordInput = {
      id: recordId,
      experience_level: 'principal',
      employment_type: 'contract',
      work_arrangement: 'onsite',
      company_size: 'enterprise',
      salary_currency: 'EUR'
    };

    const result = await updateSalaryRecord(updateInput);

    expect(result.experience_level).toEqual('principal');
    expect(result.employment_type).toEqual('contract');
    expect(result.work_arrangement).toEqual('onsite');
    expect(result.company_size).toEqual('enterprise');
    expect(result.salary_currency).toEqual('EUR');
  });
});