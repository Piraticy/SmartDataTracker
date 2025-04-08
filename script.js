// This script is for a Google Apps Script web app that allows users to log expenses.
// It includes a form for entering expenses, a button to download expenses as JSON,
// and a function to load and display recent expenses.
// This function is called when the form is submitted.
const form = document.getElementById("expenseForm");

form.addEventListener("submit", async function(e) {
  e.preventDefault();
  const data = {
    date: form.date.value,
    amount: form.amount.value,
    category: form.category.value,
    note: form.note.value
  };
  google.script.run.withSuccessHandler(loadExpenses).saveExpense(data);
  form.reset();
});

function loadExpenses(data) {
  google.script.run.withSuccessHandler(showExpenses).getExpenses();
}

function showExpenses(expenses) {
  const div = document.getElementById("expenseList");
  div.innerHTML = "<h2>Recent Expenses:</h2>";
  expenses.reverse().forEach(e => {
    div.innerHTML += `<p>${e[0]} - ${e[1]} - ${e[2]} - ${e[3]}</p>`;
  });
}

function downloadExpenses() {
  google.script.run.withSuccessHandler(function(data) {
    const jsonData = JSON.stringify(data);
    const blob = new Blob([jsonData], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "expenses.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }).getExpenses();
}

window.onload = loadExpenses;

