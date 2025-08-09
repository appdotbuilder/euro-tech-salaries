import { z } from 'zod';

// Enums for predefined values
export const salaryCurrencyEnum = z.enum(['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK']);
export const experienceLevelEnum = z.enum(['entry', 'junior', 'mid', 'senior', 'staff', 'principal', 'director']);
export const employmentTypeEnum = z.enum(['full_time', 'part_time', 'contract', 'freelance']);
export const workArrangementEnum = z.enum(['remote', 'hybrid', 'onsite']);
export const companySizeEnum = z.enum(['startup', 'small', 'medium', 'large', 'enterprise']);

// Main salary record schema
export const salaryRecordSchema = z.object({
  id: z.number(),
  job_title: z.string(),
  company_name: z.string().nullable(),
  location_country: z.string(),
  location_city: z.string(),
  salary_amount: z.number(),
  salary_currency: salaryCurrencyEnum,
  experience_level: experienceLevelEnum,
  employment_type: employmentTypeEnum,
  work_arrangement: workArrangementEnum,
  company_size: companySizeEnum.nullable(),
  years_of_experience: z.number().int().nonnegative(),
  years_at_company: z.number().int().nonnegative().nullable(),
  bonus_amount: z.number().nullable(),
  stock_options: z.boolean(),
  benefits_description: z.string().nullable(),
  tech_stack: z.string().nullable(), // JSON array stored as string
  submission_date: z.coerce.date(),
  is_verified: z.boolean(),
  created_at: z.coerce.date()
});

export type SalaryRecord = z.infer<typeof salaryRecordSchema>;

// Input schema for creating salary records
export const createSalaryRecordInputSchema = z.object({
  job_title: z.string().min(1, "Job title is required"),
  company_name: z.string().nullable(),
  location_country: z.string().min(1, "Country is required"),
  location_city: z.string().min(1, "City is required"),
  salary_amount: z.number().positive("Salary must be positive"),
  salary_currency: salaryCurrencyEnum,
  experience_level: experienceLevelEnum,
  employment_type: employmentTypeEnum,
  work_arrangement: workArrangementEnum,
  company_size: companySizeEnum.nullable(),
  years_of_experience: z.number().int().nonnegative(),
  years_at_company: z.number().int().nonnegative().nullable(),
  bonus_amount: z.number().nullable(),
  stock_options: z.boolean(),
  benefits_description: z.string().nullable(),
  tech_stack: z.string().nullable() // JSON array as string
});

export type CreateSalaryRecordInput = z.infer<typeof createSalaryRecordInputSchema>;

// Input schema for updating salary records (admin only)
export const updateSalaryRecordInputSchema = z.object({
  id: z.number(),
  job_title: z.string().min(1).optional(),
  company_name: z.string().nullable().optional(),
  location_country: z.string().min(1).optional(),
  location_city: z.string().min(1).optional(),
  salary_amount: z.number().positive().optional(),
  salary_currency: salaryCurrencyEnum.optional(),
  experience_level: experienceLevelEnum.optional(),
  employment_type: employmentTypeEnum.optional(),
  work_arrangement: workArrangementEnum.optional(),
  company_size: companySizeEnum.nullable().optional(),
  years_of_experience: z.number().int().nonnegative().optional(),
  years_at_company: z.number().int().nonnegative().nullable().optional(),
  bonus_amount: z.number().nullable().optional(),
  stock_options: z.boolean().optional(),
  benefits_description: z.string().nullable().optional(),
  tech_stack: z.string().nullable().optional(),
  is_verified: z.boolean().optional()
});

export type UpdateSalaryRecordInput = z.infer<typeof updateSalaryRecordInputSchema>;

// Search and filter schema
export const searchSalaryRecordsInputSchema = z.object({
  job_title: z.string().optional(),
  location_country: z.string().optional(),
  location_city: z.string().optional(),
  experience_level: experienceLevelEnum.optional(),
  employment_type: employmentTypeEnum.optional(),
  work_arrangement: workArrangementEnum.optional(),
  company_size: companySizeEnum.optional(),
  min_salary: z.number().nonnegative().optional(),
  max_salary: z.number().nonnegative().optional(),
  salary_currency: salaryCurrencyEnum.optional(),
  tech_stack: z.string().optional(), // Single tech from stack
  min_experience: z.number().int().nonnegative().optional(),
  max_experience: z.number().int().nonnegative().optional(),
  verified_only: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchSalaryRecordsInput = z.infer<typeof searchSalaryRecordsInputSchema>;

// Salary comparison schema
export const compareSalariesInputSchema = z.object({
  salary_ids: z.array(z.number()).min(2).max(10)
});

export type CompareSalariesInput = z.infer<typeof compareSalariesInputSchema>;

// Salary statistics schema
export const salaryStatisticsSchema = z.object({
  job_title: z.string().optional(),
  location_country: z.string().optional(),
  experience_level: experienceLevelEnum.optional(),
  employment_type: employmentTypeEnum.optional()
});

export type SalaryStatisticsInput = z.infer<typeof salaryStatisticsSchema>;

// Statistics response schema
export const salaryStatisticsResponseSchema = z.object({
  count: z.number().int(),
  average_salary: z.number(),
  median_salary: z.number(),
  min_salary: z.number(),
  max_salary: z.number(),
  percentile_25: z.number(),
  percentile_75: z.number(),
  currency_breakdown: z.record(z.string(), z.number())
});

export type SalaryStatisticsResponse = z.infer<typeof salaryStatisticsResponseSchema>;

// Tax calculation schema
export const taxCalculationInputSchema = z.object({
  salary_amount: z.number().positive(),
  salary_currency: salaryCurrencyEnum,
  country: z.string(),
  bonus_amount: z.number().nonnegative().optional()
});

export type TaxCalculationInput = z.infer<typeof taxCalculationInputSchema>;

// Tax calculation response schema
export const taxCalculationResponseSchema = z.object({
  gross_salary: z.number(),
  net_salary: z.number(),
  tax_amount: z.number(),
  social_contributions: z.number(),
  effective_tax_rate: z.number(),
  currency: salaryCurrencyEnum,
  country: z.string()
});

export type TaxCalculationResponse = z.infer<typeof taxCalculationResponseSchema>;

// Location aggregation schema
export const locationStatsSchema = z.object({
  country: z.string().optional(),
  job_title: z.string().optional(),
  experience_level: experienceLevelEnum.optional()
});

export type LocationStatsInput = z.infer<typeof locationStatsSchema>;

export const locationStatsResponseSchema = z.object({
  location: z.string(),
  country: z.string(),
  city: z.string(),
  average_salary: z.number(),
  median_salary: z.number(),
  count: z.number().int(),
  currency_distribution: z.record(z.string(), z.number())
});

export type LocationStatsResponse = z.infer<typeof locationStatsResponseSchema>;