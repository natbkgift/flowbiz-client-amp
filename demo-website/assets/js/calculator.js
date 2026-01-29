// AMP Demo Website - Investment Calculator
// ROI and yield calculation logic

function calculateInvestment() {
  // Get current language for error messages
  const lang = document.documentElement.lang || 'th';
  
  // Get input values
  const propertyPrice = parseFloat(document.getElementById('property-price')?.value) || 0;
  const downPayment = parseFloat(document.getElementById('down-payment')?.value) || 30;
  const interestRate = parseFloat(document.getElementById('interest-rate')?.value) || 4.5;
  const loanTerm = parseFloat(document.getElementById('loan-term')?.value) || 20;
  const monthlyRent = parseFloat(document.getElementById('monthly-rent')?.value) || 0;
  const monthlyExpense = parseFloat(document.getElementById('monthly-expense')?.value) || 0;
  
  // Validation with i18n error messages
  if (propertyPrice <= 0) {
    alert(t('calc_error_invalid_price'));
    return;
  }
  
  if (downPayment < 0 || downPayment > 100) {
    alert(t('calc_error_invalid_down_payment'));
    return;
  }
  
  if (interestRate < 0) {
    alert(t('calc_error_negative_value'));
    return;
  }
  
  if (loanTerm <= 0) {
    alert(t('calc_error_negative_value'));
    return;
  }
  
  if (monthlyRent <= 0) {
    alert(t('calc_error_invalid_rent'));
    return;
  }
  
  if (monthlyExpense < 0) {
    alert(t('calc_error_negative_value'));
    return;
  }
  
  // Prepare inputs for calculation
  const inputs = {
    propertyPrice,
    downPayment,
    interestRate,
    loanTerm,
    monthlyRent,
    monthlyExpense
  };
  
  // Use the core calculation function
  const results = calculateInvestmentMetrics(inputs);
  
  // Display results
  displayResults(results);
}

function displayResults(results) {
  // Format currency
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };
  
  // Format percentage
  const formatPercent = (num) => {
    return num.toFixed(2) + '%';
  };
  
  // Update gross yield
  const grossYieldEl = document.getElementById('result-gross-yield');
  if (grossYieldEl) {
    grossYieldEl.textContent = formatPercent(results.grossYield);
    grossYieldEl.className = 'calculator-result-value';
    if (results.grossYield >= 6) {
      grossYieldEl.classList.add('positive');
    }
  }
  
  // Update net yield
  const netYieldEl = document.getElementById('result-net-yield');
  if (netYieldEl) {
    netYieldEl.textContent = formatPercent(results.netYield);
    netYieldEl.className = 'calculator-result-value';
    if (results.netYield >= 4) {
      netYieldEl.classList.add('positive');
    }
  }
  
  // Update monthly cash flow
  const cashFlowEl = document.getElementById('result-cash-flow');
  if (cashFlowEl) {
    cashFlowEl.textContent = formatCurrency(results.monthlyCashFlow);
    cashFlowEl.className = 'calculator-result-value';
    if (results.monthlyCashFlow >= 0) {
      cashFlowEl.classList.add('positive');
    } else {
      cashFlowEl.classList.add('negative');
    }
  }
  
  // Update payback period
  const paybackEl = document.getElementById('result-payback');
  if (paybackEl) {
    const years = Math.floor(results.paybackPeriod);
    const months = Math.round((results.paybackPeriod - years) * 12);
    
    if (results.paybackPeriod > 0 && results.paybackPeriod < 100) {
      const lang = document.documentElement.lang || 'th';
      if (lang === 'th') {
        paybackEl.textContent = `${years} ปี ${months} เดือน`;
      } else {
        paybackEl.textContent = `${years} years ${months} months`;
      }
    } else {
      paybackEl.textContent = results.paybackPeriod <= 0 ? 'N/A' : '> 100 years';
    }
    paybackEl.className = 'calculator-result-value';
  }
  
  // Show results section
  const resultsSection = document.getElementById('calculator-results');
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }
}

function downloadPDF() {
  const lang = document.documentElement.lang || 'th';
  const message = lang === 'th' 
    ? 'ฟีเจอร์ดาวน์โหลด PDF จะพร้อมใช้งานเร็วๆ นี้'
    : 'PDF download feature coming soon';
  alert(message);
}

// Initialize calculator on page load
function initCalculator() {
  const calculateBtn = document.getElementById('calculate-btn');
  if (calculateBtn) {
    calculateBtn.addEventListener('click', calculateInvestment);
  }
  
  const downloadBtn = document.getElementById('download-pdf-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', downloadPDF);
  }
  
  // Add Enter key support for inputs
  const inputs = document.querySelectorAll('.calculator-input');
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        calculateInvestment();
      }
    });
  });
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
