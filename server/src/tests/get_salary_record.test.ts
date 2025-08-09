import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type CreateSalaryRecordInput } from '../schema';
import { getSalaryRecord } from '../handlers/get_salary_record';

// Test input for creating salary records
const testSalaryRecord: CreateSalaryRecordInput = {
  job_title: 'Software Engineer',
  company_name: 'Tech Corp',
  location_country: 'USA',
  location_city: 'San Francisco',
  salary_amount: 120000.50,
  salary_currency: 'USD',
  experience_level: 'senior',
  employment_type: 'full_time',
  work_arrangement: 'remote',
  company_size: 'large',
  years_of_experience: 8,
  years_at_company: 3,
  bonus_amount: 15000.75,
  stock_options: true,
  benefits_description: 'Health, dental, 401k',
  tech_stack: '["JavaScript", "React", "Node.js"]'
};

describe('getSalaryRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return salary record when it exists', async () => {
    // Create a salary record first
    const insertResult = await db.insert(salaryRecordsTable)
      .values({
        job_title: testSalaryRecord.job_title,
        company_name: testSalaryRecord.company_name,
        location_country: testSalaryRecord.location_country,
        location_city: testSalaryRecord.location_city,
        salary_amount: testSalaryRecord.salary_amount.toString(),
        salary_currency: testSalaryRecord.salary_currency,
        experience_level: testSalaryRecord.experience_level,
        employment_type: testSalaryRecord.employment_type,
        work_arrangement: testSalaryRecord.work_arrangement,
        company_size: testSalaryRecord.company_size,
        years_of_experience: testSalaryRecord.years_of_experience,
        years_at_company: testSalaryRecord.years_at_company,
        bonus_amount: testSalaryRecord.bonus_amount?.toString(),
        stock_options: testSalaryRecord.stock_options,
        benefits_description: testSalaryRecord.benefits_description,
        tech_stack: testSalaryRecord.tech_stack
      })
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Get the salary record
    const result = await getSalaryRecord(createdId);

    // Verify the record is returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdId);
    expect(result!.job_title).toBe('Software Engineer');
    expect(result!.company_name).toBe('Tech Corp');
    expect(result!.location_country).toBe('USA');
    expect(result!.location_city).toBe('San Francisco');
    expect(result!.salary_amount).toBe(120000.50);
    expect(typeof result!.salary_amount).toBe('number');
    expect(result!.salary_currency).toBe('USD');
    expect(result!.experience_level).toBe('senior');
    expect(result!.employment_type).toBe('full_time');
    expect(result!.work_arrangement).toBe('remote');
    expect(result!.company_size).toBe('large');
    expect(result!.years_of_experience).toBe(8);
    expect(result!.years_at_company).toBe(3);
    expect(result!.bonus_amount).toBe(15000.75);
    expect(typeof result!.bonus_amount).toBe('number');
    expect(result!.stock_options).toBe(true);
    expect(result!.benefits_description).toBe('Health, dental, 401k');
    expect(result!.tech_stack).toBe('["JavaScript", "React", "Node.js"]');
    expect(result!.is_verified).toBe(false);
    expect(result!.submission_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when record does not exist', async () => {
    const result = await getSalaryRecord(99999);

    expect(result).toBeNull();
  });

  it('should handle record with nullable fields', async () => {
    // Create a salary record with minimal required fields
    const minimalRecord = {
      job_title: 'Junior Developer',
      company_name: null,
      location_country: 'Canada',
      location_city: 'Toronto',
      salary_amount: '60000.00',
      salary_currency: 'USD' as const,
      experience_level: 'junior' as const,
      employment_type: 'full_time' as const,
      work_arrangement: 'onsite' as const,
      company_size: null,
      years_of_experience: 2,
      years_at_company: null,
      bonus_amount: null,
      stock_options: false,
      benefits_description: null,
      tech_stack: null
    };

    const insertResult = await db.insert(salaryRecordsTable)
      .values(minimalRecord)
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Get the salary record
    const result = await getSalaryRecord(createdId);

    // Verify the record with null fields
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdId);
    expect(result!.job_title).toBe('Junior Developer');
    expect(result!.company_name).toBeNull();
    expect(result!.location_country).toBe('Canada');
    expect(result!.location_city).toBe('Toronto');
    expect(result!.salary_amount).toBe(60000);
    expect(typeof result!.salary_amount).toBe('number');
    expect(result!.salary_currency).toBe('USD');
    expect(result!.experience_level).toBe('junior');
    expect(result!.employment_type).toBe('full_time');
    expect(result!.work_arrangement).toBe('onsite');
    expect(result!.company_size).toBeNull();
    expect(result!.years_of_experience).toBe(2);
    expect(result!.years_at_company).toBeNull();
    expect(result!.bonus_amount).toBeNull();
    expect(result!.stock_options).toBe(false);
    expect(result!.benefits_description).toBeNull();
    expect(result!.tech_stack).toBeNull();
    expect(result!.is_verified).toBe(false);
    expect(result!.submission_date).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should handle zero bonus amount correctly', async () => {
    // Create a record with zero bonus
    const recordWithZeroBonus = {
      job_title: 'Data Scientist',
      company_name: 'Analytics Inc',
      location_country: 'UK',
      location_city: 'London',
      salary_amount: '85000.00',
      salary_currency: 'GBP' as const,
      experience_level: 'mid' as const,
      employment_type: 'full_time' as const,
      work_arrangement: 'hybrid' as const,
      company_size: 'medium' as const,
      years_of_experience: 5,
      years_at_company: 2,
      bonus_amount: '0.00',
      stock_options: false,
      benefits_description: 'Standard package',
      tech_stack: '["Python", "SQL", "Tableau"]'
    };

    const insertResult = await db.insert(salaryRecordsTable)
      .values(recordWithZeroBonus)
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Get the salary record
    const result = await getSalaryRecord(createdId);

    // Verify zero bonus is handled correctly
    expect(result).not.toBeNull();
    expect(result!.bonus_amount).toBe(0);
    expect(typeof result!.bonus_amount).toBe('number');
  });

  it('should validate numeric type conversions', async () => {
    // Create a record with decimal values
    const decimalRecord = {
      job_title: 'DevOps Engineer',
      company_name: 'Cloud Systems',
      location_country: 'Germany',
      location_city: 'Berlin',
      salary_amount: '75500.99',
      salary_currency: 'EUR' as const,
      experience_level: 'senior' as const,
      employment_type: 'contract' as const,
      work_arrangement: 'remote' as const,
      company_size: 'startup' as const,
      years_of_experience: 6,
      years_at_company: 1,
      bonus_amount: '2500.25',
      stock_options: true,
      benefits_description: 'Flexible hours',
      tech_stack: '["Docker", "Kubernetes", "AWS"]'
    };

    const insertResult = await db.insert(salaryRecordsTable)
      .values(decimalRecord)
      .returning()
      .execute();

    const createdId = insertResult[0].id;

    // Get the salary record
    const result = await getSalaryRecord(createdId);

    // Verify numeric conversions preserve decimals
    expect(result).not.toBeNull();
    expect(result!.salary_amount).toBe(75500.99);
    expect(result!.bonus_amount).toBe(2500.25);
    expect(typeof result!.salary_amount).toBe('number');
    expect(typeof result!.bonus_amount).toBe('number');
  });
});