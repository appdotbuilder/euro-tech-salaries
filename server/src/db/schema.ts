import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Define PostgreSQL enums
export const salaryCurrencyEnum = pgEnum('salary_currency', ['EUR', 'USD', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK']);
export const experienceLevelEnum = pgEnum('experience_level', ['entry', 'junior', 'mid', 'senior', 'staff', 'principal', 'director']);
export const employmentTypeEnum = pgEnum('employment_type', ['full_time', 'part_time', 'contract', 'freelance']);
export const workArrangementEnum = pgEnum('work_arrangement', ['remote', 'hybrid', 'onsite']);
export const companySizeEnum = pgEnum('company_size', ['startup', 'small', 'medium', 'large', 'enterprise']);

// Main salary records table
export const salaryRecordsTable = pgTable('salary_records', {
  id: serial('id').primaryKey(),
  job_title: text('job_title').notNull(),
  company_name: text('company_name'), // Nullable for anonymity
  location_country: text('location_country').notNull(),
  location_city: text('location_city').notNull(),
  salary_amount: numeric('salary_amount', { precision: 12, scale: 2 }).notNull(), // Support large salaries with cents precision
  salary_currency: salaryCurrencyEnum('salary_currency').notNull(),
  experience_level: experienceLevelEnum('experience_level').notNull(),
  employment_type: employmentTypeEnum('employment_type').notNull(),
  work_arrangement: workArrangementEnum('work_arrangement').notNull(),
  company_size: companySizeEnum('company_size'), // Nullable, user might not know
  years_of_experience: integer('years_of_experience').notNull(),
  years_at_company: integer('years_at_company'), // Nullable, might be new hire
  bonus_amount: numeric('bonus_amount', { precision: 12, scale: 2 }), // Nullable, not everyone gets bonus
  stock_options: boolean('stock_options').notNull().default(false),
  benefits_description: text('benefits_description'), // Nullable, free text for benefits
  tech_stack: text('tech_stack'), // Nullable, JSON array stored as text (e.g., ["React", "Node.js", "PostgreSQL"])
  submission_date: timestamp('submission_date').defaultNow().notNull(),
  is_verified: boolean('is_verified').notNull().default(false), // For admin verification
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type SalaryRecord = typeof salaryRecordsTable.$inferSelect; // For SELECT operations
export type NewSalaryRecord = typeof salaryRecordsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  salaryRecords: salaryRecordsTable 
};