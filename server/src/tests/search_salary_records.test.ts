import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type SearchSalaryRecordsInput, type CreateSalaryRecordInput } from '../schema';
import { searchSalaryRecords } from '../handlers/search_salary_records';
import { eq } from 'drizzle-orm';

// Helper function to create test salary records
const createTestSalaryRecord = async (overrides: Partial<CreateSalaryRecordInput> = {}) => {
  const defaultRecord = {
    job_title: 'Software Engineer',
    company_name: 'Tech Corp',
    location_country: 'USA',
    location_city: 'New York',
    salary_amount: 100000,
    salary_currency: 'USD' as const,
    experience_level: 'mid' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'remote' as const,
    company_size: 'medium' as const,
    years_of_experience: 5,
    years_at_company: 2,
    bonus_amount: 10000,
    stock_options: true,
    benefits_description: 'Health insurance, 401k',
    tech_stack: '["JavaScript", "React", "Node.js"]',
    ...overrides
  };

  const result = await db.insert(salaryRecordsTable)
    .values({
      ...defaultRecord,
      salary_amount: defaultRecord.salary_amount.toString(),
      bonus_amount: defaultRecord.bonus_amount?.toString() ?? null,
      submission_date: new Date(),
      is_verified: false
    })
    .returning()
    .execute();

  return result[0];
};

describe('searchSalaryRecords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all records with default pagination', async () => {
    // Create test records
    await createTestSalaryRecord({ job_title: 'Frontend Developer' });
    await createTestSalaryRecord({ job_title: 'Backend Developer' });
    await createTestSalaryRecord({ job_title: 'Full Stack Developer' });

    const input: SearchSalaryRecordsInput = { limit: 50, offset: 0 };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(3);
    expect(results[0].job_title).toEqual('Full Stack Developer'); // Most recent first
    expect(typeof results[0].salary_amount).toBe('number');
    expect(typeof results[0].bonus_amount).toBe('number');
  });

  it('should filter by job title (case-insensitive partial match)', async () => {
    await createTestSalaryRecord({ job_title: 'Frontend Developer' });
    await createTestSalaryRecord({ job_title: 'Backend Developer' });
    await createTestSalaryRecord({ job_title: 'Data Scientist' });

    const input: SearchSalaryRecordsInput = {
      job_title: 'developer',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.job_title.toLowerCase().includes('developer'))).toBe(true);
  });

  it('should filter by location country', async () => {
    await createTestSalaryRecord({ location_country: 'USA', location_city: 'New York' });
    await createTestSalaryRecord({ location_country: 'Canada', location_city: 'Toronto' });
    await createTestSalaryRecord({ location_country: 'USA', location_city: 'San Francisco' });

    const input: SearchSalaryRecordsInput = {
      location_country: 'USA',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.location_country === 'USA')).toBe(true);
  });

  it('should filter by location city', async () => {
    await createTestSalaryRecord({ location_country: 'USA', location_city: 'New York' });
    await createTestSalaryRecord({ location_country: 'USA', location_city: 'San Francisco' });
    await createTestSalaryRecord({ location_country: 'Canada', location_city: 'New York' });

    const input: SearchSalaryRecordsInput = {
      location_city: 'New York',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.location_city === 'New York')).toBe(true);
  });

  it('should filter by experience level', async () => {
    await createTestSalaryRecord({ experience_level: 'entry' });
    await createTestSalaryRecord({ experience_level: 'mid' });
    await createTestSalaryRecord({ experience_level: 'senior' });

    const input: SearchSalaryRecordsInput = {
      experience_level: 'senior',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(1);
    expect(results[0].experience_level).toBe('senior');
  });

  it('should filter by employment type and work arrangement', async () => {
    await createTestSalaryRecord({ employment_type: 'full_time', work_arrangement: 'remote' });
    await createTestSalaryRecord({ employment_type: 'part_time', work_arrangement: 'hybrid' });
    await createTestSalaryRecord({ employment_type: 'full_time', work_arrangement: 'onsite' });

    const input: SearchSalaryRecordsInput = {
      employment_type: 'full_time',
      work_arrangement: 'remote',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(1);
    expect(results[0].employment_type).toBe('full_time');
    expect(results[0].work_arrangement).toBe('remote');
  });

  it('should filter by salary range', async () => {
    await createTestSalaryRecord({ salary_amount: 80000 });
    await createTestSalaryRecord({ salary_amount: 120000 });
    await createTestSalaryRecord({ salary_amount: 150000 });

    const input: SearchSalaryRecordsInput = {
      min_salary: 100000,
      max_salary: 140000,
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(1);
    expect(results[0].salary_amount).toBe(120000);
  });

  it('should filter by currency', async () => {
    await createTestSalaryRecord({ salary_currency: 'USD' });
    await createTestSalaryRecord({ salary_currency: 'EUR' });
    await createTestSalaryRecord({ salary_currency: 'GBP' });

    const input: SearchSalaryRecordsInput = {
      salary_currency: 'EUR',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(1);
    expect(results[0].salary_currency).toBe('EUR');
  });

  it('should filter by tech stack', async () => {
    await createTestSalaryRecord({ tech_stack: '["JavaScript", "React", "Node.js"]' });
    await createTestSalaryRecord({ tech_stack: '["Python", "Django", "PostgreSQL"]' });
    await createTestSalaryRecord({ tech_stack: '["Java", "Spring", "React"]' });

    const input: SearchSalaryRecordsInput = {
      tech_stack: 'React',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(2);
    expect(results.every(r => r.tech_stack?.includes('React'))).toBe(true);
  });

  it('should filter by experience range', async () => {
    await createTestSalaryRecord({ years_of_experience: 2 });
    await createTestSalaryRecord({ years_of_experience: 5 });
    await createTestSalaryRecord({ years_of_experience: 8 });
    await createTestSalaryRecord({ years_of_experience: 12 });

    const input: SearchSalaryRecordsInput = {
      min_experience: 4,
      max_experience: 10,
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(2);
    results.forEach(r => {
      expect(r.years_of_experience).toBeGreaterThanOrEqual(4);
      expect(r.years_of_experience).toBeLessThanOrEqual(10);
    });
  });

  it('should filter verified records only', async () => {
    // Create verified record
    const verifiedRecord = await createTestSalaryRecord({ job_title: 'Verified Engineer' });
    await db.update(salaryRecordsTable)
      .set({ is_verified: true })
      .where(eq(salaryRecordsTable.id, verifiedRecord.id))
      .execute();

    // Create unverified records
    await createTestSalaryRecord({ job_title: 'Unverified Engineer 1' });
    await createTestSalaryRecord({ job_title: 'Unverified Engineer 2' });

    const input: SearchSalaryRecordsInput = {
      verified_only: true,
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(1);
    expect(results[0].is_verified).toBe(true);
    expect(results[0].job_title).toBe('Verified Engineer');
  });

  it('should handle pagination correctly', async () => {
    // Create multiple records
    for (let i = 0; i < 25; i++) {
      await createTestSalaryRecord({ job_title: `Engineer ${i}` });
    }

    // Test first page
    const firstPage: SearchSalaryRecordsInput = {
      limit: 10,
      offset: 0
    };
    const firstResults = await searchSalaryRecords(firstPage);
    expect(firstResults).toHaveLength(10);

    // Test second page
    const secondPage: SearchSalaryRecordsInput = {
      limit: 10,
      offset: 10
    };
    const secondResults = await searchSalaryRecords(secondPage);
    expect(secondResults).toHaveLength(10);

    // Test third page
    const thirdPage: SearchSalaryRecordsInput = {
      limit: 10,
      offset: 20
    };
    const thirdResults = await searchSalaryRecords(thirdPage);
    expect(thirdResults).toHaveLength(5);

    // Ensure no overlap between pages
    const firstPageIds = firstResults.map(r => r.id);
    const secondPageIds = secondResults.map(r => r.id);
    const thirdPageIds = thirdResults.map(r => r.id);

    expect(firstPageIds.some(id => secondPageIds.includes(id))).toBe(false);
    expect(secondPageIds.some(id => thirdPageIds.includes(id))).toBe(false);
  });

  it('should combine multiple filters correctly', async () => {
    await createTestSalaryRecord({
      job_title: 'Senior React Developer',
      location_country: 'USA',
      salary_amount: 130000,
      experience_level: 'senior',
      tech_stack: '["JavaScript", "React", "TypeScript"]'
    });

    await createTestSalaryRecord({
      job_title: 'Junior React Developer',
      location_country: 'USA',
      salary_amount: 70000,
      experience_level: 'junior',
      tech_stack: '["JavaScript", "React"]'
    });

    await createTestSalaryRecord({
      job_title: 'Senior Python Developer',
      location_country: 'Canada',
      salary_amount: 120000,
      experience_level: 'senior',
      tech_stack: '["Python", "Django"]'
    });

    const input: SearchSalaryRecordsInput = {
      job_title: 'developer',
      location_country: 'USA',
      min_salary: 100000,
      experience_level: 'senior',
      tech_stack: 'React',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(1);
    expect(results[0].job_title).toBe('Senior React Developer');
    expect(results[0].location_country).toBe('USA');
    expect(results[0].salary_amount).toBe(130000);
    expect(results[0].experience_level).toBe('senior');
  });

  it('should return empty array when no records match filters', async () => {
    await createTestSalaryRecord({ job_title: 'Software Engineer' });

    const input: SearchSalaryRecordsInput = {
      job_title: 'Nonexistent Role',
      limit: 50,
      offset: 0
    };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(0);
  });

  it('should handle null bonus amounts correctly', async () => {
    await createTestSalaryRecord({ 
      job_title: 'Engineer with no bonus',
      bonus_amount: null 
    });

    const input: SearchSalaryRecordsInput = { limit: 50, offset: 0 };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(1);
    expect(results[0].bonus_amount).toBe(null);
    expect(typeof results[0].salary_amount).toBe('number');
  });

  it('should order results by creation date descending', async () => {
    const firstRecord = await createTestSalaryRecord({ job_title: 'First Engineer' });
    
    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const secondRecord = await createTestSalaryRecord({ job_title: 'Second Engineer' });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const thirdRecord = await createTestSalaryRecord({ job_title: 'Third Engineer' });

    const input: SearchSalaryRecordsInput = { limit: 50, offset: 0 };
    const results = await searchSalaryRecords(input);

    expect(results).toHaveLength(3);
    expect(results[0].job_title).toBe('Third Engineer'); // Most recent
    expect(results[1].job_title).toBe('Second Engineer');
    expect(results[2].job_title).toBe('First Engineer'); // Oldest
  });
});