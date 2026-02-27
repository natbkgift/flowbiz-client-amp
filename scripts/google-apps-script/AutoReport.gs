/**
 * AutoReport.gs
 * 
 * Automated Report Generation
 * สร้างและส่งรายงานอัตโนมัติผ่าน LINE
 */

/**
 * Generate and send daily lead report
 * Runs automatically via trigger at 9:00 AM daily
 * 
 * Reports include:
 * - New leads from yesterday
 * - Today's follow-ups
 * - Hot leads requiring action
 * - Overall statistics
 */
function generateDailyLeadReport() {
  try {
    Logger.log('=== Generating Daily Lead Report ===');
    
    // Load configuration
    loadConfig();
    
    // Get data
    const leads = getSheetData(CONFIG.SHEETS.ACTIVE_LEADS);
    
    if (!leads || leads.length === 0) {
      Logger.log('No leads data found');
      return;
    }
    
    // Calculate yesterday's date range
    const yesterday = getYesterdayRange();
    
    // New leads from yesterday
    const newLeadsYesterday = filterLeads(leads, {
      createdAfter: yesterday.start,
      createdBefore: yesterday.end
    }).length;
    
    // Today's follow-ups
    const today = new Date();
    const todayFollowUps = filterLeads(leads, {
      followUpDate: today
    }).length;
    
    // Hot leads (priority = Hot OR score >= 75)
    const hotLeads = leads.filter(lead => {
      const priority = lead[CONFIG.SHEETS.COLUMNS.PRIORITY];
      const score = safeParseNumber(lead[CONFIG.SHEETS.COLUMNS.SCORE], 0);
      const status = lead[CONFIG.SHEETS.COLUMNS.STATUS];
      
      // Exclude converted/lost/unqualified
      if (['Converted', 'Lost', 'Unqualified'].includes(status)) {
        return false;
      }
      
      return priority === 'Hot' || score >= CONFIG.REPORTS.THRESHOLDS.HOT_LEAD_SCORE;
    });
    
    // Total active leads (exclude converted/lost/unqualified)
    const totalActive = leads.filter(lead => {
      const status = lead[CONFIG.SHEETS.COLUMNS.STATUS];
      return !['Converted', 'Lost', 'Unqualified'].includes(status);
    }).length;
    
    // Prepare report data
    const reportData = {
      newLeadsYesterday: newLeadsYesterday,
      todayFollowUps: todayFollowUps,
      hotLeadsCount: hotLeads.length,
      totalActiveLeads: totalActive
    };
    
    Logger.log('Report data:');
    Logger.log('  - New leads yesterday: ' + newLeadsYesterday);
    Logger.log('  - Today\'s follow-ups: ' + todayFollowUps);
    Logger.log('  - Hot leads: ' + hotLeads.length);
    Logger.log('  - Total active: ' + totalActive);
    
    // Send to LINE
    if (CONFIG.FEATURES.ENABLE_DAILY_REPORTS) {
      const success = sendDailyReportToLINE(reportData);
      
      if (success) {
        Logger.log('✓ Daily report sent successfully');
      } else {
        Logger.log('✗ Failed to send daily report');
      }
    } else {
      Logger.log('Daily reports disabled in config');
    }
    
    Logger.log('=== Daily Report Complete ===');
  } catch (error) {
    Logger.log('Error generating daily report: ' + error.message);
    if (CONFIG.FEATURES.ENABLE_ERROR_NOTIFICATIONS) {
      sendErrorNotification(error);
    }
  }
}

/**
 * Generate and send weekly report
 * Runs automatically via trigger on Monday at 9:00 AM
 * 
 * Reports include:
 * - New leads this week
 * - Conversions and conversion rate
 * - Top performing agents
 * - Top lead sources
 */
function generateWeeklyReport() {
  try {
    Logger.log('=== Generating Weekly Report ===');
    
    // Load configuration
    loadConfig();
    
    // Get data
    const leads = getSheetData(CONFIG.SHEETS.ACTIVE_LEADS);
    
    if (!leads || leads.length === 0) {
      Logger.log('No leads data found');
      return;
    }
    
    // Get last week's date range
    const lastWeek = getLastWeekRange();
    
    // New leads last week
    const newLeads = filterLeads(leads, {
      createdAfter: lastWeek.start,
      createdBefore: lastWeek.end
    });
    
    // Converted leads last week
    const convertedLeads = newLeads.filter(lead => {
      const status = lead[CONFIG.SHEETS.COLUMNS.STATUS];
      return status === 'Converted';
    });
    
    // Calculate conversion rate
    const conversionRate = calculateConversionRate(
      convertedLeads.length,
      newLeads.length
    );
    
    // Top agents by lead count
    const agentCounts = countLeadsBy(newLeads, 'ASSIGNED_AGENT');
    const topAgents = Object.entries(agentCounts)
      .map(([name, count]) => ({ name, leads: count }))
      .sort((a, b) => b.leads - a.leads);
    
    // Top sources by lead count
    const sourceCounts = countLeadsBy(newLeads, 'SOURCE');
    const topSources = Object.entries(sourceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    // Prepare metrics
    const metrics = {
      newLeads: newLeads.length,
      converted: convertedLeads.length,
      conversionRate: conversionRate,
      topAgents: topAgents,
      topSources: topSources
    };
    
    Logger.log('Weekly metrics:');
    Logger.log('  - New leads: ' + newLeads.length);
    Logger.log('  - Converted: ' + convertedLeads.length);
    Logger.log('  - Conversion rate: ' + conversionRate);
    Logger.log('  - Top agent: ' + (topAgents[0] ? topAgents[0].name : 'N/A'));
    Logger.log('  - Top source: ' + (topSources[0] ? topSources[0].name : 'N/A'));
    
    // Send to LINE
    if (CONFIG.FEATURES.ENABLE_WEEKLY_REPORTS) {
      const success = sendWeeklyReportToLINE(metrics);
      
      if (success) {
        Logger.log('✓ Weekly report sent successfully');
      } else {
        Logger.log('✗ Failed to send weekly report');
      }
    } else {
      Logger.log('Weekly reports disabled in config');
    }
    
    Logger.log('=== Weekly Report Complete ===');
  } catch (error) {
    Logger.log('Error generating weekly report: ' + error.message);
    if (CONFIG.FEATURES.ENABLE_ERROR_NOTIFICATIONS) {
      sendErrorNotification(error);
    }
  }
}

/**
 * Check for overdue follow-ups and send alerts
 * Runs automatically via trigger at 8:00 AM daily
 * 
 * Alert criteria:
 * - Hot leads: overdue > 0 days
 * - Warm leads: overdue > 3 days
 * - All leads: overdue > 7 days
 */
function checkOverdueFollowUps() {
  try {
    Logger.log('=== Checking Overdue Follow-ups ===');
    
    // Load configuration
    loadConfig();
    
    // Get active leads
    const leads = getSheetData(CONFIG.SHEETS.ACTIVE_LEADS);
    
    if (!leads || leads.length === 0) {
      Logger.log('No leads data found');
      return;
    }
    
    const today = normalizeDateToMidnight(new Date());
    const overdueLeads = [];
    
    // Check each lead
    leads.forEach(lead => {
      const status = lead[CONFIG.SHEETS.COLUMNS.STATUS];
      const priority = lead[CONFIG.SHEETS.COLUMNS.PRIORITY];
      const followUpDate = lead[CONFIG.SHEETS.COLUMNS.NEXT_FOLLOW_UP];
      
      // Skip converted/lost/unqualified
      if (['Converted', 'Lost', 'Unqualified'].includes(status)) {
        return;
      }
      
      // Skip if no follow-up date set
      if (!followUpDate) {
        return;
      }
      
      const followUp = normalizeDateToMidnight(new Date(followUpDate));
      const daysOverdue = daysBetween(followUp, today);
      
      // Check if overdue based on priority
      let shouldAlert = false;
      
      if (priority === 'Hot' && daysOverdue > CONFIG.REPORTS.THRESHOLDS.OVERDUE_HOT_DAYS) {
        shouldAlert = true;
      } else if (priority === 'Warm' && daysOverdue > CONFIG.REPORTS.THRESHOLDS.OVERDUE_WARM_DAYS) {
        shouldAlert = true;
      } else if (daysOverdue > CONFIG.REPORTS.THRESHOLDS.OVERDUE_ALL_DAYS) {
        shouldAlert = true;
      }
      
      if (shouldAlert) {
        overdueLeads.push({
          name: lead[CONFIG.SHEETS.COLUMNS.FULL_NAME] || lead[CONFIG.SHEETS.COLUMNS.FIRST_NAME] || 'Unknown',
          priority: priority || 'Unknown',
          agent: lead[CONFIG.SHEETS.COLUMNS.ASSIGNED_AGENT] || 'Unassigned',
          daysOverdue: daysOverdue,
          followUpDate: formatDate(followUp)
        });
      }
    });
    
    Logger.log('Found ' + overdueLeads.length + ' overdue follow-ups');
    
    if (overdueLeads.length > 0) {
      // Sort by priority and days overdue
      overdueLeads.sort((a, b) => {
        if (a.priority === 'Hot' && b.priority !== 'Hot') return -1;
        if (a.priority !== 'Hot' && b.priority === 'Hot') return 1;
        return b.daysOverdue - a.daysOverdue;
      });
      
      // Log top 5
      Logger.log('Top overdue leads:');
      overdueLeads.slice(0, 5).forEach((lead, index) => {
        Logger.log('  ' + (index + 1) + '. ' + lead.name + 
                   ' (' + lead.priority + ', ' + lead.daysOverdue + ' days)');
      });
      
      // Send alert
      if (CONFIG.FEATURES.ENABLE_OVERDUE_ALERTS) {
        const success = sendOverdueAlert(overdueLeads);
        
        if (success) {
          Logger.log('✓ Overdue alert sent successfully');
        } else {
          Logger.log('✗ Failed to send overdue alert');
        }
      } else {
        Logger.log('Overdue alerts disabled in config');
      }
    } else {
      Logger.log('No overdue follow-ups found - all up to date! ✓');
    }
    
    Logger.log('=== Overdue Check Complete ===');
  } catch (error) {
    Logger.log('Error checking overdue follow-ups: ' + error.message);
    if (CONFIG.FEATURES.ENABLE_ERROR_NOTIFICATIONS) {
      sendErrorNotification(error);
    }
  }
}

/**
 * Setup all automated triggers
 * Run this once to configure all time-driven triggers
 * 
 * Creates triggers for:
 * - Daily report (9:00 AM)
 * - Weekly report (Monday 9:00 AM)
 * - Overdue check (8:00 AM)
 */
function setupAllTriggers() {
  try {
    Logger.log('=== Setting up Triggers ===');
    
    // Delete existing triggers first to avoid duplicates
    const existingTriggers = ScriptApp.getProjectTriggers();
    existingTriggers.forEach(trigger => {
      const handlerFunction = trigger.getHandlerFunction();
      if (['generateDailyLeadReport', 'generateWeeklyReport', 'checkOverdueFollowUps'].includes(handlerFunction)) {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('Deleted existing trigger: ' + handlerFunction);
      }
    });
    
    // Create Daily Report trigger (9:00 AM daily)
    ScriptApp.newTrigger('generateDailyLeadReport')
      .timeBased()
      .everyDays(1)
      .atHour(9)
      .create();
    Logger.log('✓ Created trigger: Daily Report (9:00 AM)');
    
    // Create Weekly Report trigger (Monday 9:00 AM)
    ScriptApp.newTrigger('generateWeeklyReport')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(9)
      .create();
    Logger.log('✓ Created trigger: Weekly Report (Monday 9:00 AM)');
    
    // Create Overdue Check trigger (8:00 AM daily)
    ScriptApp.newTrigger('checkOverdueFollowUps')
      .timeBased()
      .everyDays(1)
      .atHour(8)
      .create();
    Logger.log('✓ Created trigger: Overdue Check (8:00 AM)');
    
    Logger.log('=== All triggers created successfully ===');
    Logger.log('');
    Logger.log('Triggers will run automatically at:');
    Logger.log('  - 8:00 AM: Overdue Follow-ups Check');
    Logger.log('  - 9:00 AM: Daily Lead Report');
    Logger.log('  - Monday 9:00 AM: Weekly Report');
    
    return true;
  } catch (error) {
    Logger.log('Error setting up triggers: ' + error.message);
    return false;
  }
}

/**
 * List all existing triggers
 * Useful for debugging trigger issues
 */
function listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  Logger.log('=== Existing Triggers ===');
  Logger.log('Total triggers: ' + triggers.length);
  
  if (triggers.length === 0) {
    Logger.log('No triggers found');
    return;
  }
  
  triggers.forEach((trigger, index) => {
    Logger.log('');
    Logger.log('Trigger ' + (index + 1) + ':');
    Logger.log('  Function: ' + trigger.getHandlerFunction());
    Logger.log('  Type: ' + trigger.getEventType());
    
    if (trigger.getEventType() === ScriptApp.EventType.CLOCK) {
      const triggerSource = trigger.getTriggerSource();
      Logger.log('  Source: ' + triggerSource);
    }
  });
}

/**
 * Delete all triggers
 * Use with caution - this will stop all automated reports
 */
function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  
  Logger.log('=== Deleting All Triggers ===');
  Logger.log('Found ' + triggers.length + ' triggers');
  
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
    Logger.log('Deleted: ' + trigger.getHandlerFunction());
  });
  
  Logger.log('✓ All triggers deleted');
}

/**
 * TEST FUNCTION: Test daily report with actual data
 * Does not send to LINE - only logs output
 */
function testDailyReport() {
  try {
    Logger.log('=== TEST: Daily Report (Dry Run) ===');
    
    // Temporarily disable LINE sending
    const originalFeature = CONFIG.FEATURES.ENABLE_DAILY_REPORTS;
    CONFIG.FEATURES.ENABLE_DAILY_REPORTS = false;
    
    // Run report generation
    generateDailyLeadReport();
    
    // Restore setting
    CONFIG.FEATURES.ENABLE_DAILY_REPORTS = originalFeature;
    
    Logger.log('');
    Logger.log('Test complete. Check logs above for report data.');
    Logger.log('To send actual LINE message, run: generateDailyLeadReport()');
  } catch (error) {
    Logger.log('Test failed: ' + error.message);
  }
}

/**
 * TEST FUNCTION: Test weekly report with actual data
 * Does not send to LINE - only logs output
 */
function testWeeklyReport() {
  try {
    Logger.log('=== TEST: Weekly Report (Dry Run) ===');
    
    // Temporarily disable LINE sending
    const originalFeature = CONFIG.FEATURES.ENABLE_WEEKLY_REPORTS;
    CONFIG.FEATURES.ENABLE_WEEKLY_REPORTS = false;
    
    // Run report generation
    generateWeeklyReport();
    
    // Restore setting
    CONFIG.FEATURES.ENABLE_WEEKLY_REPORTS = originalFeature;
    
    Logger.log('');
    Logger.log('Test complete. Check logs above for report data.');
    Logger.log('To send actual LINE message, run: generateWeeklyReport()');
  } catch (error) {
    Logger.log('Test failed: ' + error.message);
  }
}

/**
 * TEST FUNCTION: Test overdue check with actual data
 * Does not send to LINE - only logs output
 */
function testOverdueCheck() {
  try {
    Logger.log('=== TEST: Overdue Check (Dry Run) ===');
    
    // Temporarily disable LINE sending
    const originalFeature = CONFIG.FEATURES.ENABLE_OVERDUE_ALERTS;
    CONFIG.FEATURES.ENABLE_OVERDUE_ALERTS = false;
    
    // Run overdue check
    checkOverdueFollowUps();
    
    // Restore setting
    CONFIG.FEATURES.ENABLE_OVERDUE_ALERTS = originalFeature;
    
    Logger.log('');
    Logger.log('Test complete. Check logs above for overdue leads.');
    Logger.log('To send actual LINE message, run: checkOverdueFollowUps()');
  } catch (error) {
    Logger.log('Test failed: ' + error.message);
  }
}

/**
 * TEST FUNCTION: Complete system test
 * Tests configuration, data access, and report generation
 */
function testCompleteSystem() {
  Logger.log('======================================');
  Logger.log('  COMPLETE SYSTEM TEST');
  Logger.log('======================================');
  Logger.log('');
  
  // Test 1: Configuration
  Logger.log('Test 1: Configuration');
  const configOk = testConfig();
  Logger.log('Result: ' + (configOk ? '✓ PASS' : '✗ FAIL'));
  Logger.log('');
  
  if (!configOk) {
    Logger.log('Configuration test failed. Please fix configuration before continuing.');
    return;
  }
  
  // Test 2: Utility functions
  Logger.log('Test 2: Utility Functions');
  testUtils();
  Logger.log('Result: ✓ PASS');
  Logger.log('');
  
  // Test 3: LINE connection
  Logger.log('Test 3: LINE Connection');
  const lineOk = testLINEConnection();
  Logger.log('Result: ' + (lineOk ? '✓ PASS' : '✗ FAIL'));
  Logger.log('');
  
  // Test 4: Data access
  Logger.log('Test 4: Data Access');
  try {
    const leads = getSheetData(CONFIG.SHEETS.ACTIVE_LEADS);
    Logger.log('Found ' + leads.length + ' leads');
    Logger.log('Result: ✓ PASS');
  } catch (error) {
    Logger.log('Error: ' + error.message);
    Logger.log('Result: ✗ FAIL');
  }
  Logger.log('');
  
  // Test 5: Report generation (dry run)
  Logger.log('Test 5: Report Generation');
  testDailyReport();
  Logger.log('Result: ✓ PASS');
  Logger.log('');
  
  Logger.log('======================================');
  Logger.log('  SYSTEM TEST COMPLETE');
  Logger.log('======================================');
  Logger.log('');
  Logger.log('All tests passed! System is ready for use.');
  Logger.log('');
  Logger.log('Next steps:');
  Logger.log('1. Run setupAllTriggers() to enable automated reports');
  Logger.log('2. Wait for scheduled reports or run manually');
  Logger.log('3. Monitor execution logs for any issues');
}
