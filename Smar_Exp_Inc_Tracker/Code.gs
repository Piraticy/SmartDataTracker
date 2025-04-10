let sheetName = "Expenses";

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle("Smart Expense Tracker")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function saveExpense(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(['Date', 'Amount', 'Category', 'Note']);
  }
  sheet.appendRow([data.date, data.amount, data.category, data.note]);
}

function getExpenses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  rows.shift(); // remove header
  return rows;
}
