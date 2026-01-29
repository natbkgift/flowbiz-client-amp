// AMP Demo Website - Pure Calculation Functions
// This module contains pure functions for investment calculations
// These functions are framework-agnostic and can be tested independently

/**
 * Validates calculation input parameters
 * @param {Object} inputs - The calculation inputs
 * @param {number} inputs.propertyPrice - Property price in currency
 * @param {number} inputs.downPayment - Down payment percentage (0-100)
 * @param {number} inputs.interestRate - Annual interest rate percentage
 * @param {number} inputs.loanTerm - Loan term in years
 * @param {number} inputs.monthlyRent - Monthly rental income
 * @param {number} inputs.monthlyExpense - Monthly expenses
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateInputs(inputs) {
  const errors = [];
  
  if (inputs.propertyPrice <= 0) {
    errors.push('Property price must be greater than 0');
  }
  
  if (inputs.downPayment < 0 || inputs.downPayment > 100) {
    errors.push('Down payment must be between 0 and 100');
  }
  
  if (inputs.interestRate < 0) {
    errors.push('Interest rate cannot be negative');
  }
  
  if (inputs.loanTerm <= 0) {
    errors.push('Loan term must be greater than 0');
  }
  
  if (inputs.monthlyRent < 0) {
    errors.push('Monthly rent cannot be negative');
  }
  
  if (inputs.monthlyExpense < 0) {
    errors.push('Monthly expense cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates monthly loan payment using amortization formula
 * @param {number} loanAmount - Principal loan amount
 * @param {number} annualInterestRate - Annual interest rate percentage
 * @param {number} loanTermYears - Loan term in years
 * @returns {number} Monthly payment amount
 */
function calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermYears) {
  // Edge case: No loan or 100% down payment
  if (loanAmount <= 0) {
    return 0;
  }
  
  // Edge case: Zero interest rate (interest-free loan)
  if (annualInterestRate === 0) {
    const numberOfPayments = loanTermYears * 12;
    return loanAmount / numberOfPayments;
  }
  
  // Standard amortization formula
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  const monthlyPayment = loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  return monthlyPayment;
}

/**
 * Calculates gross rental yield
 * @param {number} annualRent - Annual rental income
 * @param {number} propertyPrice - Property price
 * @returns {number} Gross yield as a percentage
 */
function calculateGrossYield(annualRent, propertyPrice) {
  if (propertyPrice <= 0) {
    return 0;
  }
  return (annualRent / propertyPrice) * 100;
}

/**
 * Calculates net rental yield
 * @param {number} annualRent - Annual rental income
 * @param {number} annualExpense - Annual expenses
 * @param {number} propertyPrice - Property price
 * @returns {number} Net yield as a percentage
 */
function calculateNetYield(annualRent, annualExpense, propertyPrice) {
  if (propertyPrice <= 0) {
    return 0;
  }
  return ((annualRent - annualExpense) / propertyPrice) * 100;
}

/**
 * Calculates monthly cash flow
 * @param {number} monthlyRent - Monthly rental income
 * @param {number} monthlyExpense - Monthly expenses
 * @param {number} monthlyPayment - Monthly loan payment
 * @returns {number} Monthly cash flow
 */
function calculateMonthlyCashFlow(monthlyRent, monthlyExpense, monthlyPayment) {
  return monthlyRent - monthlyExpense - monthlyPayment;
}

/**
 * Calculates payback period in years
 * @param {number} downPaymentAmount - Initial down payment amount
 * @param {number} annualRent - Annual rental income
 * @param {number} annualExpense - Annual expenses
 * @param {number} annualLoanPayment - Annual loan payment
 * @returns {number} Payback period in years (0 if not profitable)
 */
function calculatePaybackPeriod(downPaymentAmount, annualRent, annualExpense, annualLoanPayment) {
  const netAnnualIncome = annualRent - annualExpense - annualLoanPayment;
  
  if (netAnnualIncome <= 0 || downPaymentAmount <= 0) {
    return 0;
  }
  
  return downPaymentAmount / netAnnualIncome;
}

/**
 * Main calculation function that orchestrates all calculations
 * @param {Object} inputs - The calculation inputs
 * @param {number} inputs.propertyPrice - Property price
 * @param {number} inputs.downPayment - Down payment percentage (0-100)
 * @param {number} inputs.interestRate - Annual interest rate percentage
 * @param {number} inputs.loanTerm - Loan term in years
 * @param {number} inputs.monthlyRent - Monthly rental income
 * @param {number} inputs.monthlyExpense - Monthly expenses
 * @returns {Object} Calculation results or validation errors
 */
function calculateInvestmentMetrics(inputs) {
  // Validate inputs
  const validation = validateInputs(inputs);
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors
    };
  }
  
  // Calculate loan details
  const downPaymentAmount = inputs.propertyPrice * (inputs.downPayment / 100);
  const loanAmount = inputs.propertyPrice - downPaymentAmount;
  
  // Calculate monthly payment
  const monthlyPayment = calculateMonthlyPayment(
    loanAmount, 
    inputs.interestRate, 
    inputs.loanTerm
  );
  
  // Calculate annual values
  const annualRent = inputs.monthlyRent * 12;
  const annualExpense = inputs.monthlyExpense * 12;
  const annualLoanPayment = monthlyPayment * 12;
  
  // Calculate yields
  const grossYield = calculateGrossYield(annualRent, inputs.propertyPrice);
  const netYield = calculateNetYield(annualRent, annualExpense, inputs.propertyPrice);
  
  // Calculate cash flow
  const monthlyCashFlow = calculateMonthlyCashFlow(
    inputs.monthlyRent,
    inputs.monthlyExpense,
    monthlyPayment
  );
  
  // Calculate payback period
  const paybackPeriod = calculatePaybackPeriod(
    downPaymentAmount,
    annualRent,
    annualExpense,
    annualLoanPayment
  );
  
  return {
    success: true,
    results: {
      grossYield,
      netYield,
      monthlyCashFlow,
      paybackPeriod,
      monthlyPayment,
      downPaymentAmount,
      loanAmount
    }
  };
}

// Export for use in other modules (CommonJS for Node.js/Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateInputs,
    calculateMonthlyPayment,
    calculateGrossYield,
    calculateNetYield,
    calculateMonthlyCashFlow,
    calculatePaybackPeriod,
    calculateInvestmentMetrics
  };
}
