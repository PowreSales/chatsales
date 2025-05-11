let inventory = [];
let items = [];

// Debounce function for autocomplete
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = message;
  setTimeout(() => errorDiv.textContent = '', 3000);
}

// Show loading state
function showLoading(isLoading) {
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Submitting..." : "Submit Sale";
}

// Load inventory from Google Apps Script
if (typeof google !== "undefined") {
  google.script.run
    .withSuccessHandler(data => inventory = data)
    .withFailureHandler(error => showError("Failed to load inventory: " + error))
    .getInventory();
}

const medicineInput = document.getElementById("medicine");
const autocompleteList = document.getElementById("autocomplete-list");

medicineInput.addEventListener("input", debounce(function () {
  const value = this.value.toLowerCase();
  autocompleteList.innerHTML = '';

  if (!value) return;

  const suggestions = inventory
    .filter(item => item.name.toLowerCase().startsWith(value)) // prefix matching
    .slice(0, 10);

  suggestions.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("autocomplete-suggestion");
    div.textContent = item.name;
    div.onclick = function () {
      medicineInput.value = item.name;
      autocompleteList.innerHTML = '';
      document.getElementById("qtyLabel").innerText = `Quantity (Available: ${item.quantity})`;
      document.getElementById("info").innerText = `Unit Price: GHC ${item.price.toFixed(2)}`;
      document.getElementById("error").textContent = '';
    };
    autocompleteList.appendChild(div);
  });
}, 300));

document.addEventListener("click", function (e) {
  if (!medicineInput.contains(e.target) && !autocompleteList.contains(e.target)) {
    autocompleteList.innerHTML = '';
  }
});

function addItem() {
  const name = document.getElementById("medicine").value;
  const quantity = parseInt(document.getElementById("quantity").value, 10);
  const item = inventory.find(i => i.name === name);

  if (!item || isNaN(quantity) || quantity <= 0 || quantity > item.quantity) {
    showError("Invalid medicine or quantity.");
    return;
  }

  items.push({
    name: item.name,
    quantity: quantity,
    unitPrice: item.price,
    costPrice: item.costPrice
  });

  document.getElementById("medicine").value = '';
  document.getElementById("quantity").value = 1;
  document.getElementById("info").textContent = '';
  document.getElementById("qtyLabel").innerText = 'Quantity';
  document.getElementById("error").textContent = '';

  renderItems();
}

function renderItems() {
  const container = document.getElementById("items");
  const summaryContainer = document.getElementById("cartSummary");
  container.innerHTML = '';
  summaryContainer.innerHTML = '';
  let grandTotal = 0;

  items.forEach((item, index) => {
    const subtotal = item.quantity * item.unitPrice;
    grandTotal += subtotal;

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      ${item.name}
      <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
    `;
    container.appendChild(div);
  });

  if (items.length > 0) {
    const table = document.createElement("table");
    table.innerHTML = `
      <thead>
        <tr>
          <th>Medicine</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");

    items.forEach(item => {
      const subtotal = item.quantity * item.unitPrice;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>GHC ${item.unitPrice.toFixed(2)}</td>
        <td>GHC ${subtotal.toFixed(2)}</td>
      `;
      tbody.appendChild(row);
    });

    const totalRow = document.createElement("tr");
    totalRow.className = "total-row";
    totalRow.innerHTML = `
      <td colspan="3"><strong>Grand Total</strong></td>
      <td><strong>GHC ${grandTotal.toFixed(2)}</strong></td>
    `;
    tbody.appendChild(totalRow);

    summaryContainer.appendChild(table);
  }
}

function removeItem(index) {
  items.splice(index, 1);
  renderItems();
}

function clearCart() {
  if (items.length === 0) {
    showError("Cart is already empty.");
    return;
  }
  if (!confirm("Clear all items in the cart?")) return;
  items = [];
  renderItems();
}

function submitSale() {
  if (items.length === 0) {
    showError("Add items before submitting.");
    return;
  }
  if (!confirm("Are you sure you want to submit this sale?")) return;

  showLoading(true);
  const paymentMethod = document.getElementById("paymentMethod").value;

  if (typeof google !== "undefined") {
    google.script.run
      .withSuccessHandler(() => {
        showLoading(false);
        alert("Sale recorded.");
        items = [];
        renderItems();
      })
      .withFailureHandler(error => {
        showLoading(false);
        showError("Failed to submit sale: " + error);
      })
      .saveSales({ items, paymentMethod });
  }
}
