import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { getAllSalaryRecords } from '../handlers/get_all_salary_records';

// Test data
const testRecord1 = {
  job_title: 'Software Engineer',
  company_name: 'Tech Corp',
  location_country: 'United States',
  location_city: 'San Francisco',
  salary_amount: '120000.00',
  salary_currency: 'USD' as const,
  experience_level: 'senior' as const,
  employment_type: 'full_time' as const,
  work_arrangement: 'remote' as const,
  company_size: 'large' as const,
  years_of_experience: 5,
  years_at_company: 2,
  bonus_amount: '15000.50',
  stock_options: true,
  benefits_description: 'Health insurance, 401k',
  tech_stack: '["JavaScript", "React", "Node.js"]',
  is_verified: true
};

const testRecord2 = {
  job_title: 'Product Manager',
  company_name: null,
  location_country: 'Germany',
  location_city: 'Berlin',
  salary_amount: '75000.00',
  salary_currency: 'EUR' as const,
  experience_level: 'mid' as const,
  employment_type: 'full_time' as const,
  work_arrangement: 'hybrid' as const,
  company_size: 'medium' as const,
  years_of_experience: 3,
  years_at_company: null,
  bonus_amount: null,
  stock_options: false,
  benefits_description: null,
  tech_stack: null,
  is_verified: false
};

const testRecord3 = {
  job_title: 'Data Scientist',
  company_name: 'Analytics Inc',
  location_country: 'United Kingdom',
  location_city: 'London',
  salary_amount: '85000.75',
  salary_currency: 'GBP' as const,
  experience_level: 'junior' as const,
  employment_type: 'contract' as const,
  work_arrangement: 'onsite' as const,
  company_size: 'startup' as const,
  years_of_experience: 1,
  years_at_company: 1,
  bonus_amount: '5000.25',
  stock_options: true,
  benefits_description: 'Flexible hours',
  tech_stack: '["Python", "TensorFlow", "SQL"]',
  is_verified: true
};

describe('getAllSalaryRecords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no records exist', async () => {
    const result = await getAllSalaryRecords();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all salary records', async () => {
    // Insert test records
    await db.insert(salaryRecordsTable)
      .values([testRecord1, testRecord2, testRecord3])
      .execute();

    const result = await getAllSalaryRecords();

    expect(result).toHaveLength(3);
    expect(Array.isArray(result)).toBe(true);
    
    // Verify all records are returned
    const jobTitles = result.map(r => r.job_title).sort();
    expect(jobTitles).toEqual(['Data Scientist', 'Product Manager', 'Software Engineer']);
  });

  it('should correctly convert numeric fields from strings to numbers', async () => {
    await db.insert(salaryRecordsTable)
      .values([testRecord1])
      .execute();

    const result = await getAllSalaryRecords();

    expect(result).toHaveLength(1);
    const record = result[0];
    
    // Verify numeric conversions
    expect(typeof record.salary_amount).toBe('number');
    expect(record.salary_amount).toBe(120000);
    expect(typeof record.bonus_amount).toBe('number');
    expect(record.bonus_amount).toBe(15000.5);
  });

  it('should handle null bonus_amount correctly', async () => {
    await db.insert(salaryRecordsTable)
      .values([testRecord2])
      .execute();

    const result = await getAllSalaryRecords();

    expect(result).toHaveLength(1);
    const record = result[0];
    
    expect(record.bonus_amount).toBeNull();
    expect(typeof record.salary_amount).toBe('number');
    expect(record.salary_amount).toBe(75000);
  });

  it('should preserve all field types and values correctly', async () => {
    await db.insert(salaryRecordsTable)
      .values([testRecord1])
      .execute();

    const result = await getAllSalaryRecords();
    const record = result[0];

    // String fields
    expect(record.job_title).toBe('Software Engineer');
    expect(record.company_name).toBe('Tech Corp');
    expect(record.location_country).toBe('United States');
    expect(record.location_city).toBe('San Francisco');
    expect(record.benefits_description).toBe('Health insurance, 401k');
    expect(record.tech_stack).toBe('["JavaScript", "React", "Node.js"]');

    // Enum fields
    expect(record.salary_currency).toBe('USD');
    expect(record.experience_level).toBe('senior');
    expect(record.employment_type).toBe('full_time');
    expect(record.work_arrangement).toBe('remote');
    expect(record.company_size).toBe('large');

    // Integer fields
    expect(record.years_of_experience).toBe(5);
    expect(record.years_at_company).toBe(2);

    // Boolean fields
    expect(record.stock_options).toBe(true);
    expect(record.is_verified).toBe(true);

    // Date fields
    expect(record.submission_date).toBeInstanceOf(Date);
    expect(record.created_at).toBeInstanceOf(Date);

    // Auto-generated fields
    expect(typeof record.id).toBe('number');
    expect(record.id).toBeGreaterThan(0);
  });

  it('should handle records with mixed nullable fields', async () => {
    await db.insert(salaryRecordsTable)
      .values([testRecord1, testRecord2, testRecord3])
      .execute();

    const result = await getAllSalaryRecords();

    expect(result).toHaveLength(3);

    // Find each record by job title for verification
    const softwareEngineer = result.find(r => r.job_title === 'Software Engineer');
    const productManager = result.find(r => r.job_title === 'Product Manager');
    const dataScientist = result.find(r => r.job_title === 'Data Scientist');

    // Verify nullable fields are handled correctly
    expect(softwareEngineer?.company_name).toBe('Tech Corp');
    expect(productManager?.company_name).toBeNull();
    expect(dataScientist?.company_name).toBe('Analytics Inc');

    expect(softwareEngineer?.years_at_company).toBe(2);
    expect(productManager?.years_at_company).toBeNull();
    expect(dataScientist?.years_at_company).toBe(1);

    expect(softwareEngineer?.bonus_amount).toBe(15000.5);
    expect(productManager?.bonus_amount).toBeNull();
    expect(dataScientist?.bonus_amount).toBe(5000.25);
  });

  it('should return records in database insertion order', async () => {
    // Insert records in specific order
    await db.insert(salaryRecordsTable)
      .values([testRecord1])
      .execute();

    await db.insert(salaryRecordsTable)
      .values([testRecord2])
      .execute();

    await db.insert(salaryRecordsTable)
      .values([testRecord3])
      .execute();

    const result = await getAllSalaryRecords();

    expect(result).toHaveLength(3);
    
    // Records should be in order of insertion (by ID)
    expect(result[0].job_title).toBe('Software Engineer');
    expect(result[1].job_title).toBe('Product Manager');
    expect(result[2].job_title).toBe('Data Scientist');
    
    // IDs should be sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});