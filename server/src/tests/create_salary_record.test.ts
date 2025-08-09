import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type CreateSalaryRecordInput } from '../schema';
import { createSalaryRecord } from '../handlers/create_salary_record';
import { eq } from 'drizzle-orm';

// Complete test input with all required fields
const testInput: CreateSalaryRecordInput = {
  job_title: 'Senior Software Engineer',
  company_name: 'Tech Corp',
  location_country: 'United States',
  location_city: 'San Francisco',
  salary_amount: 150000.50,
  salary_currency: 'USD',
  experience_level: 'senior',
  employment_type: 'full_time',
  work_arrangement: 'remote',
  company_size: 'large',
  years_of_experience: 8,
  years_at_company: 2,
  bonus_amount: 25000.75,
  stock_options: true,
  benefits_description: 'Health, dental, 401k, unlimited PTO',
  tech_stack: '["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL"]'
};

// Minimal test input with only required fields
const minimalInput: CreateSalaryRecordInput = {
  job_title: 'Junior Developer',
  company_name: null,
  location_country: 'Germany',
  location_city: 'Berlin',
  salary_amount: 45000,
  salary_currency: 'EUR',
  experience_level: 'junior',
  employment_type: 'full_time',
  work_arrangement: 'hybrid',
  company_size: null,
  years_of_experience: 1,
  years_at_company: null,
  bonus_amount: null,
  stock_options: false,
  benefits_description: null,
  tech_stack: null
};

describe('createSalaryRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a salary record with all fields', async () => {
    const result = await createSalaryRecord(testInput);

    // Verify all input fields are preserved
    expect(result.job_title).toEqual('Senior Software Engineer');
    expect(result.company_name).toEqual('Tech Corp');
    expect(result.location_country).toEqual('United States');
    expect(result.location_city).toEqual('San Francisco');
    expect(result.salary_amount).toEqual(150000.50);
    expect(typeof result.salary_amount).toEqual('number');
    expect(result.salary_currency).toEqual('USD');
    expect(result.experience_level).toEqual('senior');
    expect(result.employment_type).toEqual('full_time');
    expect(result.work_arrangement).toEqual('remote');
    expect(result.company_size).toEqual('large');
    expect(result.years_of_experience).toEqual(8);
    expect(result.years_at_company).toEqual(2);
    expect(result.bonus_amount).toEqual(25000.75);
    expect(typeof result.bonus_amount).toEqual('number');
    expect(result.stock_options).toEqual(true);
    expect(result.benefits_description).toEqual('Health, dental, 401k, unlimited PTO');
    expect(result.tech_stack).toEqual('["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL"]');

    // Verify system-generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.is_verified).toEqual(false); // New records start unverified
    expect(result.submission_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a salary record with minimal fields', async () => {
    const result = await createSalaryRecord(minimalInput);

    // Verify required fields
    expect(result.job_title).toEqual('Junior Developer');
    expect(result.company_name).toBeNull();
    expect(result.location_country).toEqual('Germany');
    expect(result.location_city).toEqual('Berlin');
    expect(result.salary_amount).toEqual(45000);
    expect(result.salary_currency).toEqual('EUR');
    expect(result.experience_level).toEqual('junior');
    expect(result.employment_type).toEqual('full_time');
    expect(result.work_arrangement).toEqual('hybrid');
    expect(result.company_size).toBeNull();
    expect(result.years_of_experience).toEqual(1);
    expect(result.years_at_company).toBeNull();
    expect(result.bonus_amount).toBeNull();
    expect(result.stock_options).toEqual(false);
    expect(result.benefits_description).toBeNull();
    expect(result.tech_stack).toBeNull();

    // Verify system fields
    expect(result.id).toBeDefined();
    expect(result.is_verified).toEqual(false);
    expect(result.submission_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save salary record to database correctly', async () => {
    const result = await createSalaryRecord(testInput);

    // Query the database to verify the record was saved
    const savedRecords = await db.select()
      .from(salaryRecordsTable)
      .where(eq(salaryRecordsTable.id, result.id))
      .execute();

    expect(savedRecords).toHaveLength(1);
    const savedRecord = savedRecords[0];

    // Verify database stored values correctly
    expect(savedRecord.job_title).toEqual('Senior Software Engineer');
    expect(savedRecord.company_name).toEqual('Tech Corp');
    expect(savedRecord.location_country).toEqual('United States');
    expect(savedRecord.location_city).toEqual('San Francisco');
    expect(parseFloat(savedRecord.salary_amount)).toEqual(150000.50); // Numeric field stored as string
    expect(savedRecord.salary_currency).toEqual('USD');
    expect(savedRecord.experience_level).toEqual('senior');
    expect(savedRecord.employment_type).toEqual('full_time');
    expect(savedRecord.work_arrangement).toEqual('remote');
    expect(savedRecord.company_size).toEqual('large');
    expect(savedRecord.years_of_experience).toEqual(8);
    expect(savedRecord.years_at_company).toEqual(2);
    expect(parseFloat(savedRecord.bonus_amount!)).toEqual(25000.75); // Numeric field stored as string
    expect(savedRecord.stock_options).toEqual(true);
    expect(savedRecord.benefits_description).toEqual('Health, dental, 401k, unlimited PTO');
    expect(savedRecord.tech_stack).toEqual('["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL"]');
    expect(savedRecord.is_verified).toEqual(false);
    expect(savedRecord.submission_date).toBeInstanceOf(Date);
    expect(savedRecord.created_at).toBeInstanceOf(Date);
  });

  it('should handle zero bonus amount correctly', async () => {
    const inputWithZeroBonus: CreateSalaryRecordInput = {
      ...minimalInput,
      bonus_amount: 0
    };

    const result = await createSalaryRecord(inputWithZeroBonus);

    expect(result.bonus_amount).toEqual(0);
    expect(typeof result.bonus_amount).toEqual('number');

    // Verify in database
    const savedRecords = await db.select()
      .from(salaryRecordsTable)
      .where(eq(salaryRecordsTable.id, result.id))
      .execute();

    expect(parseFloat(savedRecords[0].bonus_amount!)).toEqual(0);
  });

  it('should handle fractional salary amounts correctly', async () => {
    const inputWithFractionalSalary: CreateSalaryRecordInput = {
      ...minimalInput,
      salary_amount: 75500.99
    };

    const result = await createSalaryRecord(inputWithFractionalSalary);

    expect(result.salary_amount).toEqual(75500.99);
    expect(typeof result.salary_amount).toEqual('number');

    // Verify precision is maintained in database
    const savedRecords = await db.select()
      .from(salaryRecordsTable)
      .where(eq(salaryRecordsTable.id, result.id))
      .execute();

    expect(parseFloat(savedRecords[0].salary_amount)).toEqual(75500.99);
  });

  it('should create multiple records with unique IDs', async () => {
    const result1 = await createSalaryRecord(testInput);
    const result2 = await createSalaryRecord(minimalInput);

    // Verify different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toBeGreaterThan(0);
    expect(result2.id).toBeGreaterThan(0);

    // Verify both records exist in database
    const allRecords = await db.select().from(salaryRecordsTable).execute();
    expect(allRecords).toHaveLength(2);
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    const result = await createSalaryRecord(testInput);
    const afterCreation = new Date();

    // Verify timestamps are within reasonable range
    expect(result.submission_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.submission_date.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.submission_date.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});