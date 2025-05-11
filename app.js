let inventory = [];
let items = [];

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showError(message) {
  alert(message);
}

function showLoading(isLoading) {
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Submitting..." : "Submit Sale";
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log('Service worker registered.'))
    .catch(err => console.error('Service worker registration failed:', err));
}

document.getElementById("medicine").addEventListener("input", debounce(function () {
  const value = this.value.toLowerCase();
  const suggestions = inventory.filter(item => item.name.toLowerCase().startsWith(value)).slice(0, 10);
  
  const autocompleteList = document.getElementById("autocomplete-list");
  autocompleteList.innerHTML = '';
  
  suggestions.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("autocomplete-suggestion");
    div.textContent = item.name;

    div.onclick = function () {
      document.getElementById("medicine").value = item.name;
      autocompleteList.innerHTML = '';
      document.getElementById("qtyLabel").innerText = `Quantity (Available: ${item.quantity})`;
      document.getElementById("info").innerText = `Unit Price: GHC ${item.price.toFixed(2)}`;
    };
    autocompleteList.appendChild(div);
  });
}, 300));

function addItem() {
  const name = document.getElementById("medicine").value;
  const quantity = parseInt(document.getElementById("quantity").value, 10);
  const item = inventory.find(i => i.name === name);

  if (!item || isNaN(quantity) || quantity <= 0 || quantity > item.quantity) {
    showError("Invalid medicine or quantity.");
    return;
  }

  items.push({ name: item.name, quantity, unitPrice: item.price });
  document.getElementById("medicine").value = '';
  document.getElementById("quantity").value = 1;
  renderItems();
}

function renderItems() {
  const container = document.getElementById("items");
  const summaryContainer = document.getElementById("cartSummary");
  container.innerHTML = '';
  summaryContainer.innerHTML = '';
  
  let grandTotal = 0;
  items.forEach(item => {
    const subtotal = item.quantity * item.unitPrice;
    grandTotal += subtotal;
    
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `${item.name} - GHC ${item.unitPrice.toFixed(2)} <span>${item.quantity} pcs</span>`;
    container.appendChild(div);
  });

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
  showLoading(true);
  fetch('https://script.google.com/macros/s/YOUR_SCRIPT_URL/exec', {
    method: 'POST',
    body: JSON.stringify({ items, paymentMethod: document.getElementById("paymentMethod").value }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(response => response.json())
    .then(() => {
      showLoading(false);
      alert("Sale recorded.");
      items = [];
      renderItems();
    })
    .catch(error => {
      showLoading(false);
      showError("Failed to submit sale: " + error);
    });
}
