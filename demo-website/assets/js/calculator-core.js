/*
  Minimal investment calculator logic used by Jest tests.
  CommonJS exports to keep compatibility with Node test runner.
*/

function calculateMonthlyPayment(loanAmount, interestRate, loanTermYears) {
  const P = Number(loanAmount);
  const annualRate = Number(interestRate);
  const years = Number(loanTermYears);

  if (!Number.isFinite(P) || P <= 0) return 0;

  const n = years * 12;
  if (!Number.isFinite(n) || n === 0) return P / n; // will be Infinity/NaN for n=0 (expected by tests)

  const r = annualRate / 100 / 12;
  if (!Number.isFinite(r) || r === 0) {
    return P / n;
  }

  const pow = Math.pow(1 + r, n);
  return (P * r * pow) / (pow - 1);
}

function calculateGrossYield(annualRent, propertyPrice) {
  const rent = Number(annualRent);
  const price = Number(propertyPrice);
  if (!Number.isFinite(rent) || !Number.isFinite(price) || price <= 0 || rent <= 0) return 0;
  return (rent / price) * 100;
}

function calculateNetYield(annualRent, annualExpense, propertyPrice) {
  const rent = Number(annualRent);
  const exp = Number(annualExpense);
  const price = Number(propertyPrice);
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (!Number.isFinite(rent) || !Number.isFinite(exp)) return 0;
  return ((rent - exp) / price) * 100;
}

function calculateMonthlyCashFlow(monthlyRent, monthlyExpense, monthlyPayment) {
  return Number(monthlyRent) - Number(monthlyExpense) - Number(monthlyPayment);
}

function calculatePaybackPeriod(downPaymentAmount, annualRent, annualExpense, annualLoanPayment) {
  const down = Number(downPaymentAmount);
  if (!Number.isFinite(down) || down <= 0) return 0;

  const net = Number(annualRent) - Number(annualExpense) - Number(annualLoanPayment);
  if (!Number.isFinite(net) || net <= 0) return 0;

  return down / net;
}

function calculateInvestmentMetrics(inputs) {
  const propertyPrice = Number(inputs?.propertyPrice ?? 0);
  const downPaymentPct = Number(inputs?.downPayment ?? 0);
  const interestRate = Number(inputs?.interestRate ?? 0);
  const loanTerm = Number(inputs?.loanTerm ?? 0);
  const monthlyRent = Number(inputs?.monthlyRent ?? 0);
  const monthlyExpense = Number(inputs?.monthlyExpense ?? 0);

  const downPaymentAmount = propertyPrice * (downPaymentPct / 100);
  const loanAmount = propertyPrice - downPaymentAmount;

  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

  const annualRent = monthlyRent * 12;
  const annualExpense = monthlyExpense * 12;
  const annualLoanPayment = monthlyPayment * 12;

  const grossYield = calculateGrossYield(annualRent, propertyPrice);
  const netYield = calculateNetYield(annualRent, annualExpense, propertyPrice);
  const monthlyCashFlow = calculateMonthlyCashFlow(monthlyRent, monthlyExpense, monthlyPayment);
  const paybackPeriod = calculatePaybackPeriod(
    downPaymentAmount,
    annualRent,
    annualExpense,
    annualLoanPayment
  );

  return {
    propertyPrice,
    downPayment: downPaymentPct,
    interestRate,
    loanTerm,
    monthlyRent,
    monthlyExpense,

    downPaymentAmount,
    loanAmount,
    monthlyPayment,

    grossYield,
    netYield,
    monthlyCashFlow,
    paybackPeriod
  };
}

function generateCashFlowProjection(inputs, years) {
  const months = Math.max(0, Math.floor(Number(years) * 12));

  const propertyPrice = Number(inputs?.propertyPrice ?? 0);
  const downPaymentPct = Number(inputs?.downPayment ?? 0);
  const interestRate = Number(inputs?.interestRate ?? 0);
  const loanTermYears = Number(inputs?.loanTerm ?? 0);
  const monthlyRent = Number(inputs?.monthlyRent ?? 0);
  const monthlyExpense = Number(inputs?.monthlyExpense ?? 0);

  const downPaymentAmount = propertyPrice * (downPaymentPct / 100);
  const loanAmount = propertyPrice - downPaymentAmount;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTermYears);

  const loanMonths = Math.max(0, Math.floor(loanTermYears * 12));

  const out = [];
  for (let i = 1; i <= months; i += 1) {
    const loanPayment = i <= loanMonths ? monthlyPayment : 0;
    const netCashFlow = calculateMonthlyCashFlow(monthlyRent, monthlyExpense, loanPayment);

    out.push({
      month: i,
      rentIncome: monthlyRent,
      expenses: monthlyExpense,
      loanPayment,
      netCashFlow
    });
  }

  return out;
}

module.exports = {
  calculateMonthlyPayment,
  calculateGrossYield,
  calculateNetYield,
  calculateMonthlyCashFlow,
  calculatePaybackPeriod,
  calculateInvestmentMetrics,
  generateCashFlowProjection
};
