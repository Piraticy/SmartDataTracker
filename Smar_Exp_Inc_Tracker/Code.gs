const ADMIN_SHEET_ID = 'https://docs.google.com/spreadsheets/d/1MmV3W5HMnPQYar-rF7yxN_xlzAHGy-UGfa22vzvBQLc/edit?gid=0#gid=0'; // Replace with your admin sheet ID
const ADMIN_SHEET_NAME = 'UserRegistry';


const SHEET_NAME = 'TrackerData';

function getOrCreateUserSheet() {
  const userEmail = Session.getActiveUser().getEmail();
  const userProps = PropertiesService.getUserProperties();
  let sheetId = userProps.getProperty('userSheetId');

 if (!sheetId) {
  const newSheet = SpreadsheetApp.create(`Expense Tracker - ${userEmail}`);
  const sheet = newSheet.getActiveSheet();
  sheet.setName("TrackerData");
  sheet.appendRow(["Date", "Type", "Category", "Amount", "Notes"]);

  sheetId = newSheet.getId();
  const url = newSheet.getUrl();
  const timestamp = new Date();

  userProps.setProperty('userSheetId', sheetId);

  const adminSheet = SpreadsheetApp.openById(ADMIN_SHEET_ID).getSheetByName(ADMIN_SHEET_NAME)
                    || SpreadsheetApp.openById(ADMIN_SHEET_ID).insertSheet(ADMIN_SHEET_NAME);

  if (adminSheet.getLastRow() === 0) {
    adminSheet.appendRow(["Email", "Sheet URL", "Created At"]);
  }

  adminSheet.appendRow([userEmail, url, timestamp]);

  // 📩 Send email notification to admin
  notifyAdminOfNewUser(userEmail, url, timestamp);
}
  return SpreadsheetApp.openById(sheetId);
}



function addEntry(entry) {
  const ss = getOrCreateUserSheet();
  const sheet = ss.getSheetByName("TrackerData");
  sheet.appendRow([
    entry.date,
    entry.type,
    entry.category,
    entry.amount,
    entry.notes
  ]);
}

function getSheetUrl() {
  const ss = getOrCreateUserSheet();
  return ss.getUrl();
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


function submitData(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Transactions");
  sheet.appendRow([new Date(), data.type, data.date, data.category, data.amount, data.notes]);
  return "Saved!";
}

function getTransactions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Transactions");
  const values = sheet.getDataRange().getValues();
  return values.slice(1); // skip header
}

// Google Apps Script entry point
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle("Smart Finance Tracker")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getAdminData() {
  const sheet = SpreadsheetApp.openById(ADMIN_SHEET_ID).getSheetByName(ADMIN_SHEET_NAME);
  if (!sheet) return [];
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // skip header
  return data;
}

function getCurrentUserEmail() {
  return Session.getActiveUser().getEmail();
}

function notifyAdminOfNewUser(email, url, timestamp) {
  const adminEmail = "YOUR_ADMIN_EMAIL@gmail.com"; // Change this to your email
  const subject = `New User Joined - Expense Tracker`;
  const body = `
A new user just joined your tracker app 🎉

📧 Email: ${email}
📄 Sheet: ${url}
🕒 Joined: ${timestamp}

You can view all users in your Admin Dashboard Sheet.
`;

  MailApp.sendEmail(adminEmail, subject, body);
}

