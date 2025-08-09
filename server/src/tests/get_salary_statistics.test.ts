import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type SalaryStatisticsInput } from '../schema';
import { getSalaryStatistics } from '../handlers/get_salary_statistics';

// Test data for salary statistics
const testSalaryRecords = [
  {
    job_title: 'Software Engineer',
    company_name: 'Tech Corp',
    location_country: 'United States',
    location_city: 'San Francisco',
    salary_amount: '100000.00', // Stored as string in DB
    salary_currency: 'USD' as const,
    experience_level: 'mid' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'remote' as const,
    company_size: 'large' as const,
    years_of_experience: 5,
    years_at_company: 2,
    bonus_amount: '10000.00',
    stock_options: true,
    benefits_description: 'Great benefits',
    tech_stack: '["JavaScript", "React", "Node.js"]',
    is_verified: true
  },
  {
    job_title: 'Software Engineer',
    company_name: 'Startup Inc',
    location_country: 'United States',
    location_city: 'New York',
    salary_amount: '120000.00',
    salary_currency: 'USD' as const,
    experience_level: 'senior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'hybrid' as const,
    company_size: 'startup' as const,
    years_of_experience: 7,
    years_at_company: 1,
    bonus_amount: '15000.00',
    stock_options: true,
    benefits_description: 'Equity heavy',
    tech_stack: '["Python", "Django", "PostgreSQL"]',
    is_verified: true
  },
  {
    job_title: 'Frontend Developer',
    company_name: 'Design Studio',
    location_country: 'Germany',
    location_city: 'Berlin',
    salary_amount: '60000.00',
    salary_currency: 'EUR' as const,
    experience_level: 'mid' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'onsite' as const,
    company_size: 'medium' as const,
    years_of_experience: 4,
    years_at_company: 3,
    bonus_amount: null,
    stock_options: false,
    benefits_description: 'Standard benefits',
    tech_stack: '["Vue.js", "TypeScript", "CSS"]',
    is_verified: false
  },
  {
    job_title: 'Software Engineer',
    company_name: 'Big Tech',
    location_country: 'United States',
    location_city: 'Seattle',
    salary_amount: '150000.00',
    salary_currency: 'USD' as const,
    experience_level: 'senior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'remote' as const,
    company_size: 'enterprise' as const,
    years_of_experience: 8,
    years_at_company: 4,
    bonus_amount: '25000.00',
    stock_options: true,
    benefits_description: 'Excellent benefits',
    tech_stack: '["Java", "Spring", "AWS"]',
    is_verified: true
  },
  {
    job_title: 'Data Scientist',
    company_name: 'AI Company',
    location_country: 'United Kingdom',
    location_city: 'London',
    salary_amount: '80000.00',
    salary_currency: 'GBP' as const,
    experience_level: 'mid' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'hybrid' as const,
    company_size: 'large' as const,
    years_of_experience: 5,
    years_at_company: 2,
    bonus_amount: '8000.00',
    stock_options: false,
    benefits_description: 'Good benefits',
    tech_stack: '["Python", "TensorFlow", "SQL"]',
    is_verified: true
  }
];

describe('getSalaryStatistics', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate basic statistics for all records', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {};
    const result = await getSalaryStatistics(input);

    // Test basic counts and structure
    expect(result.count).toEqual(5);
    expect(typeof result.average_salary).toBe('number');
    expect(typeof result.median_salary).toBe('number');
    expect(typeof result.min_salary).toBe('number');
    expect(typeof result.max_salary).toBe('number');
    expect(typeof result.percentile_25).toBe('number');
    expect(typeof result.percentile_75).toBe('number');

    // Test sorted statistics (60000, 80000, 100000, 120000, 150000)
    expect(result.min_salary).toEqual(60000);
    expect(result.max_salary).toEqual(150000);
    expect(result.median_salary).toEqual(100000); // Middle value of 5 records
    expect(result.average_salary).toEqual(102000); // (60000+80000+100000+120000+150000)/5

    // Test currency breakdown
    expect(result.currency_breakdown).toEqual({
      USD: 3,
      EUR: 1,
      GBP: 1
    });
  });

  it('should filter by job title', async () => {
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {
      job_title: 'Software Engineer'
    };
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(3); // 3 Software Engineer records
    expect(result.min_salary).toEqual(100000);
    expect(result.max_salary).toEqual(150000);
    expect(result.average_salary).toEqual(123333.33); // (100000+120000+150000)/3
    expect(result.median_salary).toEqual(120000);
    expect(result.currency_breakdown).toEqual({ USD: 3 });
  });

  it('should filter by location country', async () => {
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {
      location_country: 'United States'
    };
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(3); // 3 US records
    expect(result.min_salary).toEqual(100000);
    expect(result.max_salary).toEqual(150000);
    expect(result.currency_breakdown).toEqual({ USD: 3 });
  });

  it('should filter by experience level', async () => {
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {
      experience_level: 'mid'
    };
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(3); // 3 mid-level records
    expect(result.min_salary).toEqual(60000);
    expect(result.max_salary).toEqual(100000);
    expect(result.average_salary).toEqual(80000); // (100000+60000+80000)/3
    expect(result.currency_breakdown).toEqual({
      USD: 1,
      EUR: 1,
      GBP: 1
    });
  });

  it('should filter by employment type', async () => {
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {
      employment_type: 'full_time'
    };
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(5); // All records are full_time
    expect(result.min_salary).toEqual(60000);
    expect(result.max_salary).toEqual(150000);
  });

  it('should apply multiple filters correctly', async () => {
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {
      job_title: 'Software Engineer',
      location_country: 'United States',
      experience_level: 'senior'
    };
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(2); // 2 senior Software Engineers in US
    expect(result.min_salary).toEqual(120000);
    expect(result.max_salary).toEqual(150000);
    expect(result.average_salary).toEqual(135000); // (120000+150000)/2
    expect(result.median_salary).toEqual(135000); // Average of 2 values
    expect(result.currency_breakdown).toEqual({ USD: 2 });
  });

  it('should handle partial job title matches with case insensitivity', async () => {
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {
      job_title: 'engineer' // Lowercase, partial match
    };
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(3); // Should match 'Software Engineer' records
    expect(result.currency_breakdown).toEqual({ USD: 3 });
  });

  it('should calculate correct percentiles', async () => {
    // Insert records with known salary distribution: [10000, 20000, 30000, 40000, 50000]
    const percentileTestData = [
      {
        ...testSalaryRecords[0],
        salary_amount: '10000.00'
      },
      {
        ...testSalaryRecords[1],
        salary_amount: '20000.00'
      },
      {
        ...testSalaryRecords[2],
        salary_amount: '30000.00'
      },
      {
        ...testSalaryRecords[3],
        salary_amount: '40000.00'
      },
      {
        ...testSalaryRecords[4],
        salary_amount: '50000.00'
      }
    ];

    await db.insert(salaryRecordsTable).values(percentileTestData).execute();

    const input: SalaryStatisticsInput = {};
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(5);
    expect(result.min_salary).toEqual(10000);
    expect(result.max_salary).toEqual(50000);
    expect(result.median_salary).toEqual(30000);
    expect(result.percentile_25).toEqual(20000); // 25th percentile
    expect(result.percentile_75).toEqual(40000); // 75th percentile
  });

  it('should return empty statistics when no records match filters', async () => {
    await db.insert(salaryRecordsTable).values(testSalaryRecords).execute();

    const input: SalaryStatisticsInput = {
      job_title: 'Nonexistent Job Title'
    };
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(0);
    expect(result.average_salary).toEqual(0);
    expect(result.median_salary).toEqual(0);
    expect(result.min_salary).toEqual(0);
    expect(result.max_salary).toEqual(0);
    expect(result.percentile_25).toEqual(0);
    expect(result.percentile_75).toEqual(0);
    expect(result.currency_breakdown).toEqual({});
  });

  it('should return empty statistics when no records exist in database', async () => {
    const input: SalaryStatisticsInput = {};
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(0);
    expect(result.average_salary).toEqual(0);
    expect(result.median_salary).toEqual(0);
    expect(result.min_salary).toEqual(0);
    expect(result.max_salary).toEqual(0);
    expect(result.percentile_25).toEqual(0);
    expect(result.percentile_75).toEqual(0);
    expect(result.currency_breakdown).toEqual({});
  });

  it('should handle single record correctly', async () => {
    await db.insert(salaryRecordsTable).values([testSalaryRecords[0]]).execute();

    const input: SalaryStatisticsInput = {};
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(1);
    expect(result.average_salary).toEqual(100000);
    expect(result.median_salary).toEqual(100000);
    expect(result.min_salary).toEqual(100000);
    expect(result.max_salary).toEqual(100000);
    expect(result.percentile_25).toEqual(100000);
    expect(result.percentile_75).toEqual(100000);
    expect(result.currency_breakdown).toEqual({ USD: 1 });
  });

  it('should round decimal results to 2 places', async () => {
    // Create records that will produce non-round averages
    const decimalTestData = [
      {
        ...testSalaryRecords[0],
        salary_amount: '100000.33'
      },
      {
        ...testSalaryRecords[1],
        salary_amount: '100000.66'
      },
      {
        ...testSalaryRecords[2],
        salary_amount: '100000.99'
      }
    ];

    await db.insert(salaryRecordsTable).values(decimalTestData).execute();

    const input: SalaryStatisticsInput = {};
    const result = await getSalaryStatistics(input);

    expect(result.count).toEqual(3);
    // Average should be (100000.33 + 100000.66 + 100000.99) / 3 = 100000.66
    expect(result.average_salary).toEqual(100000.66);
    expect(result.median_salary).toEqual(100000.66);

    // Verify all values are properly rounded
    expect(Number.isInteger(result.average_salary * 100)).toBe(true);
    expect(Number.isInteger(result.median_salary * 100)).toBe(true);
    expect(Number.isInteger(result.min_salary * 100)).toBe(true);
    expect(Number.isInteger(result.max_salary * 100)).toBe(true);
  });
});