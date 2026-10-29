
/* ==================================================
   RATIONFLOW - RATION SHOP MANAGER
   Frontend prototype: HTML + CSS + JavaScript
================================================== */

const $ = (id) => document.getElementById(id);

const STORAGE_KEYS = {
    purchases: "rationflow_purchases",
    payments: "rationflow_payments",
    suppliers: "rationflow_suppliers"
};


const API_BASE_URL = "http://localhost:8080";

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    if (!response.ok) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Request failed (${response.status})`);
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";

    return contentType.includes("application/json")
        ? response.json()
        : response.text();
}

function extractArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.content)) return payload.content;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.purchases)) return payload.purchases;
    return [];
}

async function loadPurchasesFromBackend() {
    try {
        const payload = await apiRequest("/api/purchase");
        purchases = extractArray(payload);
        refreshAllViews();
    } catch (error) {
        console.error("Purchase loading error:", error);
        showToast("Purchases load nahi hue. Console check karo.");
    }
}


async function loadPaymentsFromBackend() {
    try {
        const payload = await apiRequest("/api/payment");
        payments = extractArray(payload);
        refreshAllViews();
    } catch (error) {
        console.error("Payment loading error:", error);
        showToast("Payments load nahi hue. Console check karo.");
    }
}



function loadData(key) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : [];
    } catch (error) {
        console.error("Could not load saved data:", error);
        return [];
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Could not save data:", error);
        showToast("Could not save data in this browser.");
        return false;
    }
}

let purchases = [];
let payments = loadData(STORAGE_KEYS.payments);
let suppliers = loadData(STORAGE_KEYS.suppliers);

let currentPage = "dashboard";
let currentPeriod = "daily";
let currentChart = "purchases";

let toastTimer;
let nextItemId = 0;

// --------------------------------------------------
// GENERAL HELPERS
// --------------------------------------------------

function money(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);
}

function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function localMonthString(date = new Date()) {
    return localDateString(date).slice(0, 7);
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function createCell(value, className = "") {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";

    if (className) {
        cell.className = className;
    }

    return cell;
}

function addEmptyRow(tbody, columns, message) {
    if (!tbody) return;

    const row = document.createElement("tr");
    const cell = document.createElement("td");

    cell.colSpan = columns;
    cell.className = "empty-state";
    cell.textContent = message;

    row.appendChild(cell);
    tbody.replaceChildren(row);
}

function normalizeName(name) {
    return String(name || "").trim().toLowerCase();
}

function sameSupplier(first, second) {
    return normalizeName(first) === normalizeName(second);
}

function getPurchaseTotal(purchase) {
    if (purchase.totalAmount != null) {
        return Number(purchase.totalAmount) || 0;
    }

    return (purchase.items || []).reduce((sum, item) => {
        return sum +
            (Number(item.pricePerUnit) || 0) *
            (Number(item.quantity) || 0);
    }, 0);
}

function getPaymentAmount(payment) {
    return Number(payment.amount) || 0;
}

function saveAllData() {
    saveData(STORAGE_KEYS.purchases, purchases);
    saveData(STORAGE_KEYS.payments, payments);
    saveData(STORAGE_KEYS.suppliers, suppliers);
}

function addSupplierIfMissing(name, details = {}) {
    const supplierName = String(name || "").trim();

    if (!supplierName) return;

    const existing = suppliers.find((supplier) =>
        sameSupplier(supplier.name, supplierName)
    );

    if (existing) {
        if (details.phone && !existing.phone) {
            existing.phone = details.phone;
        }

        if (details.address && !existing.address) {
            existing.address = details.address;
        }

        return;
    }

    suppliers.push({
        id: Date.now() + Math.random(),
        name: supplierName,
        phone: details.phone || "",
        address: details.address || ""
    });
}

function getSupplierNames() {
    const names = new Set();

    suppliers.forEach((supplier) => {
        if (supplier.name) names.add(supplier.name);
    });

    purchases.forEach((purchase) => {
        if (purchase.supplierName) names.add(purchase.supplierName);
    });

    payments.forEach((payment) => {
        if (payment.supplierName) names.add(payment.supplierName);
    });

    return [...names].sort((a, b) => a.localeCompare(b));
}

function getSupplierTotals(supplierName) {
    const supplierPurchases = purchases.filter((purchase) =>
        sameSupplier(purchase.supplierName, supplierName)
    );

    const supplierPayments = payments.filter((payment) =>
        sameSupplier(payment.supplierName, supplierName)
    );

    const totalPurchases = supplierPurchases.reduce(
        (sum, purchase) => sum + getPurchaseTotal(purchase), 0
    );

    const totalPayments = supplierPayments.reduce(
        (sum, payment) => sum + getPaymentAmount(payment), 0
    );

    return {
        totalPurchases,
        totalPayments,
        balance: totalPurchases - totalPayments,
        purchaseCount: supplierPurchases.length,
        paymentCount: supplierPayments.length
    };
}

function getAllOutstandingDue() {
    return getSupplierNames().reduce((sum, name) => {
        return sum + getSupplierTotals(name).balance;
    }, 0);
}

function getSuppliersWithDues() {
    return getSupplierNames().filter((name) => {
        return getSupplierTotals(name).balance > 0.005;
    }).length;
}

function getTodayPurchases(date) {
    return purchases.filter((purchase) => purchase.purchaseDate === date);
}

function getTodayPayments(date) {
    return payments.filter((payment) => payment.paymentDate === date);
}

function getMonthPurchases(month) {
    return purchases.filter((purchase) =>
        String(purchase.purchaseDate || "").startsWith(month)
    );
}

function getMonthPayments(month) {
    return payments.filter((payment) =>
        String(payment.paymentDate || "").startsWith(month)
    );
}

// --------------------------------------------------
// NAVIGATION
// --------------------------------------------------

const pageInfo = {
    dashboard: {
        title: "Dashboard",
        subtitle: "Your shop at a glance"
    },
    purchase: {
        title: "New Purchase",
        subtitle: "Record goods received from a supplier"
    },
    history: {
        title: "Purchase History",
        subtitle: "Review your previous purchase records"
    },
    payments: {
        title: "Payments",
        subtitle: "Manage supplier payments and balances"
    },
    ledger: {
        title: "Supplier Ledger",
        subtitle: "View supplier accounts and outstanding balances"
    },
    suppliers: {
        title: "Suppliers",
        subtitle: "Manage your supplier information"
    }
};

function showPage(pageName) {
    if (!pageInfo[pageName]) return;

    currentPage = pageName;

    document.querySelectorAll(".page").forEach((page) => {
        page.classList.add("hidden");
    });

    const page = $(pageName + "-page");

    if (page) {
        page.classList.remove("hidden");
    }

    document.querySelectorAll(".nav-item").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageName
        );
    });

    $("page-title").textContent = pageInfo[pageName].title;
    $("page-subtitle").textContent = pageInfo[pageName].subtitle;

    $("sidebar")?.classList.remove("open");

    if (pageName === "dashboard") renderDashboard();
    if (pageName === "history") renderPurchaseHistory();
    if (pageName === "payments") renderPaymentHistory();
    if (pageName === "ledger") renderLedger();
    if (pageName === "suppliers") renderSuppliers();

    if (pageName === "purchase" && !document.querySelector(".item-row")) {
        addItemRow();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();

        if (button.id === "top-add-purchase") {
            resetPurchaseForm();
        }

        showPage(button.dataset.go);
    });
});

$("top-add-purchase")?.addEventListener("click", () => {
    resetPurchaseForm();
    showPage("purchase");
});

$("menu-toggle")?.addEventListener("click", () => {
    $("sidebar")?.classList.toggle("open");
});

// --------------------------------------------------
// DASHBOARD DATE AND PERIOD FILTERS
// --------------------------------------------------

function initializeDates() {
    const today = localDateString();
    const month = localMonthString();

    if ($("current-date")) {
        $("current-date").textContent =
            new Date().toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });
    }

    if ($("purchase-date")) $("purchase-date").value = today;
    if ($("payment-date")) $("payment-date").value = today;

    if ($("dashboard-date")) $("dashboard-date").value = today;
    if ($("dashboard-month")) $("dashboard-month").value = month;
}

function setPeriod(period) {
    currentPeriod = period === "monthly" ? "monthly" : "daily";

    document.querySelectorAll(".period-button").forEach((button) => {
        button.classList.toggle(
            "active",
            button.dataset.period === currentPeriod
        );
    });

    $("daily-filter")?.classList.toggle(
        "hidden", currentPeriod !== "daily"
    );

    $("monthly-filter")?.classList.toggle(
        "hidden", currentPeriod !== "monthly"
    );

    renderDashboard();
}

document.querySelectorAll(".period-button").forEach((button) => {
    button.addEventListener("click", () => {
        setPeriod(button.dataset.period);
    });
});

$("dashboard-date")?.addEventListener("change", renderDashboard);
$("dashboard-month")?.addEventListener("change", renderDashboard);

function getDashboardData() {
    if (currentPeriod === "monthly") {
        const month = $("dashboard-month").value || localMonthString();

        return {
            purchases: getMonthPurchases(month),
            payments: getMonthPayments(month),
            label: new Date(month + "-01").toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric"
            }),
            chartSubtitle: "Weekly summary for " +
                new Date(month + "-01").toLocaleDateString("en-IN", {
                    month: "long",
                    year: "numeric"
                })
        };
    }

    const date = $("dashboard-date").value || localDateString();

    return {
        purchases: getTodayPurchases(date),
        payments: getTodayPayments(date),
        label: formatDate(date),
        chartSubtitle: "Activity on " + formatDate(date)
    };
}

function renderDashboard() {
    const data = getDashboardData();

    const totalPurchases = data.purchases.reduce(
        (sum, purchase) => sum + getPurchaseTotal(purchase), 0
    );

    const totalPayments = data.payments.reduce(
        (sum, payment) => sum + getPaymentAmount(payment), 0
    );

    $("total-purchases").textContent = money(totalPurchases);
    $("total-payments").textContent = money(totalPayments);

    $("purchase-count").textContent = data.purchases.length;
    $("payment-count").textContent = data.payments.length;

    // Current due is across all suppliers, regardless of selected period.
    $("current-due").textContent = money(getAllOutstandingDue());
    $("suppliers-with-dues").textContent = getSuppliersWithDues();

    $("period-label").textContent =
        currentPeriod === "daily"
            ? "Showing activity for " + data.label
            : "Showing activity for " + data.label;

    $("chart-subtitle").textContent = data.chartSubtitle;

    renderDashboardChart(data);
    renderRecentPurchases(data.purchases);
}

function renderRecentPurchases(list) {
    const tbody = $("recent-purchases");
    if (!tbody) return;

    const sorted = [...list].sort((a, b) =>
        String(b.purchaseDate || "").localeCompare(String(a.purchaseDate || ""))
    ).slice(0, 7);

    if (sorted.length === 0) {
        addEmptyRow(tbody, 5, "No purchases recorded for this period.");
        return;
    }

    tbody.replaceChildren();

    sorted.forEach((purchase) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(formatDate(purchase.purchaseDate)));
        row.appendChild(createCell(purchase.supplierName || "—"));
        row.appendChild(createCell((purchase.items || []).length));
        row.appendChild(createCell(money(getPurchaseTotal(purchase))));

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        const due = getSupplierTotals(purchase.supplierName || "").balance;

        badge.className = "status-badge " + (due > 0 ? "pending" : "paid");
        badge.textContent = due > 0 ? "Due pending" : "Settled";

        statusCell.appendChild(badge);
        row.appendChild(statusCell);

        tbody.appendChild(row);
    });
}

// --------------------------------------------------
// DASHBOARD CHART
// --------------------------------------------------

document.querySelectorAll(".chart-tab").forEach((button) => {
    button.addEventListener("click", () => {
        currentChart = button.dataset.chart;

        document.querySelectorAll(".chart-tab").forEach((tab) => {
            tab.classList.toggle("active", tab === button);
        });

        renderDashboardChart(getDashboardData());
    });
});

function renderDashboardChart(data) {
    const container = $("dashboard-chart");
    if (!container) return;

    const isPurchases = currentChart === "purchases";
    const records = isPurchases ? data.purchases : data.payments;

    if (records.length === 0) {
        container.innerHTML = `
            <div class="chart-placeholder">
                <i class="fa-solid fa-chart-column"></i>
                <p>No ${isPurchases ? "purchases" : "payments"} recorded for this period.</p>
            </div>
        `;
        return;
    }

    let buckets = [];

    if (currentPeriod === "daily") {
        // Group by morning, afternoon and evening.
        buckets = [
            { label: "Morning", start: 5, end: 12 },
            { label: "Afternoon", start: 12, end: 17 },
            { label: "Evening", start: 17, end: 24 }
        ].map((bucket) => ({
            label: bucket.label,
            amount: records.reduce((sum, record) => {
                const dateValue = isPurchases
                    ? record.purchaseDate
                    : record.paymentDate;

                const timeValue = record.createdAt
                    ? new Date(record.createdAt).getHours()
                    : null;

                // Date-only records have no actual transaction time.
                // Put them in a separate "Recorded" bucket.
                if (timeValue === null) return sum;

                const dateMatches = dateValue ===
                    ($("dashboard-date").value || localDateString());

                return sum + (
                    dateMatches &&
                        timeValue >= bucket.start &&
                        timeValue < bucket.end
                        ? (isPurchases
                            ? getPurchaseTotal(record)
                            : getPaymentAmount(record))
                        : 0
                );
            }, 0)
        }));

        const withoutTime = records.filter((record) => !record.createdAt);

        if (withoutTime.length > 0) {
            buckets.push({
                label: "Recorded",
                amount: withoutTime.reduce((sum, record) => {
                    return sum + (isPurchases
                        ? getPurchaseTotal(record)
                        : getPaymentAmount(record));
                }, 0)
            });
        }
    } else {
        const month = $("dashboard-month").value || localMonthString();
        const year = Number(month.slice(0, 4));
        const monthNumber = Number(month.slice(5, 7));
        const daysInMonth = new Date(year, monthNumber, 0).getDate();
        const numberOfWeeks = Math.ceil(daysInMonth / 7);

        buckets = Array.from({ length: numberOfWeeks }, (_, index) => {
            const startDay = index * 7 + 1;
            const endDay = Math.min((index + 1) * 7, daysInMonth);

            const amount = records.reduce((sum, record) => {
                const dateValue = isPurchases
                    ? record.purchaseDate
                    : record.paymentDate;

                if (!dateValue || !dateValue.startsWith(month)) return sum;

                const day = Number(dateValue.slice(8, 10));

                return sum + (
                    day >= startDay && day <= endDay
                        ? (isPurchases
                            ? getPurchaseTotal(record)
                            : getPaymentAmount(record))
                        : 0
                );
            }, 0);

            return {
                label: `Days ${startDay}-${endDay}`,
                amount
            };
        });
    }

    const maxAmount = Math.max(...buckets.map((bucket) => bucket.amount), 1);

    const chart = document.createElement("div");
    chart.className = "chart-bars";

    buckets.forEach((bucket) => {
        const group = document.createElement("div");
        group.className = "chart-bar-group";

        const value = document.createElement("span");
        value.className = "chart-bar-value";
        value.textContent = compactMoney(bucket.amount);

        const track = document.createElement("div");
        track.className = "chart-bar-track";

        const bar = document.createElement("div");
        bar.className = "chart-bar" + (isPurchases ? "" : " payment-bar");

        const height = bucket.amount > 0
            ? Math.max(5, (bucket.amount / maxAmount) * 100)
            : 0;

        bar.style.height = `${height}%`;
        bar.title = `${bucket.label}: ${money(bucket.amount)}`;

        track.appendChild(bar);

        const label = document.createElement("span");
        label.className = "chart-bar-label";
        label.textContent = bucket.label;

        group.append(value, track, label);
        chart.appendChild(group);
    });

    container.replaceChildren(chart);
}

function compactMoney(amount) {
    const value = Number(amount) || 0;

    if (value >= 100000) {
        return "₹" + (value / 100000).toFixed(1) + "L";
    }

    if (value >= 1000) {
        return "₹" + (value / 1000).toFixed(1) + "k";
    }

    return "₹" + value.toFixed(0);
}

// --------------------------------------------------
// PURCHASE ITEM ROWS AND TOTAL CALCULATION
// --------------------------------------------------

function addItemRow(item = {}) {
    const container = $("items-container");
    if (!container) return;

    const row = document.createElement("div");
    row.className = "item-row";
    row.dataset.itemId = String(++nextItemId);

    const name = document.createElement("input");
    name.type = "text";
    name.className = "item-name";
    name.placeholder = "e.g. Rice";
    name.setAttribute("aria-label", "Item name");
    name.required = true;
    name.value = item.itemName || "";

    const price = document.createElement("input");
    price.type = "number";
    price.className = "item-price";
    price.placeholder = "0.00";
    price.min = "0.01";
    price.step = "0.01";
    price.required = true;
    price.setAttribute("aria-label", "Price per unit");
    price.value = item.pricePerUnit ?? "";

    const quantity = document.createElement("input");
    quantity.type = "number";
    quantity.className = "item-quantity";
    quantity.placeholder = "0";
    quantity.min = "0.01";
    quantity.step = "any";
    quantity.required = true;
    quantity.setAttribute("aria-label", "Quantity");
    quantity.value = item.quantity ?? "";

    const total = document.createElement("span");
    total.className = "item-total";
    total.textContent = money(
        (Number(item.pricePerUnit) || 0) * (Number(item.quantity) || 0)
    );

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.innerHTML = '<i class="fa-solid fa-trash"></i>';
    remove.setAttribute("aria-label", "Remove item");

    remove.addEventListener("click", () => {
        const rows = document.querySelectorAll(".item-row");

        if (rows.length <= 1) {
            name.value = "";
            price.value = "";
            quantity.value = "";
        } else {
            row.remove();
        }

        calculatePurchaseTotal();
    });

    [price, quantity].forEach((input) => {
        input.addEventListener("input", calculatePurchaseTotal);
    });

    row.append(name, price, quantity, total, remove);
    container.appendChild(row);

    calculatePurchaseTotal();
}

$("add-item")?.addEventListener("click", () => addItemRow());

function calculatePurchaseTotal() {
    let grandTotal = 0;
    const rows = document.querySelectorAll(".item-row");

    rows.forEach((row) => {
        const price = Number(row.querySelector(".item-price").value) || 0;
        const quantity = Number(row.querySelector(".item-quantity").value) || 0;
        const total = price > 0 && quantity > 0 ? price * quantity : 0;

        row.querySelector(".item-total").textContent = money(total);
        grandTotal += total;
    });

    if ($("grand-total")) {
        $("grand-total").textContent = money(grandTotal);
    }

    if ($("item-count")) {
        $("item-count").textContent = rows.length;
    }

    return grandTotal;
}

function getPurchaseItems() {
    return [...document.querySelectorAll(".item-row")].map((row) => ({
        itemName: row.querySelector(".item-name").value.trim(),
        pricePerUnit: Number(row.querySelector(".item-price").value),
        quantity: Number(row.querySelector(".item-quantity").value)
    }));
}

function resetPurchaseForm() {
    $("purchase-form")?.reset();

    if ($("purchase-date")) {
        $("purchase-date").value = localDateString();
    }

    $("items-container")?.replaceChildren();
    addItemRow();
    calculatePurchaseTotal();
}

$("cancel-purchase")?.addEventListener("click", () => {
    resetPurchaseForm();
});


$("purchase-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const supplierName = $("supplier-name").value.trim();
    const purchaseDate = $("purchase-date").value;
    const items = getPurchaseItems();

    if (!supplierName || !purchaseDate) {
        showToast("Please enter supplier name and purchase date.");
        return;
    }

    const validItems = items.filter((item) =>
        item.itemName &&
        Number.isFinite(item.pricePerUnit) &&
        item.pricePerUnit > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );

    if (validItems.length === 0 || validItems.length !== items.length) {
        showToast("Enter a valid name, price and quantity for every item.");
        return;
    }

    const submitButton = $("purchase-form").querySelector('[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    try {
        await apiRequest("/api/purchase", {
            method: "POST",
            body: JSON.stringify({
                supplierName,
                purchaseDate,
                items: validItems
            })
        });

        await loadPurchasesFromBackend();

        addSupplierIfMissing(supplierName);
        saveData(STORAGE_KEYS.suppliers, suppliers);

        resetPurchaseForm();
        showToast("Purchase saved to MySQL successfully.");
        showPage("history");

    } catch (error) {
        console.error("Purchase save error:", error);
        showToast("Purchase save nahi hua. Console check karo.");

    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});

// --------------------------------------------------
// PURCHASE HISTORY AND FILTERS
// --------------------------------------------------

["purchase-search", "history-from", "history-to"].forEach((id) => {
    $(id)?.addEventListener("input", renderPurchaseHistory);
});

$("clear-history-filters")?.addEventListener("click", () => {
    $("purchase-search").value = "";
    $("history-from").value = "";
    $("history-to").value = "";

    renderPurchaseHistory();
});


function renderPurchaseHistory() {
    const tbody = $("history-purchases");
    if (!tbody) return;

    const search = normalizeName($("purchase-search")?.value || "");
    const from = $("history-from")?.value || "";
    const to = $("history-to")?.value || "";

    const filtered = purchases.filter((purchase) => {
        const itemMatch = (purchase.items || []).some((item) =>
            normalizeName(item.itemName).includes(search)
        );

        const searchMatch = !search ||
            normalizeName(purchase.supplierName).includes(search) ||
            itemMatch;

        const fromMatch = !from || purchase.purchaseDate >= from;
        const toMatch = !to || purchase.purchaseDate <= to;

        return searchMatch && fromMatch && toMatch;
    }).sort((a, b) =>
        String(b.purchaseDate || "").localeCompare(
            String(a.purchaseDate || "")
        )
    );

    if (filtered.length === 0) {
        addEmptyRow(tbody, 5, "No purchases match your filters.");
        return;
    }

    tbody.replaceChildren();

    filtered.forEach((purchase) => {
        // Main purchase row
        const row = document.createElement("tr");

        row.appendChild(createCell(formatDate(purchase.purchaseDate)));
        row.appendChild(createCell(purchase.supplierName));
        row.appendChild(createCell((purchase.items || []).length));
        row.appendChild(createCell(money(getPurchaseTotal(purchase))));

        const actionCell = document.createElement("td");

        // View Items button
        const viewButton = document.createElement("button");
        viewButton.type = "button";
        viewButton.className = "table-action";
        viewButton.textContent = "View Items";

        // Hidden product details row
        const detailsRow = document.createElement("tr");
        detailsRow.className = "purchase-details-row hidden";

        const detailsCell = document.createElement("td");
        detailsCell.colSpan = 5;

        const detailsBox = document.createElement("div");
        detailsBox.className = "purchase-items-details";

        const heading = document.createElement("h4");
        heading.textContent = "Products in this purchase";
        detailsBox.appendChild(heading);

        const itemsTable = document.createElement("table");
        itemsTable.className = "purchase-items-table";

        const thead = document.createElement("thead");
        const headerRow = document.createElement("tr");

        ["Product", "Price / Unit", "Quantity", "Total"].forEach((text) => {
            const th = document.createElement("th");
            th.textContent = text;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        itemsTable.appendChild(thead);

        const itemBody = document.createElement("tbody");
        const items = Array.isArray(purchase.items) ? purchase.items : [];

        items.forEach((item) => {
            const itemRow = document.createElement("tr");

            const price = Number(item.pricePerUnit) || 0;
            const quantity = Number(item.quantity) || 0;
            const itemTotal = price * quantity;

            itemRow.appendChild(createCell(item.itemName || "Unnamed product"));
            itemRow.appendChild(createCell(money(price)));
            itemRow.appendChild(createCell(quantity));
            itemRow.appendChild(createCell(money(itemTotal)));

            itemBody.appendChild(itemRow);
        });

        itemsTable.appendChild(itemBody);
        detailsBox.appendChild(itemsTable);

        const total = document.createElement("p");
        total.className = "purchase-items-grand-total";
        total.textContent = "Purchase Total: " + money(getPurchaseTotal(purchase));
        detailsBox.appendChild(total);

        detailsCell.appendChild(detailsBox);
        detailsRow.appendChild(detailsCell);

        // Toggle product details
        viewButton.addEventListener("click", () => {
            const isHidden = detailsRow.classList.contains("hidden");

            detailsRow.classList.toggle("hidden", !isHidden);
            viewButton.textContent = isHidden ? "Hide Items" : "View Items";
        });

        actionCell.appendChild(viewButton);
        row.appendChild(actionCell);

        // Keep the existing Delete feature
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "table-action danger-button";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            const confirmed = window.confirm(
                "Delete this purchase? This action cannot be undone."
            );

            if (!confirmed) return;

            try {
                await apiRequest(
                    `/api/purchase/${encodeURIComponent(purchase.id)}`,
                    { method: "DELETE" }
                );

                await loadPurchasesFromBackend();
                showToast("Purchase deleted from the database.");
            } catch (error) {
                console.error("Purchase delete error:", error);
                showToast("Purchase delete nahi hua. Console check karo.");
            }
        });

        actionCell.appendChild(deleteButton);

        tbody.appendChild(row);
        tbody.appendChild(detailsRow);
    });
}


// --------------------------------------------------
// PAYMENTS
// --------------------------------------------------


$("payment-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const supplierName = $("payment-supplier").value.trim();
    const paymentDate = $("payment-date").value;
    const amount = Number($("payment-amount").value);

    if (!supplierName || !paymentDate) {
        showToast("Please enter supplier name and payment date.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        showToast("Enter a payment amount greater than zero.");
        return;
    }

    const submitButton = $("payment-form").querySelector('[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        await apiRequest("/api/payment", {
            method: "POST",
            body: JSON.stringify({
                supplierName,
                paymentDate,
                amount
            })
        });

        payments = extractArray(
            await apiRequest("/api/payment")
        );

        addSupplierIfMissing(supplierName);
        saveData(STORAGE_KEYS.suppliers, suppliers);
        refreshAllViews();

        $("payment-form").reset();
        $("payment-date").value = localDateString();

        showToast("Payment saved to database successfully.");
    } catch (error) {
        console.error("Payment save error:", error);
        showToast("Payment save nahi hua. Console check karo.");
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
});


["payment-search", "payment-history-from", "payment-history-to"].forEach((id) => {
    $(id)?.addEventListener("input", renderPaymentHistory);
});

function renderPaymentHistory() {
    const tbody = $("payment-history");
    if (!tbody) return;

    const search = normalizeName($("payment-search")?.value || "");
    const from = $("payment-history-from")?.value || "";
    const to = $("payment-history-to")?.value || "";

    const filtered = payments.filter((payment) => {
        const matchesName = !search ||
            normalizeName(payment.supplierName).includes(search);

        const matchesFrom = !from || payment.paymentDate >= from;
        const matchesTo = !to || payment.paymentDate <= to;

        return matchesName && matchesFrom && matchesTo;
    }).sort((a, b) =>
        String(b.paymentDate || "").localeCompare(String(a.paymentDate || ""))
    );

    const month = localMonthString();

    const thisMonthTotal = getMonthPayments(month).reduce(
        (sum, payment) => sum + getPaymentAmount(payment), 0
    );

    if ($("payments-month-total")) {
        $("payments-month-total").textContent = money(thisMonthTotal);
    }

    if ($("payments-current-due")) {
        $("payments-current-due").textContent = money(getAllOutstandingDue());
    }

    if (filtered.length === 0) {
        addEmptyRow(tbody, 5, "No payments match your filters.");
        return;
    }

    tbody.replaceChildren();

    filtered.forEach((payment) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(formatDate(payment.paymentDate)));
        row.appendChild(createCell(payment.supplierName));
        row.appendChild(createCell(payment.method || "—"));
        row.appendChild(createCell(payment.note || "—"));
        row.appendChild(createCell(money(getPaymentAmount(payment))));

        tbody.appendChild(row);
    });
}

// --------------------------------------------------
// SUPPLIER LEDGER
// --------------------------------------------------

$("view-ledger")?.addEventListener("click", renderLedger);
$("ledger-supplier")?.addEventListener("change", renderLedger);
$("ledger-from")?.addEventListener("change", renderLedger);
$("ledger-to")?.addEventListener("change", renderLedger);

function renderLedger() {
    const supplierName = $("ledger-supplier")?.value.trim() || "";
    const tbody = $("ledger-transactions");

    if (!tbody) return;

    if (!supplierName) {
        $("ledger-total-purchases").textContent = money(0);
        $("ledger-total-payments").textContent = money(0);
        $("ledger-balance").textContent = money(0);
        $("ledger-heading").textContent = "Account Transactions";

        addEmptyRow(tbody, 5, "Select a supplier to view their ledger.");
        return;
    }

    const totals = getSupplierTotals(supplierName);

    $("ledger-total-purchases").textContent = money(totals.totalPurchases);
    $("ledger-total-payments").textContent = money(totals.totalPayments);
    $("ledger-balance").textContent = money(totals.balance);
    $("ledger-heading").textContent = supplierName + " — Account Ledger";

    const from = $("ledger-from").value || "";
    const to = $("ledger-to").value || "";

    const transactions = [];

    purchases.filter((purchase) =>
        sameSupplier(purchase.supplierName, supplierName)
    ).forEach((purchase) => {
        transactions.push({
            id: purchase.id,
            date: purchase.purchaseDate,
            type: "Purchase",
            details: (purchase.items || [])
                .map((item) => item.itemName)
                .filter(Boolean)
                .join(", ") || "Goods purchased",
            debit: getPurchaseTotal(purchase),
            credit: 0,
            createdAt: purchase.createdAt || ""
        });
    });

    payments.filter((payment) =>
        sameSupplier(payment.supplierName, supplierName)
    ).forEach((payment) => {
        transactions.push({
            id: payment.id,
            date: payment.paymentDate,
            type: "Payment",
            details: payment.method
                ? "Payment · " + payment.method
                : "Supplier payment",
            debit: 0,
            credit: getPaymentAmount(payment),
            createdAt: payment.createdAt || ""
        });
    });

    // Chronological balance calculation.
    // Purchases increase the due; payments reduce the due.
    transactions.sort((a, b) => {
        const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));

        if (dateCompare !== 0) return dateCompare;

        return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });

    let runningBalance = 0;

    transactions.forEach((transaction) => {
        runningBalance += transaction.debit - transaction.credit;
        transaction.balance = runningBalance;
    });

    // Date filters affect visible rows, not the current account summary.
    const visibleTransactions = transactions.filter((transaction) => {
        return (!from || transaction.date >= from) &&
            (!to || transaction.date <= to);
    });

    if (visibleTransactions.length === 0) {
        addEmptyRow(tbody, 5, "No ledger transactions match this date range.");
        return;
    }

    tbody.replaceChildren();

    visibleTransactions.forEach((transaction) => {
        const row = document.createElement("tr");

        row.appendChild(createCell(formatDate(transaction.date)));
        row.appendChild(createCell(transaction.details));
        row.appendChild(createCell(
            transaction.debit ? money(transaction.debit) : "—"
        ));
        row.appendChild(createCell(
            transaction.credit ? money(transaction.credit) : "—"
        ));

        const balanceClass = transaction.balance > 0
            ? "amount-negative"
            : transaction.balance < 0
                ? "amount-positive"
                : "";

        row.appendChild(createCell(
            money(transaction.balance),
            balanceClass
        ));

        tbody.appendChild(row);
    });
}

$("print-ledger")?.addEventListener("click", () => {
    if (!$("ledger-supplier").value.trim()) {
        showToast("Select a supplier before printing.");
        return;
    }

    showPage("ledger");
    window.print();
});

// --------------------------------------------------
// SUPPLIERS
// --------------------------------------------------

$("add-supplier-button")?.addEventListener("click", () => {
    $("supplier-form")?.reset();
    $("supplier-dialog")?.showModal();
});

function closeSupplierDialog() {
    $("supplier-dialog")?.close();
}

$("close-supplier-dialog")?.addEventListener("click", closeSupplierDialog);
$("cancel-supplier-dialog")?.addEventListener("click", closeSupplierDialog);

$("supplier-form")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("new-supplier-name").value.trim();
    const phone = $("new-supplier-phone").value.trim();
    const address = $("new-supplier-address").value.trim();

    if (!name) {
        showToast("Enter the supplier name.");
        return;
    }

    if (getSupplierNames().some((existing) => sameSupplier(existing, name))) {
        showToast("This supplier already exists.");
        return;
    }

    addSupplierIfMissing(name, { phone, address });

    saveAllData();
    refreshAllViews();

    closeSupplierDialog();
    showToast("Supplier added successfully.");
});

$("supplier-search")?.addEventListener("input", renderSuppliers);

function renderSuppliers() {
    const tbody = $("suppliers-table");
    if (!tbody) return;

    const search = normalizeName($("supplier-search")?.value || "");

    const names = getSupplierNames().filter((name) =>
        name.toLowerCase().includes(search)
    );

    if (names.length === 0) {
        addEmptyRow(tbody, 5, "No suppliers found.");
        return;
    }

    tbody.replaceChildren();

    names.forEach((name) => {
        const totals = getSupplierTotals(name);
        const row = document.createElement("tr");

        row.appendChild(createCell(name));
        row.appendChild(createCell(money(totals.totalPurchases)));
        row.appendChild(createCell(money(totals.totalPayments)));

        const dueCell = createCell(money(totals.balance));
        if (totals.balance > 0) {
            dueCell.classList.add("amount-negative");
        } else if (totals.balance < 0) {
            dueCell.classList.add("amount-positive");
        }

        row.appendChild(dueCell);

        const actionCell = document.createElement("td");
        const button = document.createElement("button");

        button.type = "button";
        button.className = "table-action";
        button.textContent = "View Ledger";

        button.addEventListener("click", () => {
            $("ledger-supplier").value = name;
            $("ledger-from").value = "";
            $("ledger-to").value = "";

            showPage("ledger");
            renderLedger();
        });

        actionCell.appendChild(button);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });
}

function refreshSupplierOptions() {
    const datalist = $("supplier-options");
    if (!datalist) return;

    datalist.replaceChildren();

    getSupplierNames().forEach((name) => {
        const option = document.createElement("option");
        option.value = name;
        datalist.appendChild(option);
    });
}

// --------------------------------------------------
// REFRESH ALL UI
// --------------------------------------------------

function refreshAllViews() {
    refreshSupplierOptions();

    renderDashboard();
    renderPurchaseHistory();
    renderPaymentHistory();
    renderLedger();
    renderSuppliers();
}

// --------------------------------------------------
// START APPLICATION
// --------------------------------------------------

initializeDates();

if (document.querySelectorAll(".item-row").length === 0) {
    addItemRow();
}

refreshAllViews();
showPage("dashboard");
loadPurchasesFromBackend();
loadPaymentsFromBackend();