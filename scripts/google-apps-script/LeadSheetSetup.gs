/**
 * LeadSheetSetup.gs
 *
 * Create Phase 0 lead tracking sheets with deterministic structure.
 */

/**
 * Build all required sheets for Phase 0 lead tracking.
 *
 * Creates/updates:
 * - Leads_Master
 * - Dashboard
 * - Campaign_Performance
 */
function setupPhase0LeadTrackingSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const leadsSheet = getOrCreateSheet_(ss, 'Leads_Master');
  const dashboardSheet = getOrCreateSheet_(ss, 'Dashboard');
  const campaignSheet = getOrCreateSheet_(ss, 'Campaign_Performance');

  setupLeadsMasterSheet_(leadsSheet);
  setupDashboardSheet_(dashboardSheet);
  setupCampaignPerformanceSheet_(campaignSheet);

  SpreadsheetApp.flush();
  Logger.log('✅ Phase 0 lead tracking sheets are ready');
}

function setupLeadsMasterSheet_(sheet) {
  const headers = [
    'Lead ID',
    'Date',
    'Time',
    'Timestamp (Auto)',
    'Name',
    'Country',
    'Campaign',
    'Source',
    'Budget',
    'Timeline (Months)',
    'Purpose',
    'Qualified?',
    'First Response Time',
    'SLA (Minutes)',
    'SLA Status',
    'Viewing Scheduled?',
    'Closed?',
    'Revenue (THB)',
    'Notes'
  ];

  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  sheet.getRange('D2').setFormula('=IF(AND(B2<>"",C2<>""),B2+C2,"")');
  sheet.getRange('L2').setFormula('=IF(G2="Buy",IF(AND(I2>=2000000,J2<=6,K2<>"Rent"),"Yes","No"),IF(G2="Invest",IF(AND(I2>=3000000,J2<=6),"Yes","No"),IF(G2="Rent",IF(AND(I2>=15000,J2>=3),"Yes","No"),"No")))');
  sheet.getRange('N2').setFormula('=IF(AND(D2<>"",M2<>""),(M2-D2)*1440,"")');
  sheet.getRange('O2').setFormula('=IF(N2="","",IF(N2<=15,"OK",IF(N2<=30,"Late","Breach")))');

  applyDropdownValidation_(sheet, 'G2:G', ['Buy', 'Invest', 'Rent', 'Brand']);
  applyDropdownValidation_(sheet, 'H2:H', ['Google', 'Organic', 'Direct', 'Referral']);
  applyDropdownValidation_(sheet, 'K2:K', ['Live', 'Invest', 'Rent']);
  applyDropdownValidation_(sheet, 'P2:P', ['Yes', 'No']);
  applyDropdownValidation_(sheet, 'Q2:Q', ['Yes', 'No']);

  sheet.getRange('B2:B').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('C2:C').setNumberFormat('hh:mm');
  sheet.getRange('D2:D').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('M2:M').setNumberFormat('yyyy-mm-dd hh:mm');
  sheet.getRange('I2:I').setNumberFormat('#,##0');
  sheet.getRange('J2:J').setNumberFormat('0');
  sheet.getRange('N2:N').setNumberFormat('0.00');
  sheet.getRange('R2:R').setNumberFormat('#,##0');

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, headers.length);
}

function setupDashboardSheet_(sheet) {
  sheet.clear();

  sheet.getRange('A1').setValue('Metric');
  sheet.getRange('B1').setValue('Value');

  const labels = [
    'Total Leads',
    'Qualified Leads',
    'Qualification Rate',
    'Viewings',
    'Viewing Rate (from Qualified)',
    'Closed Deals',
    'Close Rate (from Viewing)',
    'Total Revenue',
    'SLA Breach Count',
    'SLA Compliance %'
  ];

  sheet.getRange(2, 1, labels.length, 1).setValues(labels.map((v) => [v]));

  sheet.getRange('B2').setFormula('=COUNTA(Leads_Master!A:A)-1');
  sheet.getRange('B3').setFormula('=COUNTIF(Leads_Master!L:L,"Yes")');
  sheet.getRange('B4').setFormula('=IF(B2=0,"",B3/B2)');
  sheet.getRange('B5').setFormula('=COUNTIF(Leads_Master!P:P,"Yes")');
  sheet.getRange('B6').setFormula('=IF(B3=0,"",B5/B3)');
  sheet.getRange('B7').setFormula('=COUNTIF(Leads_Master!Q:Q,"Yes")');
  sheet.getRange('B8').setFormula('=IF(B5=0,"",B7/B5)');
  sheet.getRange('B9').setFormula('=SUM(Leads_Master!R:R)');
  sheet.getRange('B10').setFormula('=COUNTIF(Leads_Master!O:O,"Breach")');
  sheet.getRange('B11').setFormula('=IF(B2=0,"",1-(B10/B2))');

  sheet.getRange('B4').setNumberFormat('0.00%');
  sheet.getRange('B6').setNumberFormat('0.00%');
  sheet.getRange('B8').setNumberFormat('0.00%');
  sheet.getRange('B9').setNumberFormat('#,##0');
  sheet.getRange('B11').setNumberFormat('0.00%');

  sheet.setFrozenRows(1);
  sheet.getRange('A1:B1').setFontWeight('bold');
  sheet.autoResizeColumns(1, 2);
}

function setupCampaignPerformanceSheet_(sheet) {
  sheet.clear();

  sheet.getRange('A1').setValue('Leads by Campaign');
  sheet.getRange('A2').setFormula('=QUERY(Leads_Master!A:R,"select G, count(A) where G is not null group by G label count(A) ''Leads''")');

  sheet.getRange('D1').setValue('Revenue by Campaign');
  sheet.getRange('D2').setFormula('=QUERY(Leads_Master!A:R,"select G, sum(R) where Q=''Yes'' group by G label sum(R) ''Revenue''")');

  sheet.getRange('A1').setFontWeight('bold');
  sheet.getRange('D1').setFontWeight('bold');
  sheet.autoResizeColumns(1, 6);
}

function getOrCreateSheet_(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function applyDropdownValidation_(sheet, rangeA1, allowedValues) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(allowedValues, true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(rangeA1).setDataValidation(rule);
}
