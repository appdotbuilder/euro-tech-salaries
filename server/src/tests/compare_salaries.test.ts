import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type CompareSalariesInput } from '../schema';
import { compareSalaries } from '../handlers/compare_salaries';

// Test data for creating salary records
const testSalaryRecords = [
  {
    job_title: 'Software Engineer',
    company_name: 'Tech Corp A',
    location_country: 'USA',
    location_city: 'San Francisco',
    salary_amount: '120000.00',
    salary_currency: 'USD' as const,
    experience_level: 'mid' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'remote' as const,
    company_size: 'large' as const,
    years_of_experience: 5,
    years_at_company: 2,
    bonus_amount: '10000.00',
    stock_options: true,
    benefits_description: 'Health insurance, 401k',
    tech_stack: '["JavaScript", "React", "Node.js"]',
    is_verified: true
  },
  {
    job_title: 'Senior Software Engineer',
    company_name: 'Tech Corp B',
    location_country: 'Germany',
    location_city: 'Berlin',
    salary_amount: '85000.00',
    salary_currency: 'EUR' as const,
    experience_level: 'senior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'hybrid' as const,
    company_size: 'medium' as const,
    years_of_experience: 8,
    years_at_company: 3,
    bonus_amount: '5000.00',
    stock_options: false,
    benefits_description: 'Health insurance, pension',
    tech_stack: '["Python", "Django", "PostgreSQL"]',
    is_verified: true
  },
  {
    job_title: 'Frontend Developer',
    company_name: 'Startup X',
    location_country: 'UK',
    location_city: 'London',
    salary_amount: '55000.00',
    salary_currency: 'GBP' as const,
    experience_level: 'junior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'onsite' as const,
    company_size: 'startup' as const,
    years_of_experience: 2,
    years_at_company: 1,
    bonus_amount: null,
    stock_options: true,
    benefits_description: 'Health insurance',
    tech_stack: '["TypeScript", "Vue.js", "CSS"]',
    is_verified: false
  }
];

describe('compareSalaries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return salary records in the order of input IDs', async () => {
    // Create test salary records
    const createdRecords = await db.insert(salaryRecordsTable)
      .values(testSalaryRecords)
      .returning()
      .execute();

    // Test input with IDs in specific order
    const testInput: CompareSalariesInput = {
      salary_ids: [createdRecords[2].id, createdRecords[0].id, createdRecords[1].id]
    };

    const result = await compareSalaries(testInput);

    // Should return 3 records in the specified order
    expect(result).toHaveLength(3);
    expect(result[0].id).toEqual(createdRecords[2].id); // Frontend Developer
    expect(result[1].id).toEqual(createdRecords[0].id); // Software Engineer
    expect(result[2].id).toEqual(createdRecords[1].id); // Senior Software Engineer

    // Verify order matches job titles
    expect(result[0].job_title).toEqual('Frontend Developer');
    expect(result[1].job_title).toEqual('Software Engineer');
    expect(result[2].job_title).toEqual('Senior Software Engineer');
  });

  it('should convert numeric fields correctly', async () => {
    // Create test salary records
    const createdRecords = await db.insert(salaryRecordsTable)
      .values([testSalaryRecords[0], testSalaryRecords[1]])
      .returning()
      .execute();

    const testInput: CompareSalariesInput = {
      salary_ids: [createdRecords[0].id, createdRecords[1].id]
    };

    const result = await compareSalaries(testInput);

    // Verify numeric conversions
    expect(typeof result[0].salary_amount).toBe('number');
    expect(result[0].salary_amount).toEqual(120000);
    expect(typeof result[0].bonus_amount).toBe('number');
    expect(result[0].bonus_amount).toEqual(10000);

    expect(typeof result[1].salary_amount).toBe('number');
    expect(result[1].salary_amount).toEqual(85000);
    expect(typeof result[1].bonus_amount).toBe('number');
    expect(result[1].bonus_amount).toEqual(5000);
  });

  it('should handle null bonus amounts correctly', async () => {
    // Create record with null bonus
    const createdRecord = await db.insert(salaryRecordsTable)
      .values([testSalaryRecords[2]]) // This record has null bonus_amount
      .returning()
      .execute();

    const testInput: CompareSalariesInput = {
      salary_ids: [createdRecord[0].id]
    };

    const result = await compareSalaries(testInput);

    expect(result).toHaveLength(1);
    expect(result[0].bonus_amount).toBeNull();
    expect(typeof result[0].salary_amount).toBe('number');
    expect(result[0].salary_amount).toEqual(55000);
  });

  it('should handle partial matches when some IDs do not exist', async () => {
    // Create only one salary record
    const createdRecord = await db.insert(salaryRecordsTable)
      .values([testSalaryRecords[0]])
      .returning()
      .execute();

    // Request both existing and non-existing IDs
    const testInput: CompareSalariesInput = {
      salary_ids: [createdRecord[0].id, 999, 888] // 999 and 888 don't exist
    };

    const result = await compareSalaries(testInput);

    // Should return only the existing record
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(createdRecord[0].id);
    expect(result[0].job_title).toEqual('Software Engineer');
  });

  it('should return empty array when no matching records found', async () => {
    // Don't create any records, just test with non-existing IDs
    const testInput: CompareSalariesInput = {
      salary_ids: [999, 888, 777]
    };

    const result = await compareSalaries(testInput);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should handle duplicate IDs in input correctly', async () => {
    // Create test salary record
    const createdRecord = await db.insert(salaryRecordsTable)
      .values([testSalaryRecords[0]])
      .returning()
      .execute();

    // Test input with duplicate ID
    const testInput: CompareSalariesInput = {
      salary_ids: [createdRecord[0].id, createdRecord[0].id, createdRecord[0].id]
    };

    const result = await compareSalaries(testInput);

    // Should return the record 3 times (matching input order/count)
    expect(result).toHaveLength(3);
    expect(result[0].id).toEqual(createdRecord[0].id);
    expect(result[1].id).toEqual(createdRecord[0].id);
    expect(result[2].id).toEqual(createdRecord[0].id);
    expect(result[0].job_title).toEqual('Software Engineer');
  });

  it('should preserve all record fields correctly', async () => {
    // Create test salary record
    const createdRecord = await db.insert(salaryRecordsTable)
      .values([testSalaryRecords[0]])
      .returning()
      .execute();

    const testInput: CompareSalariesInput = {
      salary_ids: [createdRecord[0].id]
    };

    const result = await compareSalaries(testInput);

    expect(result).toHaveLength(1);
    const record = result[0];

    // Verify all fields are present and correct
    expect(record.id).toBeDefined();
    expect(record.job_title).toEqual('Software Engineer');
    expect(record.company_name).toEqual('Tech Corp A');
    expect(record.location_country).toEqual('USA');
    expect(record.location_city).toEqual('San Francisco');
    expect(record.salary_currency).toEqual('USD');
    expect(record.experience_level).toEqual('mid');
    expect(record.employment_type).toEqual('full_time');
    expect(record.work_arrangement).toEqual('remote');
    expect(record.company_size).toEqual('large');
    expect(record.years_of_experience).toEqual(5);
    expect(record.years_at_company).toEqual(2);
    expect(record.stock_options).toBe(true);
    expect(record.benefits_description).toEqual('Health insurance, 401k');
    expect(record.tech_stack).toEqual('["JavaScript", "React", "Node.js"]');
    expect(record.is_verified).toBe(true);
    expect(record.submission_date).toBeInstanceOf(Date);
    expect(record.created_at).toBeInstanceOf(Date);
  });
});