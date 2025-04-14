const ADMIN_SHEET_ID = '1MmV3W5HMnPQYar-rF7yxN_xlzAHGy-UGfa22vzvBQLc'; // Your Admin Sheet ID
const ADMIN_SHEET_NAME = 'UserRegistry';
const SHEET_NAME = 'TrackerData';
const ADMIN_EMAIL = 'mwasantajaadamu@gmail.com'; // Admin email

// Get or create the user's personal sheet
function getOrCreateUserSheet() {
  const email = Session.getActiveUser().getEmail();
  const props = PropertiesService.getUserProperties();
  let sheetId = props.getProperty('userSheetId');

  if (!sheetId) {
    const newSheet = SpreadsheetApp.create(`Smart Finance Tracker - ${email}`);
    const sheet = newSheet.getActiveSheet();
    sheet.setName(SHEET_NAME);
    sheet.appendRow(["Date", "Type", "Category", "Amount", "Notes"]);

    sheetId = newSheet.getId();
    props.setProperty('userSheetId', sheetId);

    const url = newSheet.getUrl();
    const timestamp = new Date();

    const adminSheetFile = SpreadsheetApp.openById(ADMIN_SHEET_ID);
    let adminSheet = adminSheetFile.getSheetByName(ADMIN_SHEET_NAME);
    if (!adminSheet) {
      adminSheet = adminSheetFile.insertSheet(ADMIN_SHEET_NAME);
      adminSheet.appendRow(["Email", "Sheet URL", "Created At"]);
    }

    adminSheet.appendRow([email, url, timestamp]);
    notifyAdminOfNewUser(email, url, timestamp);
  }

  return SpreadsheetApp.openById(sheetId);
}

// Add a transaction
function addEntry(entry) {
  const sheet = getOrCreateUserSheet().getSheetByName(SHEET_NAME);
  sheet.appendRow([entry.date, entry.type, entry.category, entry.amount, entry.notes]);
}
function saveTransaction(entry) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Transactions") || SpreadsheetApp.getActiveSpreadsheet().insertSheet("Transactions");
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Type", "Category", "Amount", "Note"]);
  }
  sheet.appendRow([entry.date, entry.type, entry.category, entry.amount, entry.note]);
}


// Get user's sheet URL
function getSheetUrl() {
  return getOrCreateUserSheet().getUrl();
}
function getSheetUrl() {
  return SpreadsheetApp.getActiveSpreadsheet().getUrl();
}

// Fetch all transactions
function getTransactions() {
  const data = getOrCreateUserSheet().getSheetByName(SHEET_NAME).getDataRange().getValues();
  return data.slice(1); // Remove header
}

//get all Transactions 
function getAllTransactions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Transactions");
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    let obj = {};
    headers.forEach((key, i) => obj[key.toLowerCase()] = row[i]);
    return obj;
  });
}



// Get monthly summary (for line chart)
function getSummaryData(filters) {
  const data = getOrCreateUserSheet().getSheetByName(SHEET_NAME).getDataRange().getValues();
  const summary = {};

  for (let i = 1; i < data.length; i++) {
    const [dateStr, type, category, amount] = data[i];
    const date = new Date(dateStr);
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

    if (filters?.type && filters.type !== type) continue;
    if (filters?.category && filters.category !== category) continue;
    if (filters?.startDate && new Date(filters.startDate) > date) continue;
    if (filters?.endDate && new Date(filters.endDate) < date) continue;

    if (!summary[month]) summary[month] = { Income: 0, Expense: 0 };
    if (type === 'Income') summary[month].Income += Number(amount);
    else if (type === 'Expense') summary[month].Expense += Number(amount);
  }

  const result = [['Month', 'Income', 'Expense']];
  Object.keys(summary).sort().forEach(month => {
    result.push([month, summary[month].Income, summary[month].Expense]);
  });

  return result;
}

// Get category breakdown (for pie chart)
function getCategoryBreakdownData(filters) {
  const data = getOrCreateUserSheet().getSheetByName(SHEET_NAME).getDataRange().getValues();
  const breakdown = {};

  for (let i = 1; i < data.length; i++) {
    const [dateStr, type, category, amount] = data[i];
    const date = new Date(dateStr);

    if (type !== 'Expense') continue;
    if (filters?.category && filters.category !== category) continue;
    if (filters?.startDate && new Date(filters.startDate) > date) continue;
    if (filters?.endDate && new Date(filters.endDate) < date) continue;

    if (!breakdown[category]) breakdown[category] = 0;
    breakdown[category] += Number(amount);
  }

  const result = [['Category', 'Amount']];
  for (let category in breakdown) {
    result.push([category, breakdown[category]]);
  }

  return result;
}

// Get unique categories
function getAllCategories() {
  const data = getOrCreateUserSheet().getSheetByName(SHEET_NAME).getDataRange().getValues();
  const categories = new Set();
  for (let i = 1; i < data.length; i++) {
    categories.add(data[i][2]); // Category is 3rd column
  }
  return Array.from(categories).sort();
}

// In-app notification placeholder
function triggerInAppNotification(message) {
  return { success: true, message };
}

// Weekly/monthly summary email
function sendSummaryEmail(userEmail) {
  const sheet = getOrCreateUserSheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues().slice(1);
  let income = 0, expense = 0;

  data.forEach(row => {
    if (row[1] === 'Income') income += Number(row[3]);
    else if (row[1] === 'Expense') expense += Number(row[3]);
  });

  const body = `
Hi ${userEmail},

Here's your summary for Smart Finance Tracker 📊

💰 Total Income: ${income.toFixed(2)}
💸 Total Expense: ${expense.toFixed(2)}
📅 Records Count: ${data.length}

Keep tracking your finances!
Access your sheet here: ${getSheetUrl()}
`;

  MailApp.sendEmail({
    to: userEmail,
    subject: '📊 Your Smart Finance Summary',
    body
  });
}

// Notify admin when a new user joins
function notifyAdminOfNewUser(email, url, timestamp) {
  const subject = '🆕 New Smart Finance Tracker User';
  const body = `📧 Email: ${email}\n🔗 Sheet: ${url}\n🕒 Joined: ${timestamp}`;
  MailApp.sendEmail(ADMIN_EMAIL, subject, body);
}

// Admin view of all users
function getAdminData() {
  const adminSheet = SpreadsheetApp.openById(ADMIN_SHEET_ID).getSheetByName(ADMIN_SHEET_NAME);
  if (!adminSheet) return [];
  return adminSheet.getRange(2, 1, adminSheet.getLastRow() - 1, 3).getValues();
}

// Web app entry point
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Smart Finance Tracker')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, user-scalable=no');
}

// Include partial HTML files (if used)
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Return current user email
function getCurrentUserEmail() {
  return Session.getActiveUser().getEmail();
}

// Admin/dev utility - clear all user data (optional)
function clearUserData() {
  const sheet = getOrCreateUserSheet().getSheetByName(SHEET_NAME);
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).clearContent();
  }
}
