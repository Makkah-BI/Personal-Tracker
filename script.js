// ---------- GLOBAL STATE ----------
let expenses = [];
let editingId = null;

// DOM elements
const descInput = document.getElementById("descInput");
const amountInput = document.getElementById("amountInput");
const categorySelect = document.getElementById("categorySelect");
const dateInput = document.getElementById("dateInput");
const submitBtn = document.getElementById("submitExpenseBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitleSpan = document.getElementById("formTitle");
const formErrorDiv = document.getElementById("formError");

const filterCategory = document.getElementById("filterCategory");
const filterDateFrom = document.getElementById("filterDateFrom");
const filterDateTo = document.getElementById("filterDateTo");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");

const totalAllExpensesSpan = document.getElementById("totalAllExpenses");
const filteredTotalSpan = document.getElementById("filteredTotal");
const filteredCountSpan = document.getElementById("filteredCount");
const expenseTableBody = document.getElementById("expenseTableBody");
const clearAllBtn = document.getElementById("clearAllBtn");
const exportBtn = document.getElementById("exportCSVBtn");
const chartCanvas = document.getElementById("categoryChartCanvas");

// Helper: set default date = today
function setDefaultDate() {
  if (!dateInput.value) {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.value = today;
  }
}

// Load from localStorage
function loadData() {
  const stored = localStorage.getItem("expenseTrackerData");
  if (stored) {
    try {
      expenses = JSON.parse(stored);
      expenses = expenses.filter(
        (e) =>
          e.id &&
          e.description &&
          typeof e.amount === "number" &&
          e.category &&
          e.date,
      );
    } catch (e) {
      expenses = [];
    }
  } else {
    // sample demo data
    expenses = [
      {
        id: Date.now() + 1,
        description: "Grocery shopping",
        amount: 58.75,
        category: "Food",
        date: "2025-04-18",
      },
      {
        id: Date.now() + 2,
        description: "Uber ride",
        amount: 12.5,
        category: "Transport",
        date: "2025-04-19",
      },
      {
        id: Date.now() + 3,
        description: "Netflix subscription",
        amount: 15.99,
        category: "Entertainment",
        date: "2025-04-15",
      },
    ];
  }
  setDefaultDate();
}

function saveToLocalStorage() {
  localStorage.setItem("expenseTrackerData", JSON.stringify(expenses));
}

function getFilterValues() {
  return {
    category: filterCategory.value,
    fromDate: filterDateFrom.value,
    toDate: filterDateTo.value,
  };
}

function getFilteredExpenses() {
  const { category, fromDate, toDate } = getFilterValues();
  return expenses.filter((exp) => {
    if (category !== "ALL" && exp.category !== category) return false;
    if (fromDate && exp.date < fromDate) return false;
    if (toDate && exp.date > toDate) return false;
    return true;
  });
}

function renderAll() {
  renderTableAndStats();
  drawCategoryChart();
}

function renderTableAndStats() {
  const filtered = getFilteredExpenses();
  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);
  const filteredCount = filtered.length;
  filteredTotalSpan.innerText = `$${filteredTotal.toFixed(2)}`;
  filteredCountSpan.innerText = filteredCount;

  const overallTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalAllExpensesSpan.innerText = `$${overallTotal.toFixed(2)}`;

  if (filtered.length === 0) {
    expenseTableBody.innerHTML = `<tr class="empty-row"><td colspan="5">✨ No transactions match filters — add or reset filters ✨</td></tr>`;
    return;
  }

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  expenseTableBody.innerHTML = sorted
    .map(
      (exp) => `
        <tr data-id="${exp.id}">
            <td>${formatDate(exp.date)}</td>
            <td><strong>${escapeHtml(exp.description)}</strong></td>
            <td><span class="badge-category">${exp.category}</span></td>
            <td style="font-weight:600; color:#0f172a;">$${exp.amount.toFixed(2)}</td>
            <td class="action-buttons">
                <button class="icon-btn edit-btn" data-id="${exp.id}" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="icon-btn delete-btn" data-id="${exp.id}" title="Delete"><i class="fas fa-trash-can"></i></button>
            </td>
        </tr>
    `,
    )
    .join("");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>]/g, function (m) {
    if (m === "&") return "&amp;";
    if (m === "<") return "&lt;";
    if (m === ">") return "&gt;";
    return m;
  });
}

function drawCategoryChart() {
  const categories = [
    "Food",
    "Transport",
    "Shopping",
    "Bills",
    "Entertainment",
    "Health",
    "Other",
  ];
  const totals = categories.map((cat) => {
    return expenses
      .filter((exp) => exp.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
  });
  const maxTotal = Math.max(...totals, 0.01);
  const canvas = chartCanvas;
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth;
  const height = 230;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  if (expenses.length === 0) {
    ctx.font = "12px 'Segoe UI'";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("No expense data — add to see chart", 20, 40);
    return;
  }
  const barHeight = 24;
  const startY = 30;
  const maxBarWidth = width - 160;
  ctx.font = "11px 'Segoe UI'";
  for (let i = 0; i < categories.length; i++) {
    const y = startY + i * (barHeight + 6);
    const total = totals[i];
    const barWidth = (total / maxTotal) * maxBarWidth;
    ctx.fillStyle = "#334155";
    ctx.fillText(categories[i], 10, y + 14);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(100, y, maxBarWidth, barHeight - 2);
    ctx.fillStyle = getCategoryColor(categories[i]);
    ctx.fillRect(100, y, barWidth, barHeight - 2);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px 'Segoe UI'";
    ctx.fillText(`$${total.toFixed(2)}`, 100 + barWidth + 8, y + 14);
    ctx.font = "11px 'Segoe UI'";
  }
}

function getCategoryColor(cat) {
  const map = {
    Food: "#f97316",
    Transport: "#3b82f6",
    Shopping: "#8b5cf6",
    Bills: "#10b981",
    Entertainment: "#ec489a",
    Health: "#14b8a6",
    Other: "#6b7280",
  };
  return map[cat] || "#64748b";
}

function addOrUpdateExpense() {
  const description = descInput.value.trim();
  const amountRaw = amountInput.value;
  const category = categorySelect.value;
  const date = dateInput.value;

  if (!description) {
    formErrorDiv.innerText = " Please enter a description";
    return;
  }
  if (!amountRaw || isNaN(amountRaw) || parseFloat(amountRaw) <= 0) {
    formErrorDiv.innerText =
      " Amount must be a positive number (minimum $0.01)";
    return;
  }
  if (!date) {
    formErrorDiv.innerText = " Select a valid date";
    return;
  }
  const amount = parseFloat(amountRaw);
  formErrorDiv.innerText = "";

  if (editingId !== null) {
    const index = expenses.findIndex((e) => e.id === editingId);
    if (index !== -1) {
      expenses[index] = {
        ...expenses[index],
        description,
        amount,
        category,
        date,
      };
      editingId = null;
      submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';
      cancelEditBtn.style.display = "none";
      formTitleSpan.innerText = "Add New Expense";
      resetFormFields();
    } else {
      editingId = null;
    }
  } else {
    const newExpense = {
      id: Date.now(),
      description: description,
      amount: amount,
      category: category,
      date: date,
    };
    expenses.push(newExpense);
    resetFormFields();
  }
  saveToLocalStorage();
  renderAll();
  setDefaultDate();
}

function resetFormFields() {
  descInput.value = "";
  amountInput.value = "";
  categorySelect.value = "Food";
  setDefaultDate();
  formErrorDiv.innerText = "";
}

function startEditExpense(id) {
  const expense = expenses.find((e) => e.id === id);
  if (!expense) return;
  editingId = expense.id;
  descInput.value = expense.description;
  amountInput.value = expense.amount;
  categorySelect.value = expense.category;
  dateInput.value = expense.date;
  submitBtn.innerHTML = '<i class="fas fa-pen"></i> Update Expense';
  cancelEditBtn.style.display = "inline-flex";
  formTitleSpan.innerText = " Edit Expense";
  formErrorDiv.innerText = "";
}

function cancelEdit() {
  editingId = null;
  resetFormFields();
  submitBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Add Expense';
  cancelEditBtn.style.display = "none";
  formTitleSpan.innerText = "Add New Expense";
  formErrorDiv.innerText = "";
  setDefaultDate();
}

function deleteExpenseById(id) {
  if (confirm("Delete this expense permanently?")) {
    expenses = expenses.filter((e) => e.id !== id);
    if (editingId === id) cancelEdit();
    saveToLocalStorage();
    renderAll();
  }
}

function clearAllExpenses() {
  if (expenses.length === 0) return;
  if (confirm(" DELETE ALL expenses? This action cannot be undone.")) {
    expenses = [];
    if (editingId !== null) cancelEdit();
    saveToLocalStorage();
    renderAll();
  }
}

function exportToCSV() {
  if (expenses.length === 0) {
    alert("No expenses to export.");
    return;
  }
  let csvRows = [["ID", "Description", "Amount", "Category", "Date"]];
  for (let exp of expenses) {
    csvRows.push([exp.id, exp.description, exp.amount, exp.category, exp.date]);
  }
  const csvContent = csvRows.map((row) => row.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `expenses_${new Date().toISOString().slice(0, 19)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function resetFilters() {
  filterCategory.value = "ALL";
  filterDateFrom.value = "";
  filterDateTo.value = "";
  renderAll();
}

function handleTableActions(e) {
  const target = e.target;
  const btn = target.closest(".edit-btn, .delete-btn");
  if (!btn) return;
  const row = btn.closest("tr");
  if (!row) return;
  const idAttr = row.getAttribute("data-id");
  if (!idAttr) return;
  const expenseId = parseInt(idAttr);
  if (btn.classList.contains("edit-btn")) {
    startEditExpense(expenseId);
  } else if (btn.classList.contains("delete-btn")) {
    deleteExpenseById(expenseId);
  }
}

function initEventListeners() {
  submitBtn.addEventListener("click", addOrUpdateExpense);
  cancelEditBtn.addEventListener("click", cancelEdit);
  clearAllBtn.addEventListener("click", clearAllExpenses);
  exportBtn.addEventListener("click", exportToCSV);
  resetFiltersBtn.addEventListener("click", resetFilters);
  filterCategory.addEventListener("change", () => renderAll());
  filterDateFrom.addEventListener("change", () => renderAll());
  filterDateTo.addEventListener("change", () => renderAll());
  expenseTableBody.addEventListener("click", handleTableActions);
  // Prevent accidental form submit on Enter
  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("keypress", (e) => {
      if (e.key === "Enter") e.preventDefault();
    });
  });
}

function init() {
  loadData();
  setDefaultDate();
  initEventListeners();
  renderAll();
  if (editingId === null) cancelEditBtn.style.display = "none";
}

init();
