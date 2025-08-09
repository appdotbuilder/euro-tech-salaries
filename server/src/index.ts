import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createSalaryRecordInputSchema,
  searchSalaryRecordsInputSchema,
  updateSalaryRecordInputSchema,
  compareSalariesInputSchema,
  salaryStatisticsSchema,
  taxCalculationInputSchema,
  locationStatsSchema
} from './schema';

// Import handlers
import { createSalaryRecord } from './handlers/create_salary_record';
import { searchSalaryRecords } from './handlers/search_salary_records';
import { getSalaryRecord } from './handlers/get_salary_record';
import { updateSalaryRecord } from './handlers/update_salary_record';
import { compareSalaries } from './handlers/compare_salaries';
import { getSalaryStatistics } from './handlers/get_salary_statistics';
import { calculateTax } from './handlers/calculate_tax';
import { getLocationStats } from './handlers/get_location_stats';
import { getAllSalaryRecords } from './handlers/get_all_salary_records';
import { 
  getUniqueJobTitles, 
  getUniqueCountries, 
  getUniqueCities, 
  getUniqueTechnologies 
} from './handlers/get_unique_values';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Salary record management
  createSalaryRecord: publicProcedure
    .input(createSalaryRecordInputSchema)
    .mutation(({ input }) => createSalaryRecord(input)),

  searchSalaryRecords: publicProcedure
    .input(searchSalaryRecordsInputSchema)
    .query(({ input }) => searchSalaryRecords(input)),

  getSalaryRecord: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSalaryRecord(input.id)),

  getAllSalaryRecords: publicProcedure
    .query(() => getAllSalaryRecords()),

  updateSalaryRecord: publicProcedure
    .input(updateSalaryRecordInputSchema)
    .mutation(({ input }) => updateSalaryRecord(input)),

  // Salary comparison and analysis
  compareSalaries: publicProcedure
    .input(compareSalariesInputSchema)
    .query(({ input }) => compareSalaries(input)),

  getSalaryStatistics: publicProcedure
    .input(salaryStatisticsSchema)
    .query(({ input }) => getSalaryStatistics(input)),

  getLocationStats: publicProcedure
    .input(locationStatsSchema)
    .query(({ input }) => getLocationStats(input)),

  // Tax calculation
  calculateTax: publicProcedure
    .input(taxCalculationInputSchema)
    .query(({ input }) => calculateTax(input)),

  // Utility endpoints for dropdowns and autocomplete
  getUniqueJobTitles: publicProcedure
    .query(() => getUniqueJobTitles()),

  getUniqueCountries: publicProcedure
    .query(() => getUniqueCountries()),

  getUniqueCities: publicProcedure
    .input(z.object({ country: z.string().optional() }))
    .query(({ input }) => getUniqueCities(input.country)),

  getUniqueTechnologies: publicProcedure
    .query(() => getUniqueTechnologies()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`European Tech Salary Explorer TRPC server listening at port: ${port}`);
}

start();