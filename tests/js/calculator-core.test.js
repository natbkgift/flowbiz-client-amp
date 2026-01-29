// Unit tests for calculator-core.js
// Testing investment calculation logic with edge cases

const {
  validateInputs,
  calculateMonthlyPayment,
  calculateGrossYield,
  calculateNetYield,
  calculateMonthlyCashFlow,
  calculatePaybackPeriod,
  calculateInvestmentMetrics
} = require('../../demo-website/assets/js/calculator-core.js');

describe('validateInputs', () => {
  test('should return valid for correct inputs', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should reject zero property price', () => {
    const inputs = {
      propertyPrice: 0,
      downPayment: 30,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Property price must be greater than 0');
  });
  
  test('should reject negative property price', () => {
    const inputs = {
      propertyPrice: -1000,
      downPayment: 30,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Property price must be greater than 0');
  });
  
  test('should reject down payment over 100%', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 150,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Down payment must be between 0 and 100');
  });
  
  test('should reject negative down payment', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: -10,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Down payment must be between 0 and 100');
  });
  
  test('should reject negative interest rate', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: -1,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Interest rate cannot be negative');
  });
  
  test('should reject negative monthly rent', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: -1000,
      monthlyExpense: 3000
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Monthly rent cannot be negative');
  });
  
  test('should reject negative monthly expense', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: -500
    };
    
    const result = validateInputs(inputs);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Monthly expense cannot be negative');
  });
});

describe('calculateMonthlyPayment', () => {
  test('should calculate correct monthly payment for standard loan', () => {
    const loanAmount = 2100000; // 3M property with 30% down
    const interestRate = 4.5;
    const loanTerm = 20;
    
    const payment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
    
    // Expected monthly payment is approximately 13,277 THB
    expect(payment).toBeGreaterThan(13000);
    expect(payment).toBeLessThan(14000);
  });
  
  test('should return 0 for zero loan amount (100% down payment)', () => {
    const payment = calculateMonthlyPayment(0, 4.5, 20);
    expect(payment).toBe(0);
  });
  
  test('should handle zero interest rate (interest-free loan)', () => {
    const loanAmount = 2100000;
    const interestRate = 0;
    const loanTerm = 20;
    
    const payment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
    
    // With 0% interest, payment should be loan amount / total months
    const expectedPayment = loanAmount / (loanTerm * 12);
    expect(payment).toBeCloseTo(expectedPayment, 2);
  });
  
  test('should handle very small loan amount', () => {
    const loanAmount = 100;
    const interestRate = 4.5;
    const loanTerm = 1;
    
    const payment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
    expect(payment).toBeGreaterThan(0);
    expect(payment).toBeLessThan(10);
  });
  
  test('should handle high interest rate', () => {
    const loanAmount = 2100000;
    const interestRate = 15;
    const loanTerm = 20;
    
    const payment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);
    expect(payment).toBeGreaterThan(20000); // Higher than normal
  });
});

describe('calculateGrossYield', () => {
  test('should calculate correct gross yield', () => {
    const annualRent = 180000; // 15,000 * 12
    const propertyPrice = 3000000;
    
    const yield_value = calculateGrossYield(annualRent, propertyPrice);
    expect(yield_value).toBeCloseTo(6, 2);
  });
  
  test('should return 0 for zero property price', () => {
    const yield_value = calculateGrossYield(180000, 0);
    expect(yield_value).toBe(0);
  });
  
  test('should handle zero rent', () => {
    const yield_value = calculateGrossYield(0, 3000000);
    expect(yield_value).toBe(0);
  });
});

describe('calculateNetYield', () => {
  test('should calculate correct net yield', () => {
    const annualRent = 180000;
    const annualExpense = 36000; // 3,000 * 12
    const propertyPrice = 3000000;
    
    const yield_value = calculateNetYield(annualRent, annualExpense, propertyPrice);
    expect(yield_value).toBeCloseTo(4.8, 2);
  });
  
  test('should return 0 for zero property price', () => {
    const yield_value = calculateNetYield(180000, 36000, 0);
    expect(yield_value).toBe(0);
  });
  
  test('should handle expenses higher than rent (negative yield)', () => {
    const annualRent = 100000;
    const annualExpense = 150000;
    const propertyPrice = 3000000;
    
    const yield_value = calculateNetYield(annualRent, annualExpense, propertyPrice);
    expect(yield_value).toBeLessThan(0);
    expect(yield_value).toBeCloseTo(-1.67, 1);
  });
});

describe('calculateMonthlyCashFlow', () => {
  test('should calculate positive cash flow', () => {
    const cashFlow = calculateMonthlyCashFlow(15000, 3000, 10000);
    expect(cashFlow).toBe(2000);
  });
  
  test('should calculate negative cash flow', () => {
    const cashFlow = calculateMonthlyCashFlow(10000, 3000, 15000);
    expect(cashFlow).toBe(-8000);
  });
  
  test('should handle zero payment (100% down)', () => {
    const cashFlow = calculateMonthlyCashFlow(15000, 3000, 0);
    expect(cashFlow).toBe(12000);
  });
  
  test('should handle zero rent', () => {
    const cashFlow = calculateMonthlyCashFlow(0, 3000, 10000);
    expect(cashFlow).toBe(-13000);
  });
});

describe('calculatePaybackPeriod', () => {
  test('should calculate correct payback period', () => {
    const downPaymentAmount = 900000; // 30% of 3M
    const annualRent = 180000;
    const annualExpense = 36000;
    const annualLoanPayment = 120000;
    
    const payback = calculatePaybackPeriod(
      downPaymentAmount,
      annualRent,
      annualExpense,
      annualLoanPayment
    );
    
    // Net annual income = 180000 - 36000 - 120000 = 24000
    // Payback = 900000 / 24000 = 37.5 years
    expect(payback).toBeCloseTo(37.5, 1);
  });
  
  test('should return 0 for negative net income', () => {
    const downPaymentAmount = 900000;
    const annualRent = 100000;
    const annualExpense = 50000;
    const annualLoanPayment = 150000;
    
    const payback = calculatePaybackPeriod(
      downPaymentAmount,
      annualRent,
      annualExpense,
      annualLoanPayment
    );
    
    expect(payback).toBe(0);
  });
  
  test('should return 0 for zero down payment', () => {
    const payback = calculatePaybackPeriod(0, 180000, 36000, 120000);
    expect(payback).toBe(0);
  });
  
  test('should handle 100% down payment (no loan payment)', () => {
    const downPaymentAmount = 3000000;
    const annualRent = 180000;
    const annualExpense = 36000;
    const annualLoanPayment = 0;
    
    const payback = calculatePaybackPeriod(
      downPaymentAmount,
      annualRent,
      annualExpense,
      annualLoanPayment
    );
    
    // Net annual income = 180000 - 36000 - 0 = 144000
    // Payback = 3000000 / 144000 = 20.83 years
    expect(payback).toBeCloseTo(20.83, 1);
  });
});

describe('calculateInvestmentMetrics - Integration Tests', () => {
  test('should calculate all metrics correctly for standard case', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
    expect(result.results.grossYield).toBeCloseTo(6, 1);
    expect(result.results.netYield).toBeCloseTo(4.8, 1);
    // Monthly payment for 2.1M loan at 4.5% over 20 years is ~13,285 THB
    // Cash flow = 15000 - 3000 - 13285 = -1285 (negative)
    expect(result.results.monthlyCashFlow).toBeLessThan(0);
    // Payback period is 0 because net income is negative
    expect(result.results.paybackPeriod).toBe(0);
    expect(result.results.downPaymentAmount).toBe(900000);
    expect(result.results.loanAmount).toBe(2100000);
  });
  
  test('should handle 100% down payment edge case', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 100,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(true);
    expect(result.results.loanAmount).toBe(0);
    expect(result.results.monthlyPayment).toBe(0);
    expect(result.results.monthlyCashFlow).toBe(12000); // rent - expense
    expect(result.results.grossYield).toBeCloseTo(6, 1);
  });
  
  test('should handle zero interest rate edge case', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: 0,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(true);
    expect(result.results.monthlyPayment).toBeCloseTo(8750, 0); // 2100000 / 240
    expect(result.results.monthlyCashFlow).toBeCloseTo(3250, 0);
  });
  
  test('should handle 0% down payment', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 0,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(true);
    expect(result.results.downPaymentAmount).toBe(0);
    expect(result.results.loanAmount).toBe(3000000);
    expect(result.results.monthlyPayment).toBeGreaterThan(0);
  });
  
  test('should return errors for invalid inputs', () => {
    const inputs = {
      propertyPrice: -1000,
      downPayment: 150,
      interestRate: -5,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });
  
  test('should handle zero rent (property with no income)', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: 4.5,
      loanTerm: 20,
      monthlyRent: 0,
      monthlyExpense: 3000
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(true);
    expect(result.results.grossYield).toBe(0);
    expect(result.results.netYield).toBeCloseTo(-1.2, 1); // negative due to expenses
    expect(result.results.monthlyCashFlow).toBeLessThan(0);
  });
  
  test('should handle very high interest rate', () => {
    const inputs = {
      propertyPrice: 3000000,
      downPayment: 30,
      interestRate: 20,
      loanTerm: 20,
      monthlyRent: 15000,
      monthlyExpense: 3000
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(true);
    expect(result.results.monthlyPayment).toBeGreaterThan(20000);
    expect(result.results.monthlyCashFlow).toBeLessThan(0); // Will be negative
  });
  
  test('should handle minimal values', () => {
    const inputs = {
      propertyPrice: 100000,
      downPayment: 10,
      interestRate: 1,
      loanTerm: 5,
      monthlyRent: 1000,
      monthlyExpense: 100
    };
    
    const result = calculateInvestmentMetrics(inputs);
    
    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
    expect(result.results.loanAmount).toBe(90000);
    expect(result.results.downPaymentAmount).toBe(10000);
  });
});
