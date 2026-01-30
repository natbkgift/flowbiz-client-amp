// AMP Demo Website - Pure Calculation Functions
// This module contains pure functions for investment calculations
// These functions are framework-agnostic and can be tested independently
// Note: Input validation is handled in calculator.js where i18n is available

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
  
  const numberOfPayments = loanTermYears * 12;
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  
  // Edge case: Zero interest rate (interest-free loan)
  // Monthly payment is principal divided equally by total months
  if (monthlyInterestRate === 0) {
    return loanAmount / numberOfPayments;
  }
  
  // Standard amortization formula:
  // payment = P * r(1+r)^n / ((1+r)^n - 1)
  
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
 * @returns {Object} Calculation results
 * @note Input validation should be performed by the caller before calling this function
 */
function calculateInvestmentMetrics(inputs) {
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
    grossYield,
    netYield,
    monthlyCashFlow,
    paybackPeriod,
    monthlyPayment,
    downPaymentAmount,
    loanAmount
  };
}

// Export for use in other modules (CommonJS for Node.js/Jest)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateMonthlyPayment,
    calculateGrossYield,
    calculateNetYield,
    calculateMonthlyCashFlow,
    calculatePaybackPeriod,
    calculateInvestmentMetrics
  };
}
