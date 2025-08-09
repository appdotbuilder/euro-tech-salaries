import { type TaxCalculationInput, type TaxCalculationResponse } from '../schema';

// Tax bracket interface for progressive tax systems
interface TaxBracket {
  min: number;
  max: number | null; // null means unlimited
  rate: number;
}

// Country-specific tax configuration
interface CountryTaxConfig {
  tax_brackets: TaxBracket[];
  social_contributions_rate: number;
  standard_deduction?: number; // Optional standard deduction
}

// Tax configurations for different countries (simplified but realistic)
const TAX_CONFIGS: Record<string, CountryTaxConfig> = {
  'United States': {
    tax_brackets: [
      { min: 0, max: 10275, rate: 0.10 },
      { min: 10275, max: 41775, rate: 0.12 },
      { min: 41775, max: 89450, rate: 0.22 },
      { min: 89450, max: 190750, rate: 0.24 },
      { min: 190750, max: 364200, rate: 0.32 },
      { min: 364200, max: 462500, rate: 0.35 },
      { min: 462500, max: null, rate: 0.37 }
    ],
    social_contributions_rate: 0.0765, // Social Security + Medicare
    standard_deduction: 13850
  },
  'Germany': {
    tax_brackets: [
      { min: 0, max: 10908, rate: 0.00 },
      { min: 10908, max: 62810, rate: 0.14 }, // Progressive from 14% to 42%
      { min: 62810, max: 277826, rate: 0.42 },
      { min: 277826, max: null, rate: 0.45 }
    ],
    social_contributions_rate: 0.20, // Health, pension, unemployment insurance
    standard_deduction: 1230
  },
  'United Kingdom': {
    tax_brackets: [
      { min: 0, max: 12570, rate: 0.00 }, // Personal allowance
      { min: 12570, max: 50270, rate: 0.20 },
      { min: 50270, max: 125140, rate: 0.40 },
      { min: 125140, max: null, rate: 0.45 }
    ],
    social_contributions_rate: 0.12, // National Insurance
    standard_deduction: 0
  },
  'France': {
    tax_brackets: [
      { min: 0, max: 10777, rate: 0.00 },
      { min: 10777, max: 27478, rate: 0.11 },
      { min: 27478, max: 78570, rate: 0.30 },
      { min: 78570, max: 168994, rate: 0.41 },
      { min: 168994, max: null, rate: 0.45 }
    ],
    social_contributions_rate: 0.22, // Social security contributions
    standard_deduction: 0
  },
  'Canada': {
    tax_brackets: [
      { min: 0, max: 53359, rate: 0.15 },
      { min: 53359, max: 106717, rate: 0.205 },
      { min: 106717, max: 165430, rate: 0.26 },
      { min: 165430, max: 235675, rate: 0.29 },
      { min: 235675, max: null, rate: 0.33 }
    ],
    social_contributions_rate: 0.0595, // CPP + EI
    standard_deduction: 15000
  },
  'Sweden': {
    tax_brackets: [
      { min: 0, max: 2100, rate: 0.00 }, // Basic allowance (~22,300 SEK)
      { min: 2100, max: 56250, rate: 0.32 }, // Municipal + state tax
      { min: 56250, max: null, rate: 0.52 } // High earner tax
    ],
    social_contributions_rate: 0.07, // Employee contributions
    standard_deduction: 2100 // Basic deduction in USD equivalent
  },
  'Netherlands': {
    tax_brackets: [
      { min: 0, max: 37149, rate: 0.367 },
      { min: 37149, max: null, rate: 0.495 }
    ],
    social_contributions_rate: 0.00, // Included in tax brackets
    standard_deduction: 3070
  }
};

// Default configuration for countries not in the list
const DEFAULT_TAX_CONFIG: CountryTaxConfig = {
  tax_brackets: [
    { min: 0, max: 20000, rate: 0.10 },
    { min: 20000, max: 50000, rate: 0.20 },
    { min: 50000, max: 100000, rate: 0.30 },
    { min: 100000, max: null, rate: 0.35 }
  ],
  social_contributions_rate: 0.15,
  standard_deduction: 5000
};

// Currency conversion rates to USD (simplified - in real app would use live rates)
const CURRENCY_TO_USD: Record<string, number> = {
  'EUR': 1.08,
  'USD': 1.00,
  'GBP': 1.25,
  'CHF': 1.10,
  'SEK': 0.094, // ~10.6 SEK per USD
  'NOK': 0.092,
  'DKK': 0.145,
  'PLN': 0.25,
  'CZK': 0.044
};

function calculateProgressiveTax(income: number, brackets: TaxBracket[]): number {
  let totalTax = 0;

  for (const bracket of brackets) {
    if (income <= bracket.min) break;

    const bracketMax = bracket.max || income;
    const taxableInBracket = Math.min(income, bracketMax) - bracket.min;
    
    if (taxableInBracket > 0) {
      totalTax += taxableInBracket * bracket.rate;
    }
  }

  return totalTax;
}

function normalizeCountryName(country: string): string {
  // Handle common country name variations
  const countryMappings: Record<string, string> = {
    'US': 'United States',
    'USA': 'United States',
    'UK': 'United Kingdom',
    'Britain': 'United Kingdom',
    'DE': 'Germany',
    'Deutschland': 'Germany',
    'FR': 'France',
    'CA': 'Canada',
    'SE': 'Sweden',
    'NL': 'Netherlands',
    'Holland': 'Netherlands'
  };

  const normalized = countryMappings[country] || country;
  
  // Find case-insensitive match
  const exactMatch = Object.keys(TAX_CONFIGS).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );
  
  return exactMatch || country;
}

export const calculateTax = async (input: TaxCalculationInput): Promise<TaxCalculationResponse> => {
  try {
    // Normalize country name and get tax configuration
    const normalizedCountry = normalizeCountryName(input.country);
    const taxConfig = TAX_CONFIGS[normalizedCountry] || DEFAULT_TAX_CONFIG;

    // Convert salary to USD for consistent calculation if needed
    const usdRate = CURRENCY_TO_USD[input.salary_currency] || 1;
    let annualSalaryUSD = input.salary_amount * usdRate;

    // Add bonus if provided
    const totalBonusUSD = (input.bonus_amount || 0) * usdRate;
    const totalGrossUSD = annualSalaryUSD + totalBonusUSD;

    // Apply standard deduction if available
    const standardDeduction = taxConfig.standard_deduction || 0;
    const taxableIncome = Math.max(0, totalGrossUSD - standardDeduction);

    // Calculate progressive income tax
    const incomeTax = calculateProgressiveTax(taxableIncome, taxConfig.tax_brackets);

    // Calculate social contributions (usually on gross income)
    const socialContributions = totalGrossUSD * taxConfig.social_contributions_rate;

    // Total tax burden
    const totalTaxUSD = incomeTax + socialContributions;

    // Net salary
    const netSalaryUSD = totalGrossUSD - totalTaxUSD;

    // Calculate effective tax rate
    const effectiveTaxRate = totalGrossUSD > 0 ? totalTaxUSD / totalGrossUSD : 0;

    // Convert back to original currency if needed
    // Round to avoid floating point precision issues
    const roundToTwo = (num: number) => Math.round(num * 100) / 100;
    
    if (input.salary_currency === 'USD') {
      // No conversion needed for USD
      return {
        gross_salary: roundToTwo(totalGrossUSD),
        net_salary: roundToTwo(Math.max(0, netSalaryUSD)),
        tax_amount: roundToTwo(incomeTax),
        social_contributions: roundToTwo(socialContributions),
        effective_tax_rate: Math.round(effectiveTaxRate * 10000) / 100,
        currency: input.salary_currency,
        country: input.country
      };
    } else {
      // Convert back from USD
      const conversionRate = 1 / usdRate;
      
      return {
        gross_salary: roundToTwo(totalGrossUSD * conversionRate),
        net_salary: roundToTwo(Math.max(0, netSalaryUSD * conversionRate)),
        tax_amount: roundToTwo(incomeTax * conversionRate),
        social_contributions: roundToTwo(socialContributions * conversionRate),
        effective_tax_rate: Math.round(effectiveTaxRate * 10000) / 100,
        currency: input.salary_currency,
        country: input.country
      };
    }
  } catch (error) {
    console.error('Tax calculation failed:', error);
    throw error;
  }
};