import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type TaxCalculationInput } from '../schema';
import { calculateTax } from '../handlers/calculate_tax';

describe('calculateTax', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should calculate tax for US salary', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 75000,
      salary_currency: 'USD',
      country: 'United States'
    };

    const result = await calculateTax(input);

    expect(result.gross_salary).toEqual(75000);
    expect(result.currency).toEqual('USD');
    expect(result.country).toEqual('United States');
    expect(result.net_salary).toBeLessThan(result.gross_salary);
    expect(result.tax_amount).toBeGreaterThan(0);
    expect(result.social_contributions).toBeGreaterThan(0);
    expect(result.effective_tax_rate).toBeGreaterThan(0);
    expect(result.effective_tax_rate).toBeLessThan(50); // Should be reasonable percentage
    expect(typeof result.effective_tax_rate).toBe('number');
  });

  it('should calculate tax with bonus amount', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 60000,
      salary_currency: 'USD',
      country: 'United States',
      bonus_amount: 10000
    };

    const result = await calculateTax(input);

    expect(result.gross_salary).toEqual(70000); // 60k + 10k bonus
    expect(result.tax_amount).toBeGreaterThan(0);
    expect(result.social_contributions).toBeGreaterThan(0);
    expect(result.net_salary).toBeLessThan(70000);
    expect(result.effective_tax_rate).toBeGreaterThan(15); // With bonus should be higher rate
  });

  it('should handle zero bonus amount', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 50000,
      salary_currency: 'EUR',
      country: 'Germany',
      bonus_amount: 0
    };

    const result = await calculateTax(input);

    expect(result.gross_salary).toEqual(50000);
    expect(result.currency).toEqual('EUR');
    expect(result.net_salary).toBeLessThan(result.gross_salary);
  });

  it('should calculate tax for different countries', async () => {
    const baseInput = {
      salary_amount: 50000,
      salary_currency: 'EUR' as const
    };

    const germanyResult = await calculateTax({
      ...baseInput,
      country: 'Germany'
    });

    const franceResult = await calculateTax({
      ...baseInput,
      country: 'France'
    });

    // Different countries should have different tax calculations
    expect(germanyResult.effective_tax_rate).not.toEqual(franceResult.effective_tax_rate);
    expect(germanyResult.net_salary).not.toEqual(franceResult.net_salary);
    expect(germanyResult.tax_amount).not.toEqual(franceResult.tax_amount);
  });

  it('should handle country name variations', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 40000,
      salary_currency: 'USD',
      country: 'US' // Should map to 'United States'
    };

    const result = await calculateTax(input);

    expect(result.country).toEqual('US');
    expect(result.net_salary).toBeLessThan(result.gross_salary);
    expect(result.effective_tax_rate).toBeGreaterThan(0);
  });

  it('should use default tax config for unknown countries', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 45000,
      salary_currency: 'USD',
      country: 'Unknown Country'
    };

    const result = await calculateTax(input);

    expect(result.gross_salary).toEqual(45000);
    expect(result.country).toEqual('Unknown Country');
    expect(result.net_salary).toBeLessThan(result.gross_salary);
    expect(result.effective_tax_rate).toBeGreaterThan(0);
    expect(result.effective_tax_rate).toBeLessThan(50); // Should use reasonable default
  });

  it('should calculate progressive tax correctly for high income', async () => {
    const lowIncomeInput: TaxCalculationInput = {
      salary_amount: 30000,
      salary_currency: 'USD',
      country: 'United States'
    };

    const highIncomeInput: TaxCalculationInput = {
      salary_amount: 200000,
      salary_currency: 'USD',
      country: 'United States'
    };

    const lowIncomeResult = await calculateTax(lowIncomeInput);
    const highIncomeResult = await calculateTax(highIncomeInput);

    // Higher income should have higher effective tax rate (progressive system)
    expect(highIncomeResult.effective_tax_rate).toBeGreaterThan(lowIncomeResult.effective_tax_rate);
    expect(highIncomeResult.tax_amount).toBeGreaterThan(lowIncomeResult.tax_amount * 2);
  });

  it('should handle different currencies correctly', async () => {
    const usdInput: TaxCalculationInput = {
      salary_amount: 50000,
      salary_currency: 'USD',
      country: 'United States'
    };

    const eurInput: TaxCalculationInput = {
      salary_amount: 50000,
      salary_currency: 'EUR',
      country: 'Germany'
    };

    const usdResult = await calculateTax(usdInput);
    const eurResult = await calculateTax(eurInput);

    expect(usdResult.currency).toEqual('USD');
    expect(eurResult.currency).toEqual('EUR');
    expect(usdResult.gross_salary).toEqual(50000);
    expect(eurResult.gross_salary).toEqual(50000);
  });

  it('should handle UK tax system correctly', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 35000,
      salary_currency: 'GBP',
      country: 'United Kingdom'
    };

    const result = await calculateTax(input);

    expect(result.currency).toEqual('GBP');
    expect(result.gross_salary).toEqual(35000);
    expect(result.net_salary).toBeLessThan(result.gross_salary);
    // UK has personal allowance, so effective rate should be reasonable
    expect(result.effective_tax_rate).toBeGreaterThan(15);
    expect(result.effective_tax_rate).toBeLessThan(35);
  });

  it('should handle zero income edge case', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 0,
      salary_currency: 'USD',
      country: 'United States'
    };

    const result = await calculateTax(input);

    expect(result.gross_salary).toEqual(0);
    expect(result.net_salary).toEqual(0);
    expect(result.tax_amount).toEqual(0);
    expect(result.social_contributions).toEqual(0);
    expect(result.effective_tax_rate).toEqual(0);
  });

  it('should calculate tax for very low income with personal allowance', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 8000,
      salary_currency: 'USD',
      country: 'United States'
    };

    const result = await calculateTax(input);

    expect(result.gross_salary).toEqual(8000);
    // With standard deduction, should have very low or zero income tax
    expect(result.effective_tax_rate).toBeLessThan(15);
    expect(result.net_salary).toBeGreaterThan(6000); // Should keep most of it
  });

  it('should handle Nordic country high tax rates', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 700000, // Higher Swedish salary (~$66k USD)
      salary_currency: 'SEK',
      country: 'Sweden'
    };

    const result = await calculateTax(input);

    expect(result.currency).toEqual('SEK');
    expect(result.gross_salary).toEqual(700000);
    expect(result.net_salary).toBeLessThan(result.gross_salary);
    // Sweden should have meaningful tax rate after conversions and deductions
    expect(result.effective_tax_rate).toBeGreaterThan(20);
    expect(result.tax_amount).toBeGreaterThan(0);
    expect(result.social_contributions).toBeGreaterThan(0);
  });

  it('should handle case insensitive country matching', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 45000,
      salary_currency: 'EUR',
      country: 'germany' // lowercase
    };

    const result = await calculateTax(input);

    expect(result.country).toEqual('germany');
    expect(result.net_salary).toBeLessThan(result.gross_salary);
    expect(result.effective_tax_rate).toBeGreaterThan(0);
  });

  it('should ensure net salary is never negative', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 1000, // Very low amount
      salary_currency: 'USD',
      country: 'United States'
    };

    const result = await calculateTax(input);

    expect(result.net_salary).toBeGreaterThanOrEqual(0);
    expect(result.gross_salary).toEqual(1000);
  });

  it('should return reasonable values for all numeric fields', async () => {
    const input: TaxCalculationInput = {
      salary_amount: 65000,
      salary_currency: 'USD',
      country: 'Canada',
      bonus_amount: 5000
    };

    const result = await calculateTax(input);

    // All numeric fields should be finite numbers
    expect(Number.isFinite(result.gross_salary)).toBe(true);
    expect(Number.isFinite(result.net_salary)).toBe(true);
    expect(Number.isFinite(result.tax_amount)).toBe(true);
    expect(Number.isFinite(result.social_contributions)).toBe(true);
    expect(Number.isFinite(result.effective_tax_rate)).toBe(true);

    // Values should be non-negative
    expect(result.gross_salary).toBeGreaterThanOrEqual(0);
    expect(result.net_salary).toBeGreaterThanOrEqual(0);
    expect(result.tax_amount).toBeGreaterThanOrEqual(0);
    expect(result.social_contributions).toBeGreaterThanOrEqual(0);
    expect(result.effective_tax_rate).toBeGreaterThanOrEqual(0);

    // Effective tax rate should be a reasonable percentage (0-100)
    expect(result.effective_tax_rate).toBeLessThanOrEqual(100);
  });
});