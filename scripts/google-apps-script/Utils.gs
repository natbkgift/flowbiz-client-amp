/**
 * Utils.gs
 * 
 * Utility functions สำหรับ Lead Tracking Automation
 * ใช้ร่วมกันระหว่าง AutoReport.gs และ LineIntegration.gs
 */

/**
 * Get sheet by name or throw error if not found
 * 
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet} Sheet object
 * @throws {Error} If sheet not found
 */
function getSheetOrThrow(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  return sheet;
}

/**
 * Get sheet by name or create if not exists
 * 
 * @param {string} sheetName - Name of the sheet
 * @returns {Sheet} Sheet object
 */
function getSheetOrCreate(sheetName) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    Logger.log('Created new sheet: ' + sheetName);
  }
  
  return sheet;
}

/**
 * Normalize date to midnight (00:00:00)
 * Useful for date comparisons
 * 
 * @param {Date} date - Date to normalize
 * @returns {Date} Date at midnight
 */
function normalizeDateToMidnight(date) {
  if (!date || !(date instanceof Date)) {
    return null;
  }
  
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

/**
 * Format currency with symbol and thousand separators
 * 
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'THB')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'THB') {
  if (amount === null || amount === undefined || amount === '') {
    return '-';
  }
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) {
    return '-';
  }
  
  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  
  const symbols = {
    'THB': '฿',
    'USD': '$',
    'EUR': '€',
    'CNY': '¥',
    'RUB': '₽'
  };
  
  const symbol = symbols[currency] || currency + ' ';
  return symbol + formatted;
}

/**
 * Safely parse value to number
 * 
 * @param {*} value - Value to parse
 * @param {number} defaultValue - Default value if parse fails
 * @returns {number} Parsed number or default value
 */
function safeParseNumber(value, defaultValue = 0) {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Format date in Thai style
 * 
 * @param {Date} date - Date to format
 * @param {boolean} includeYear - Include year (default: true)
 * @returns {string} Formatted date string
 */
function formatThaiDate(date, includeYear = true) {
  if (!date || !(date instanceof Date)) {
    return '-';
  }
  
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = includeYear ? ' ' + (date.getFullYear() + 543) : '';
  
  return day + ' ' + month + year;
}

/**
 * Format date with Asia/Bangkok timezone
 * 
 * @param {Date} date - Date to format
 * @param {string} format - Format string (default: 'yyyy-MM-dd')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'yyyy-MM-dd') {
  if (!date || !(date instanceof Date)) {
    return '-';
  }
  
  return Utilities.formatDate(date, CONFIG.REPORTS.TIMEZONE, format);
}

/**
 * Get date range for "yesterday"
 * 
 * @returns {Object} Object with start and end dates
 */
function getYesterdayRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const yesterdayEnd = new Date(today);
  yesterdayEnd.setMilliseconds(-1);
  
  return {
    start: yesterday,
    end: yesterdayEnd
  };
}

/**
 * Get date range for "this week" (Monday to today)
 * 
 * @returns {Object} Object with start and end dates
 */
function getThisWeekRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const monday = new Date(today);
  monday.setDate(monday.getDate() - daysFromMonday);
  
  return {
    start: monday,
    end: today
  };
}

/**
 * Get date range for "last week" (previous Monday to Sunday)
 * 
 * @returns {Object} Object with start and end dates
 */
function getLastWeekRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const lastSunday = new Date(today);
  lastSunday.setDate(lastSunday.getDate() - daysFromMonday - 1);
  lastSunday.setHours(23, 59, 59, 999);
  
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastMonday.getDate() - 6);
  lastMonday.setHours(0, 0, 0, 0);
  
  return {
    start: lastMonday,
    end: lastSunday
  };
}

/**
 * Calculate days between two dates
 * 
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {number} Number of days
 */
function daysBetween(date1, date2) {
  if (!date1 || !date2) return 0;
  
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  const d1 = normalizeDateToMidnight(new Date(date1));
  const d2 = normalizeDateToMidnight(new Date(date2));
  
  return Math.round((d2 - d1) / oneDay);
}

/**
 * Check if date is today
 * 
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
function isToday(date) {
  if (!date) return false;
  
  const today = normalizeDateToMidnight(new Date());
  const checkDate = normalizeDateToMidnight(new Date(date));
  
  return today.getTime() === checkDate.getTime();
}

/**
 * Check if date is in the past (before today)
 * 
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
function isPast(date) {
  if (!date) return false;
  
  const today = normalizeDateToMidnight(new Date());
  const checkDate = normalizeDateToMidnight(new Date(date));
  
  return checkDate.getTime() < today.getTime();
}

/**
 * Get all data from a sheet (excluding header row)
 * 
 * @param {string} sheetName - Name of the sheet
 * @param {number} headerRows - Number of header rows to skip (default: 1)
 * @returns {Array} 2D array of sheet data
 */
function getSheetData(sheetName, headerRows = 1) {
  const sheet = getSheetOrThrow(sheetName);
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= headerRows) {
    return []; // No data rows
  }
  
  const lastCol = sheet.getLastColumn();
  const dataRange = sheet.getRange(headerRows + 1, 1, lastRow - headerRows, lastCol);
  return dataRange.getValues();
}

/**
 * Filter leads by criteria
 * 
 * @param {Array} leads - Array of lead rows
 * @param {Object} criteria - Filter criteria
 * @returns {Array} Filtered leads
 */
function filterLeads(leads, criteria) {
  return leads.filter(lead => {
    // Check status
    if (criteria.status) {
      const statuses = Array.isArray(criteria.status) ? criteria.status : [criteria.status];
      if (!statuses.includes(lead[CONFIG.SHEETS.COLUMNS.STATUS])) {
        return false;
      }
    }
    
    // Check priority
    if (criteria.priority) {
      const priorities = Array.isArray(criteria.priority) ? criteria.priority : [criteria.priority];
      if (!priorities.includes(lead[CONFIG.SHEETS.COLUMNS.PRIORITY])) {
        return false;
      }
    }
    
    // Check score threshold
    if (criteria.minScore !== undefined) {
      const score = safeParseNumber(lead[CONFIG.SHEETS.COLUMNS.SCORE], 0);
      if (score < criteria.minScore) {
        return false;
      }
    }
    
    // Check date created range
    if (criteria.createdAfter || criteria.createdBefore) {
      const dateCreated = lead[CONFIG.SHEETS.COLUMNS.DATE_CREATED];
      if (!dateCreated) return false;
      
      const created = normalizeDateToMidnight(new Date(dateCreated));
      
      if (criteria.createdAfter) {
        const after = normalizeDateToMidnight(new Date(criteria.createdAfter));
        if (created < after) return false;
      }
      
      if (criteria.createdBefore) {
        const before = normalizeDateToMidnight(new Date(criteria.createdBefore));
        if (created > before) return false;
      }
    }
    
    // Check follow-up date
    if (criteria.followUpDate) {
      const followUpDate = lead[CONFIG.SHEETS.COLUMNS.NEXT_FOLLOW_UP];
      if (!followUpDate) return false;
      
      const followUp = normalizeDateToMidnight(new Date(followUpDate));
      const target = normalizeDateToMidnight(new Date(criteria.followUpDate));
      
      if (followUp.getTime() !== target.getTime()) return false;
    }
    
    // Check overdue (follow-up date in the past)
    if (criteria.overdue === true) {
      const followUpDate = lead[CONFIG.SHEETS.COLUMNS.NEXT_FOLLOW_UP];
      if (!followUpDate || !isPast(followUpDate)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Sort leads by multiple criteria
 * 
 * @param {Array} leads - Array of lead rows
 * @param {Array} sortBy - Array of sort criteria [{column: 'SCORE', order: 'desc'}]
 * @returns {Array} Sorted leads
 */
function sortLeads(leads, sortBy) {
  if (!sortBy || sortBy.length === 0) {
    return leads;
  }
  
  return leads.sort((a, b) => {
    for (let criterion of sortBy) {
      const columnIndex = CONFIG.SHEETS.COLUMNS[criterion.column];
      const order = criterion.order || 'asc';
      
      let aVal = a[columnIndex];
      let bVal = b[columnIndex];
      
      // Handle dates
      if (aVal instanceof Date) {
        aVal = aVal.getTime();
      }
      if (bVal instanceof Date) {
        bVal = bVal.getTime();
      }
      
      // Handle numbers
      if (typeof aVal === 'string') {
        const num = parseFloat(aVal);
        if (!isNaN(num)) aVal = num;
      }
      if (typeof bVal === 'string') {
        const num = parseFloat(bVal);
        if (!isNaN(num)) bVal = num;
      }
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      if (comparison !== 0) {
        return order === 'desc' ? -comparison : comparison;
      }
    }
    
    return 0;
  });
}

/**
 * Count leads by field value
 * 
 * @param {Array} leads - Array of lead rows
 * @param {string} fieldName - Field name to count by (e.g., 'SOURCE', 'STATUS')
 * @returns {Object} Object with counts {value: count}
 */
function countLeadsBy(leads, fieldName) {
  const columnIndex = CONFIG.SHEETS.COLUMNS[fieldName];
  const counts = {};
  
  leads.forEach(lead => {
    const value = lead[columnIndex] || 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });
  
  return counts;
}

/**
 * Calculate conversion rate
 * 
 * @param {number} converted - Number of converted leads
 * @param {number} total - Total number of leads
 * @returns {string} Formatted percentage string
 */
function calculateConversionRate(converted, total) {
  if (!total || total === 0) {
    return '0%';
  }
  
  const rate = (converted / total) * 100;
  return rate.toFixed(1) + '%';
}

/**
 * Truncate string to max length
 * 
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) {
    return str || '';
  }
  
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sleep for specified milliseconds
 * Useful to avoid rate limits
 * 
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  Utilities.sleep(ms);
}

/**
 * Safely execute function with error handling
 * 
 * @param {Function} fn - Function to execute
 * @param {string} context - Context description for logging
 * @returns {*} Function result or null on error
 */
function safeExecute(fn, context) {
  try {
    return fn();
  } catch (error) {
    Logger.log('Error in ' + context + ': ' + error.message);
    if (isDebugMode()) {
      Logger.log(error.stack);
    }
    return null;
  }
}

/**
 * TEST FUNCTION: Test utility functions
 */
function testUtils() {
  Logger.log('=== Testing Utility Functions ===');
  
  // Test date functions
  const today = new Date();
  Logger.log('Today: ' + formatDate(today));
  Logger.log('Thai format: ' + formatThaiDate(today));
  Logger.log('Is today: ' + isToday(today));
  
  // Test currency formatting
  Logger.log('Currency THB: ' + formatCurrency(1000000));
  Logger.log('Currency USD: ' + formatCurrency(5000, 'USD'));
  
  // Test date ranges
  const yesterday = getYesterdayRange();
  Logger.log('Yesterday: ' + formatDate(yesterday.start) + ' to ' + formatDate(yesterday.end));
  
  const thisWeek = getThisWeekRange();
  Logger.log('This week: ' + formatDate(thisWeek.start) + ' to ' + formatDate(thisWeek.end));
  
  // Test sheet access
  try {
    const sheet = getSheetOrThrow(CONFIG.SHEETS.ACTIVE_LEADS);
    Logger.log('Sheet found: ' + sheet.getName());
  } catch (error) {
    Logger.log('Sheet error: ' + error.message);
  }
  
  Logger.log('✓ Utils test completed');
}
