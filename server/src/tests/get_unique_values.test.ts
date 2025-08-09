import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { salaryRecordsTable } from '../db/schema';
import { getUniqueJobTitles, getUniqueCountries, getUniqueCities, getUniqueTechnologies } from '../handlers/get_unique_values';

describe('getUniqueValues handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestRecords = async () => {
    await db.insert(salaryRecordsTable).values([
      {
        job_title: 'Software Engineer',
        company_name: 'Tech Corp',
        location_country: 'United States',
        location_city: 'San Francisco',
        salary_amount: '120000.00',
        salary_currency: 'USD',
        experience_level: 'mid',
        employment_type: 'full_time',
        work_arrangement: 'hybrid',
        company_size: 'large',
        years_of_experience: 5,
        years_at_company: 2,
        bonus_amount: '10000.00',
        stock_options: true,
        benefits_description: 'Health, dental, vision',
        tech_stack: '["JavaScript", "React", "Node.js", "PostgreSQL"]',
        is_verified: true
      },
      {
        job_title: 'Data Scientist',
        company_name: 'Data Inc',
        location_country: 'United States',
        location_city: 'New York',
        salary_amount: '130000.00',
        salary_currency: 'USD',
        experience_level: 'senior',
        employment_type: 'full_time',
        work_arrangement: 'remote',
        company_size: 'medium',
        years_of_experience: 7,
        years_at_company: 3,
        bonus_amount: '15000.00',
        stock_options: false,
        benefits_description: 'Health, 401k',
        tech_stack: '["Python", "SQL", "TensorFlow", "AWS"]',
        is_verified: true
      },
      {
        job_title: 'Software Engineer',
        company_name: 'Euro Tech',
        location_country: 'Germany',
        location_city: 'Berlin',
        salary_amount: '80000.00',
        salary_currency: 'EUR',
        experience_level: 'mid',
        employment_type: 'full_time',
        work_arrangement: 'onsite',
        company_size: 'startup',
        years_of_experience: 4,
        years_at_company: 1,
        bonus_amount: null,
        stock_options: true,
        benefits_description: null,
        tech_stack: '["TypeScript", "Vue.js", "Node.js", "MongoDB"]',
        is_verified: false
      },
      {
        job_title: 'DevOps Engineer',
        company_name: 'Cloud Solutions',
        location_country: 'Germany',
        location_city: 'Munich',
        salary_amount: '75000.00',
        salary_currency: 'EUR',
        experience_level: 'junior',
        employment_type: 'full_time',
        work_arrangement: 'remote',
        company_size: 'small',
        years_of_experience: 2,
        years_at_company: 1,
        bonus_amount: null,
        stock_options: false,
        benefits_description: 'Health insurance',
        tech_stack: '["Docker", "Kubernetes", "AWS", "Python"]',
        is_verified: true
      },
      {
        job_title: 'Frontend Developer',
        company_name: null, // Anonymous entry
        location_country: 'United Kingdom',
        location_city: 'London',
        salary_amount: '65000.00',
        salary_currency: 'GBP',
        experience_level: 'mid',
        employment_type: 'contract',
        work_arrangement: 'hybrid',
        company_size: null,
        years_of_experience: 4,
        years_at_company: null,
        bonus_amount: null,
        stock_options: false,
        benefits_description: null,
        tech_stack: null, // No tech stack
        is_verified: true
      }
    ]).execute();
  };

  describe('getUniqueJobTitles', () => {
    it('should return unique job titles in alphabetical order', async () => {
      await createTestRecords();

      const jobTitles = await getUniqueJobTitles();

      expect(jobTitles).toEqual([
        'Data Scientist',
        'DevOps Engineer', 
        'Frontend Developer',
        'Software Engineer'
      ]);
    });

    it('should return empty array when no records exist', async () => {
      const jobTitles = await getUniqueJobTitles();

      expect(jobTitles).toEqual([]);
    });

    it('should handle duplicate job titles correctly', async () => {
      await db.insert(salaryRecordsTable).values([
        {
          job_title: 'Software Engineer',
          location_country: 'USA',
          location_city: 'Boston',
          salary_amount: '100000.00',
          salary_currency: 'USD',
          experience_level: 'mid',
          employment_type: 'full_time',
          work_arrangement: 'remote',
          years_of_experience: 3,
          stock_options: false
        },
        {
          job_title: 'Software Engineer',
          location_country: 'Canada',
          location_city: 'Toronto',
          salary_amount: '90000.00',
          salary_currency: 'USD',
          experience_level: 'junior',
          employment_type: 'full_time',
          work_arrangement: 'onsite',
          years_of_experience: 2,
          stock_options: false
        }
      ]).execute();

      const jobTitles = await getUniqueJobTitles();

      expect(jobTitles).toEqual(['Software Engineer']);
    });
  });

  describe('getUniqueCountries', () => {
    it('should return unique countries in alphabetical order', async () => {
      await createTestRecords();

      const countries = await getUniqueCountries();

      expect(countries).toEqual([
        'Germany',
        'United Kingdom',
        'United States'
      ]);
    });

    it('should return empty array when no records exist', async () => {
      const countries = await getUniqueCountries();

      expect(countries).toEqual([]);
    });
  });

  describe('getUniqueCities', () => {
    it('should return all unique cities when no country filter is provided', async () => {
      await createTestRecords();

      const cities = await getUniqueCities();

      expect(cities).toEqual([
        'Berlin',
        'London',
        'Munich',
        'New York',
        'San Francisco'
      ]);
    });

    it('should filter cities by country when country parameter is provided', async () => {
      await createTestRecords();

      const usCities = await getUniqueCities('United States');
      const germanyCities = await getUniqueCities('Germany');
      const ukCities = await getUniqueCities('United Kingdom');

      expect(usCities).toEqual(['New York', 'San Francisco']);
      expect(germanyCities).toEqual(['Berlin', 'Munich']);
      expect(ukCities).toEqual(['London']);
    });

    it('should return empty array for non-existent country', async () => {
      await createTestRecords();

      const cities = await getUniqueCities('France');

      expect(cities).toEqual([]);
    });

    it('should return empty array when no records exist', async () => {
      const cities = await getUniqueCities();

      expect(cities).toEqual([]);
    });
  });

  describe('getUniqueTechnologies', () => {
    it('should extract and return unique technologies from tech stacks', async () => {
      await createTestRecords();

      const technologies = await getUniqueTechnologies();

      expect(technologies).toEqual([
        'AWS',
        'Docker',
        'JavaScript',
        'Kubernetes',
        'MongoDB',
        'Node.js',
        'PostgreSQL',
        'Python',
        'React',
        'SQL',
        'TensorFlow',
        'TypeScript',
        'Vue.js'
      ]);
    });

    it('should handle records with null tech_stack', async () => {
      await db.insert(salaryRecordsTable).values([
        {
          job_title: 'Manager',
          location_country: 'USA',
          location_city: 'Chicago',
          salary_amount: '150000.00',
          salary_currency: 'USD',
          experience_level: 'senior',
          employment_type: 'full_time',
          work_arrangement: 'hybrid',
          years_of_experience: 10,
          stock_options: true,
          tech_stack: null // No tech stack
        },
        {
          job_title: 'Developer',
          location_country: 'USA',
          location_city: 'Seattle',
          salary_amount: '120000.00',
          salary_currency: 'USD',
          experience_level: 'mid',
          employment_type: 'full_time',
          work_arrangement: 'remote',
          years_of_experience: 5,
          stock_options: false,
          tech_stack: '["React", "TypeScript"]'
        }
      ]).execute();

      const technologies = await getUniqueTechnologies();

      expect(technologies).toEqual(['React', 'TypeScript']);
    });

    it('should handle invalid JSON in tech_stack gracefully', async () => {
      await db.insert(salaryRecordsTable).values([
        {
          job_title: 'Developer',
          location_country: 'USA',
          location_city: 'Austin',
          salary_amount: '110000.00',
          salary_currency: 'USD',
          experience_level: 'mid',
          employment_type: 'full_time',
          work_arrangement: 'remote',
          years_of_experience: 4,
          stock_options: false,
          tech_stack: 'invalid json string'
        },
        {
          job_title: 'Engineer',
          location_country: 'USA',
          location_city: 'Portland',
          salary_amount: '115000.00',
          salary_currency: 'USD',
          experience_level: 'mid',
          employment_type: 'full_time',
          work_arrangement: 'remote',
          years_of_experience: 4,
          stock_options: false,
          tech_stack: '["Java", "Spring"]'
        }
      ]).execute();

      const technologies = await getUniqueTechnologies();

      expect(technologies).toEqual(['Java', 'Spring']);
    });

    it('should handle empty tech arrays and trim whitespace', async () => {
      await db.insert(salaryRecordsTable).values([
        {
          job_title: 'Developer',
          location_country: 'USA',
          location_city: 'Miami',
          salary_amount: '105000.00',
          salary_currency: 'USD',
          experience_level: 'mid',
          employment_type: 'full_time',
          work_arrangement: 'remote',
          years_of_experience: 3,
          stock_options: false,
          tech_stack: '[]' // Empty array
        },
        {
          job_title: 'Engineer',
          location_country: 'USA',
          location_city: 'Denver',
          salary_amount: '108000.00',
          salary_currency: 'USD',
          experience_level: 'mid',
          employment_type: 'full_time',
          work_arrangement: 'remote',
          years_of_experience: 4,
          stock_options: false,
          tech_stack: '["  Ruby  ", "Rails", ""]' // With whitespace and empty string
        }
      ]).execute();

      const technologies = await getUniqueTechnologies();

      expect(technologies).toEqual(['Rails', 'Ruby']);
    });

    it('should return empty array when no records have tech stacks', async () => {
      await db.insert(salaryRecordsTable).values([
        {
          job_title: 'Manager',
          location_country: 'USA',
          location_city: 'Dallas',
          salary_amount: '140000.00',
          salary_currency: 'USD',
          experience_level: 'senior',
          employment_type: 'full_time',
          work_arrangement: 'hybrid',
          years_of_experience: 8,
          stock_options: true,
          tech_stack: null
        }
      ]).execute();

      const technologies = await getUniqueTechnologies();

      expect(technologies).toEqual([]);
    });

    it('should return empty array when no records exist', async () => {
      const technologies = await getUniqueTechnologies();

      expect(technologies).toEqual([]);
    });
  });
});