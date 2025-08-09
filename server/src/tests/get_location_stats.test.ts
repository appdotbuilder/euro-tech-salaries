import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { type LocationStatsInput } from '../schema';
import { getLocationStats } from '../handlers/get_location_stats';

// Test data setup with proper typing
const testRecords = [
  {
    job_title: 'Software Engineer',
    company_name: 'Tech Corp',
    location_country: 'USA',
    location_city: 'San Francisco',
    salary_amount: '150000.00',
    salary_currency: 'USD' as const,
    experience_level: 'senior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'hybrid' as const,
    company_size: 'large' as const,
    years_of_experience: 8,
    years_at_company: 3,
    bonus_amount: '25000.00',
    stock_options: true,
    benefits_description: 'Health, dental, 401k',
    tech_stack: '["JavaScript", "React", "Node.js"]',
    is_verified: true
  },
  {
    job_title: 'Software Engineer',
    company_name: 'Startup Inc',
    location_country: 'USA',
    location_city: 'San Francisco',
    salary_amount: '130000.00',
    salary_currency: 'USD' as const,
    experience_level: 'mid' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'remote' as const,
    company_size: 'startup' as const,
    years_of_experience: 5,
    years_at_company: 2,
    bonus_amount: null,
    stock_options: true,
    benefits_description: 'Health insurance',
    tech_stack: '["Python", "Django"]',
    is_verified: true
  },
  {
    job_title: 'Data Scientist',
    company_name: 'Data Co',
    location_country: 'USA',
    location_city: 'New York',
    salary_amount: '120000.00',
    salary_currency: 'USD' as const,
    experience_level: 'senior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'onsite' as const,
    company_size: 'medium' as const,
    years_of_experience: 6,
    years_at_company: 1,
    bonus_amount: '15000.00',
    stock_options: false,
    benefits_description: 'Health, dental',
    tech_stack: '["Python", "TensorFlow", "SQL"]',
    is_verified: true
  },
  {
    job_title: 'Software Engineer',
    company_name: 'Berlin Tech',
    location_country: 'Germany',
    location_city: 'Berlin',
    salary_amount: '75000.00',
    salary_currency: 'EUR' as const,
    experience_level: 'senior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'hybrid' as const,
    company_size: 'medium' as const,
    years_of_experience: 7,
    years_at_company: 4,
    bonus_amount: '10000.00',
    stock_options: false,
    benefits_description: 'Health insurance, vacation',
    tech_stack: '["JavaScript", "Vue.js", "PostgreSQL"]',
    is_verified: true
  },
  {
    job_title: 'Product Manager',
    company_name: 'London Firm',
    location_country: 'UK',
    location_city: 'London',
    salary_amount: '85000.00',
    salary_currency: 'GBP' as const,
    experience_level: 'senior' as const,
    employment_type: 'full_time' as const,
    work_arrangement: 'hybrid' as const,
    company_size: 'large' as const,
    years_of_experience: 9,
    years_at_company: 2,
    bonus_amount: '12000.00',
    stock_options: true,
    benefits_description: 'Comprehensive benefits',
    tech_stack: null,
    is_verified: true
  }
];

describe('getLocationStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return location statistics for all locations', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {};
    const results = await getLocationStats(input);

    // Should return stats for all 4 unique locations
    expect(results).toHaveLength(4);

    // Check that all required fields are present
    results.forEach(result => {
      expect(result.location).toBeDefined();
      expect(result.country).toBeDefined();
      expect(result.city).toBeDefined();
      expect(typeof result.average_salary).toBe('number');
      expect(typeof result.median_salary).toBe('number');
      expect(typeof result.count).toBe('number');
      expect(typeof result.currency_distribution).toBe('object');
      expect(result.count).toBeGreaterThan(0);
    });

    // Verify San Francisco has 2 records
    const sfStats = results.find(r => r.city === 'San Francisco');
    expect(sfStats).toBeDefined();
    expect(sfStats!.count).toBe(2);
    expect(sfStats!.country).toBe('USA');
    expect(sfStats!.location).toBe('San Francisco, USA');
  });

  it('should filter by country', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      country: 'USA'
    };
    const results = await getLocationStats(input);

    // Should return only USA locations
    expect(results).toHaveLength(2); // San Francisco and New York
    results.forEach(result => {
      expect(result.country).toBe('USA');
    });
  });

  it('should filter by job title', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      job_title: 'Software Engineer'
    };
    const results = await getLocationStats(input);

    // Should return locations where Software Engineers work
    expect(results).toHaveLength(2); // San Francisco and Berlin
    
    const cities = results.map(r => r.city).sort();
    expect(cities).toEqual(['Berlin', 'San Francisco']);
  });

  it('should filter by experience level', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      experience_level: 'senior'
    };
    const results = await getLocationStats(input);

    // Should return locations with senior level positions
    expect(results).toHaveLength(4); // All locations have at least one senior
    
    // San Francisco should have only 1 senior (the other is mid-level)
    const sfStats = results.find(r => r.city === 'San Francisco');
    expect(sfStats!.count).toBe(1);
  });

  it('should combine multiple filters', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      country: 'USA',
      job_title: 'Software Engineer',
      experience_level: 'senior'
    };
    const results = await getLocationStats(input);

    // Should return only San Francisco (senior software engineer in USA)
    expect(results).toHaveLength(1);
    expect(results[0].city).toBe('San Francisco');
    expect(results[0].country).toBe('USA');
    expect(results[0].count).toBe(1);
  });

  it('should calculate correct average and median salaries', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      country: 'USA',
      job_title: 'Software Engineer'
    };
    const results = await getLocationStats(input);

    // Should return only San Francisco (only location in USA with Software Engineers)
    expect(results).toHaveLength(1);
    const sfStats = results[0];
    
    expect(sfStats.city).toBe('San Francisco');
    // San Francisco has salaries: 150000, 130000 for Software Engineers
    // Average should be 140000, median should be 140000
    expect(sfStats.average_salary).toBe(140000);
    expect(sfStats.median_salary).toBe(140000);
    expect(sfStats.count).toBe(2);
  });

  it('should include currency distribution', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {};
    const results = await getLocationStats(input);

    // Check currency distribution for San Francisco (all USD)
    const sfStats = results.find(r => r.city === 'San Francisco');
    expect(sfStats!.currency_distribution).toBeDefined();
    expect(sfStats!.currency_distribution['USD']).toBe(2);

    // Check that other locations have their respective currencies
    const berlinStats = results.find(r => r.city === 'Berlin');
    expect(berlinStats!.currency_distribution['EUR']).toBe(1);

    const londonStats = results.find(r => r.city === 'London');
    expect(londonStats!.currency_distribution['GBP']).toBe(1);
  });

  it('should handle case-insensitive job title search', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      job_title: 'software engineer' // lowercase
    };
    const results = await getLocationStats(input);

    expect(results).toHaveLength(2); // Should match "Software Engineer"
  });

  it('should return empty array when no records match filters', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      country: 'France' // No records for France
    };
    const results = await getLocationStats(input);

    expect(results).toHaveLength(0);
  });

  it('should order results by average salary descending', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {};
    const results = await getLocationStats(input);

    // Results should be ordered by average salary descending
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].average_salary).toBeGreaterThanOrEqual(results[i + 1].average_salary);
    }

    // San Francisco should be first (highest average)
    expect(results[0].city).toBe('San Francisco');
  });

  it('should handle partial job title matches', async () => {
    // Insert test data
    await db.insert(salaryRecordsTable).values(testRecords).execute();

    const input: LocationStatsInput = {
      job_title: 'Engineer' // Should match both Software Engineer and Data Scientist
    };
    const results = await getLocationStats(input);

    expect(results).toHaveLength(2); // San Francisco and Berlin
  });
});