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
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = message;
  setTimeout(() => errorDiv.textContent = '', 3000);
}

function showLoading(isLoading) {
  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Submitting..." : "Submit Sale";
}

document.addEventListener("DOMContentLoaded", () => {
  inventory = [
    { name: "Amoxicillin", price: 5, quantity: 20, costPrice: 3 },
    { name: "Paracetamol", price: 2, quantity: 50, costPrice: 1 },
    { name: "Amlodipine", price: 3, quantity: 30, costPrice: 2 },
  ];
});

const input = document.getElementById("medicine");
const list = document.getElementById("autocomplete-list");

input.addEventListener("input", debounce(() => {
  const term = input.value.trim().toLowerCase();
  list.innerHTML = '';
  if (!term) return;
  const matches = inventory.filter(med => med.name.toLowerCase().startsWith(term)).slice(0, 10);
  matches.forEach(med => {
    const div = document.createElement("div");
    div.classList.add("autocomplete-suggestion");
    div.textContent = med.name;
    div.onclick = () => {
      input.value = med.name;
      list.innerHTML = '';
      document.getElementById("qtyLabel").innerText = `Quantity (Available: ${med.quantity})`;
      document.getElementById("info").innerText = `Unit Price: GHC ${med.price.toFixed(2)}`;
      document.getElementById("error").textContent = '';
    };
    list.appendChild(div);
  });
}, 300));

document.addEventListener("click", function (e) {
  if (!input.contains(e.target) && !list.contains(e.target)) {
    list.innerHTML = '';
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

  items.push({ name: item.name, quantity, unitPrice: item.price, costPrice: item.costPrice });
  document.getElementById("medicine").value = '';
  document.getElementById("quantity").value = 1;
  document.getElementById("info").textContent = '';
  document.getElementById("qtyLabel").innerText = 'Quantity';
  renderItems();
}

function renderItems() {
  const container = document.getElementById("items");
  const summary = document.getElementById("cartSummary");
  container.innerHTML = '';
  summary.innerHTML = '';
  let grandTotal = 0;

  items.forEach((item, i) => {
    const subtotal = item.quantity * item.unitPrice;
    grandTotal += subtotal;
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `${item.name}
      <button class="remove-btn" onclick="removeItem(${i})">Remove</button>`;
    container.appendChild(div);
  });

  if (items.length > 0) {
    const table = document.createElement("table");
    table.innerHTML = `<thead>
      <tr><th>Medicine</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
      </thead><tbody></tbody>`;
    const tbody = table.querySelector("tbody");

    items.forEach(item => {
      const subtotal = item.quantity * item.unitPrice;
      tbody.innerHTML += `<tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>GHC ${item.unitPrice.toFixed(2)}</td>
        <td>GHC ${subtotal.toFixed(2)}</td>
      </tr>`;
    });

    tbody.innerHTML += `<tr class="total-row">
      <td colspan="3"><strong>Grand Total</strong></td>
      <td><strong>GHC ${grandTotal.toFixed(2)}</strong></td>
    </tr>`;
    summary.appendChild(table);
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
  if (confirm("Clear all items in the cart?")) {
    items = [];
    renderItems();
  }
}

function submitSale() {
  if (items.length === 0) {
    showError("Add items before submitting.");
    return;
  }
  if (!confirm("Are you sure you want to submit this sale?")) return;

  showLoading(true);
  setTimeout(() => {
    showLoading(false);
    alert("Sale recorded (simulated)");
    items = [];
    renderItems();
  }, 1000);
}
