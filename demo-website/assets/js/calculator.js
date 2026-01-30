// AMP Demo Website - Investment Calculator
// ROI and yield calculation logic

function formatCurrency(num) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
}

const calculatorFieldRules = [
  {
    inputId: 'property-price',
    errorId: 'error-property-price',
    defaultValue: 3000000,
    errorKey: 'calc_error_invalid_price',
    isInvalid: (value) => value <= 0
  },
  {
    inputId: 'down-payment',
    errorId: 'error-down-payment',
    defaultValue: 30,
    errorKey: 'calc_error_invalid_down_payment',
    isInvalid: (value) => value < 0 || value > 100
  },
  {
    inputId: 'interest-rate',
    errorId: 'error-interest-rate',
    defaultValue: 4.5,
    errorKey: 'calc_error_negative_value',
    isInvalid: (value) => value < 0 || value > 20
  },
  {
    inputId: 'loan-term',
    errorId: 'error-loan-term',
    defaultValue: 20,
    errorKey: 'calc_error_negative_value',
    isInvalid: (value) => value <= 0 || value > 30
  },
  {
    inputId: 'monthly-rent',
    errorId: 'error-monthly-rent',
    defaultValue: 15000,
    errorKey: 'calc_error_invalid_rent',
    isInvalid: (value) => value <= 0
  },
  {
    inputId: 'monthly-expense',
    errorId: 'error-monthly-expense',
    defaultValue: 3000,
    errorKey: 'calc_error_negative_value',
    isInvalid: (value) => value < 0
  }
];

let calculatorFields = [];

function initializeCalculatorFields() {
  calculatorFields = calculatorFieldRules.map(rule => ({
    ...rule,
    input: document.getElementById(rule.inputId),
    error: document.getElementById(rule.errorId)
  }));
}

function updateCalculateButtonState(isFormValid) {
  const calculateBtn = document.getElementById('calculate-btn');
  if (calculateBtn) {
    calculateBtn.disabled = !isFormValid;
  }
}

function updateFieldStatus(field, status) {
  if (!field?.input) {
    return;
  }
  field.input.classList.remove('status-neutral', 'status-valid', 'status-invalid');
  field.input.classList.add(`status-${status}`);
}

function validateField(field) {
  if (!field?.input) {
    return true;
  }
  const value = parseFloat(field.input.value);
  const hasValue = !Number.isNaN(value);
  const isInvalid = !hasValue || field.isInvalid(value);
  if (field.error) {
    field.error.textContent = isInvalid ? t(field.errorKey) : '';
  }
  updateFieldStatus(field, isInvalid ? 'invalid' : 'valid');
  return !isInvalid;
}

function validateCalculatorForm() {
  let isFormValid = true;
  calculatorFields.forEach(field => {
    if (!validateField(field)) {
      isFormValid = false;
    }
  });
  updateCalculateButtonState(isFormValid);
  return isFormValid;
}

function readCalculatorInputs() {
  const values = {};
  calculatorFields.forEach(field => {
    const parsedValue = parseFloat(field?.input?.value);
    values[field.inputId] = Number.isNaN(parsedValue) ? 0 : parsedValue;
  });
  return {
    propertyPrice: values['property-price'] ?? 0,
    downPayment: values['down-payment'] ?? 0,
    interestRate: values['interest-rate'] ?? 0,
    loanTerm: values['loan-term'] ?? 0,
    monthlyRent: values['monthly-rent'] ?? 0,
    monthlyExpense: values['monthly-expense'] ?? 0
  };
}

function calculateInvestment() {
  if (!validateCalculatorForm()) {
    return;
  }

  const inputs = readCalculatorInputs();

  const results = calculateInvestmentMetrics(inputs);
  const projection = generateCashFlowProjection(inputs, 10);
  lastProjection = projection;

  displayResults(results, projection);
}

function displayResults(results, projection) {
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

  renderCashFlowProjection(projection);
}

function downloadPDF() {
  const lang = document.documentElement.lang || 'th';
  const message = lang === 'th' 
    ? 'ฟีเจอร์ดาวน์โหลด PDF จะพร้อมใช้งานเร็วๆ นี้'
    : 'PDF download feature coming soon';
  alert(message);
}

let cashFlowChartInstance = null;
let lastProjection = null;

function renderCashFlowProjection(projection) {
  if (!projection || projection.length === 0) {
    return;
  }
  const projectionSection = document.getElementById('cash-flow-projection');
  if (!projectionSection) {
    return;
  }

  projectionSection.style.display = 'block';

  const tableBody = document.getElementById('cash-flow-table-body');
  if (tableBody) {
    tableBody.innerHTML = projection.map(entry => {
      return `
        <tr>
          <td>${entry.month}</td>
          <td>${formatCurrency(entry.income)}</td>
          <td>${formatCurrency(entry.expenses)}</td>
          <td>${formatCurrency(entry.loanPayment)}</td>
          <td class="${entry.netCashFlow >= 0 ? 'positive' : 'negative'}">${formatCurrency(entry.netCashFlow)}</td>
        </tr>
      `;
    }).join('');
  }

  renderCashFlowChart(projection);
}

function renderCashFlowChart(projection) {
  const chartCanvas = document.getElementById('cash-flow-chart');
  if (!chartCanvas || typeof Chart === 'undefined') {
    return;
  }

  const labels = projection.map(entry => entry.month);
  const dataPoints = projection.map(entry => Math.round(entry.netCashFlow));
  const chartLabel = t('calc_projection_chart_label');

  if (cashFlowChartInstance) {
    cashFlowChartInstance.destroy();
  }

  cashFlowChartInstance = new Chart(chartCanvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: chartLabel,
          data: dataPoints,
          borderColor: '#1E4DB7',
          backgroundColor: 'rgba(30, 77, 183, 0.15)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 12
          }
        },
        y: {
          ticks: {
            callback: (value) => formatCurrency(value)
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `${chartLabel}: ${formatCurrency(context.parsed.y)}`
          }
        }
      }
    }
  });
}


// Initialize calculator on page load
function initCalculator() {
  initializeCalculatorFields();
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
    input.addEventListener('input', validateCalculatorForm);
  });

  document.addEventListener('languageChanged', () => {
    validateCalculatorForm();
    if (cashFlowChartInstance) {
      cashFlowChartInstance.destroy();
      cashFlowChartInstance = null;
    }
    if (lastProjection) {
      renderCashFlowProjection(lastProjection);
    }
  });

  calculatorFields.forEach(field => {
    updateFieldStatus(field, 'neutral');
  });
  validateCalculatorForm();
}

// Run on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCalculator);
} else {
  initCalculator();
}
