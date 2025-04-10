const SHEET_NAME = 'TrackerData';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Date', 'Type', 'Category', 'Amount', 'Notes']);
  }
  return ss;
}

function addEntry(entry) {
  const ss = getOrCreateSheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  sheet.appendRow([
    entry.date,
    entry.type,
    entry.category,
    entry.amount,
    entry.notes
  ]);
}

function getSheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}


function getSummaryData(filters) {
  const sheet = getOrCreateSheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const summary = {};

  for (let i = 1; i < data.length; i++) {
    const [dateStr, type, category, amount] = data[i];
    const date = new Date(dateStr);
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (filters?.type && filters.type !== type) continue;
    if (filters?.category && filters.category.toLowerCase() !== category.toLowerCase()) continue;
    if (filters?.startDate && new Date(filters.startDate) > date) continue;
    if (filters?.endDate && new Date(filters.endDate) < date) continue;

    if (!summary[month]) {
      summary[month] = { Income: 0, Expense: 0 };
    }

    if (type === 'Income') summary[month].Income += parseFloat(amount);
    else if (type === 'Expense') summary[month].Expense += parseFloat(amount);
  }

  const result = [['Month', 'Income', 'Expense']];
  Object.keys(summary).sort().forEach(month => {
    result.push([month, summary[month].Income, summary[month].Expense]);
  });

  return result;
}

function getCategoryBreakdownData(filters) {
  const sheet = getOrCreateSheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const breakdown = {};

  for (let i = 1; i < data.length; i++) {
    const [dateStr, type, category, amount] = data[i];
    const date = new Date(dateStr);

    if (filters?.type && filters.type !== type) continue;
    if (filters?.category && filters.category.toLowerCase() !== category.toLowerCase()) continue;
    if (filters?.startDate && new Date(filters.startDate) > date) continue;
    if (filters?.endDate && new Date(filters.endDate) < date) continue;

    if (type === 'Expense') {
      if (!breakdown[category]) breakdown[category] = 0;
      breakdown[category] += parseFloat(amount);
    }
  }

  const result = [['Category', 'Amount']];
  for (const cat in breakdown) {
    result.push([cat, breakdown[cat]]);
  }

  return result;
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Income & Expense Tracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
