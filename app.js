/* =========================================================
   MSN BROCK — app.js
   Professional paper-trading / account-dashboard frontend
   ========================================================= */

const CLIENT_ID = "BRCLT-45871293";

const USERS = [
  {
    username: "shreyas",
    password: "SHR129",
    balance: 2000000000,
    withdrawalLimit: 60000,
    pendingWithdrawal: 8000
  },
  {
    username: "zain",
    password: "zai129",
    balance: 9000000000,
    withdrawalLimit: 5000,
    pendingWithdrawal: 5000
  },
  {
    username: "rana",
    password: "ran129",
    balance: 3650000000,
    withdrawalLimit: 6000,
    pendingWithdrawal: 6000
  },
  {
    username: "gani",
    password: "gan129",
    balance: 7800000,
    withdrawalLimit: 4000,
    pendingWithdrawal: 4000
  },
  {
    username: "dhanush",
    password: "dha129",
    balance: 3500000,
    withdrawalLimit: 0,
    pendingWithdrawal: 0
  },
  {
    username: "nadeem",
    password: "nad129",
    balance: 7500000,
    withdrawalLimit: 2500,
    pendingWithdrawal: 2500
  }
];

/* -----------------------------
   STOCK DATA
----------------------------- */

const STOCKS = [
  ["RELIANCE", "Reliance Industries", 2941.25, 1.18],
  ["TCS", "Tata Consultancy Services", 4178.40, -0.42],
  ["INFY", "Infosys", 1810.65, 0.74],
  ["HDFCBANK", "HDFC Bank", 1972.10, 0.31],
  ["ICICIBANK", "ICICI Bank", 1427.80, 1.02],
  ["SBIN", "State Bank of India", 926.55, -0.63],
  ["ITC", "ITC Limited", 493.20, 0.52],
  ["BHARTIARTL", "Bharti Airtel", 1888.30, 1.41],
  ["LT", "Larsen & Toubro", 3892.00, 0.16],
  ["MARUTI", "Maruti Suzuki", 12740.00, -0.28]
];

let prices = STOCKS.map(stock => stock[2]);

/* -----------------------------
   APPLICATION STATE
----------------------------- */

let currentUser = null;
let cashBalance = 0;

let watchlist = new Set([
  "RELIANCE",
  "INFY"
]);

let holdings = {};
let transactions = [];
let withdrawalHistory = [];

let tradeSide = "BUY";

/* -----------------------------
   HELPERS
----------------------------- */

function $(id) {
  return document.getElementById(id);
}

function money(value) {
  return "₹" + Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function today() {
  return new Date().toLocaleDateString("en-IN");
}

/* =========================================================
   LOGIN
========================================================= */

function login() {

  const username = $("username").value.trim().toLowerCase();
  const clientId = $("clientId").value.trim();
  const password = $("password").value;

  const account = USERS.find(user =>
    user.username === username &&
    user.password === password &&
    clientId === CLIENT_ID
  );

  if (!account) {
    $("loginError").textContent =
      "Invalid username, Client ID, or password.";

    return;
  }

  currentUser = account;

  cashBalance = account.balance;

  sessionStorage.setItem(
    "msn_brock_user",
    account.username
  );

  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  $("topUser").textContent =
    "● " + account.username;

  $("welcome").textContent =
    account.username;

  renderAll();
}

/* Enter key login */

$("password")?.addEventListener("keydown", event => {

  if (event.key === "Enter") {
    login();
  }

});

$("loginBtn")?.addEventListener("click", login);

/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  sessionStorage.removeItem("msn_brock_user");

  currentUser = null;
  holdings = {};
  transactions = [];
  withdrawalHistory = [];

  location.reload();
}

$("logoutBtn")?.addEventListener("click", logout);

/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  if (!currentUser) return;

  const portfolio = calculatePortfolio();

  $("balance").textContent =
    money(currentUser.balance);

  $("dashPortfolio").textContent =
    money(portfolio.value);

  $("dashPnl").textContent =
    (portfolio.pnl >= 0 ? "+" : "") +
    money(portfolio.pnl) +
    " simulated P&L";

  $("dashPnl").className =
    portfolio.pnl >= 0 ? "up" : "down";

  $("dashLimit").textContent =
    money(currentUser.withdrawalLimit);

  $("kycDash").textContent =
    "Under Review";

  $("wdBalance").textContent =
    money(currentUser.balance);

  $("wdLimit").textContent =
    money(currentUser.withdrawalLimit);
}

/* =========================================================
   MARKETS
========================================================= */

function renderMarkets() {

  const search =
    ($("search")?.value || "").toUpperCase();

  if (!$("marketRows")) return;

  const rows = STOCKS
    .map((stock, index) => ({
      stock,
      index
    }))
    .filter(item =>
      item.stock[0].includes(search) ||
      item.stock[1]
        .toUpperCase()
        .includes(search)
    );

  $("marketRows").innerHTML = rows.map(item => {

    const stock = item.stock;
    const index = item.index;
    const change = stock[3];

    return `
      <tr>

        <td class="symbol">
          ${stock[0]}
        </td>

        <td>
          ${stock[1]}
        </td>

        <td>
          ${money(prices[index])}
        </td>

        <td class="${change >= 0 ? "up" : "down"}">
          ${change >= 0 ? "+" : ""}
          ${change.toFixed(2)}%
        </td>

        <td>

          <button
            class="star ${watchlist.has(stock[0]) ? "on" : ""}"
            onclick="toggleWatch('${stock[0]}')"
          >
            ★
          </button>

        </td>

        <td>

          <button
            class="trade-btn"
            onclick="goTrade('${stock[0]}')"
          >
            Trade
          </button>

        </td>

      </tr>
    `;

  }).join("");

}

/* Search */

$("search")?.addEventListener(
  "input",
  renderMarkets
);

/* =========================================================
   WATCHLIST
========================================================= */

function toggleWatch(symbol) {

  if (watchlist.has(symbol)) {
    watchlist.delete(symbol);
  } else {
    watchlist.add(symbol);
  }

  renderAll();
}

function renderWatchlist() {

  if (!$("watchRows")) return;

  if (watchlist.size === 0) {

    $("watchRows").innerHTML =
      `<p class="muted">
        Your watchlist is empty.
      </p>`;

    return;
  }

  $("watchRows").innerHTML =
    [...watchlist].map(symbol => {

      const index =
        STOCKS.findIndex(
          stock => stock[0] === symbol
        );

      const stock = STOCKS[index];

      return `
        <div class="mover">

          <div>
            <b>${stock[0]}</b>
            <div class="muted">
              ${stock[1]}
            </div>
          </div>

          <div>
            ${money(prices[index])}

            <br>

            <span class="${stock[3] >= 0 ? "up" : "down"}">
              ${stock[3] >= 0 ? "+" : ""}
              ${stock[3].toFixed(2)}%
            </span>
          </div>

        </div>
      `;

    }).join("");
}

/* =========================================================
   PORTFOLIO
========================================================= */

function calculatePortfolio() {

  let value = cashBalance;
  let pnl = 0;

  Object.entries(holdings).forEach(
    ([symbol, holding]) => {

      const index =
        STOCKS.findIndex(
          stock => stock[0] === symbol
        );

      const current =
        prices[index];

      const currentValue =
        holding.qty * current;

      value += currentValue;

      pnl +=
        (current - holding.averagePrice) *
        holding.qty;
    }
  );

  return {
    value,
    pnl
  };
}

function renderPortfolio() {

  if (!currentUser) return;

  const portfolio =
    calculatePortfolio();

  $("portValue").textContent =
    money(portfolio.value);

  $("portCash").textContent =
    money(cashBalance);

  $("portPnl").textContent =
    money(portfolio.pnl);

  $("portPnl").className =
    portfolio.pnl >= 0 ? "up" : "down";

  const rows =
    Object.entries(holdings);

  if (rows.length === 0) {

    $("portfolioRows").innerHTML = `
      <tr>
        <td colspan="6" class="muted">
          No simulated holdings.
        </td>
      </tr>
    `;

    return;
  }

  $("portfolioRows").innerHTML =
    rows.map(([symbol, holding]) => {

      const index =
        STOCKS.findIndex(
          stock => stock[0] === symbol
        );

      const current =
        prices[index];

      const value =
        holding.qty * current;

      const pnl =
        (current - holding.averagePrice) *
        holding.qty;

      return `
        <tr>

          <td class="symbol">
            ${symbol}
          </td>

          <td>
            ${holding.qty}
          </td>

          <td>
            ${money(holding.averagePrice)}
          </td>

          <td>
            ${money(current)}
          </td>

          <td>
            ${money(value)}
          </td>

          <td class="${pnl >= 0 ? "up" : "down"}">
            ${money(pnl)}
          </td>

        </tr>
      `;

    }).join("");
}

/* =========================================================
   TRADE SIMULATION
========================================================= */

function setupTradeStocks() {

  if (!$("tradeStock")) return;

  $("tradeStock").innerHTML =
    STOCKS.map(stock =>
      `<option value="${stock[0]}">
        ${stock[0]}
      </option>`
    ).join("");

  updateTradeEstimate();
}

function updateTradeEstimate() {

  if (!$("tradeStock")) return;

  const symbol =
    $("tradeStock").value;

  const quantity =
    Math.floor(
      Number($("tradeQty").value) || 0
    );

  const index =
    STOCKS.findIndex(
      stock => stock[0] === symbol
    );

  if (index < 0) return;

  $("estimate").textContent =
    money(prices[index] * quantity);
}

$("tradeQty")?.addEventListener(
  "input",
  updateTradeEstimate
);

$("tradeStock")?.addEventListener(
  "change",
  updateTradeEstimate
);

function goTrade(symbol) {

  showPage("trade");

  if ($("tradeStock")) {
    $("tradeStock").value =
      symbol;
  }

  updateTradeEstimate();
}

/* BUY */

$("buyTab")?.addEventListener(
  "click",
  () => {

    tradeSide = "BUY";

    $("buyTab").classList.add(
      "selected"
    );

    $("sellTab").classList.remove(
      "selected"
    );

  }
);

/* SELL */

$("sellTab")?.addEventListener(
  "click",
  () => {

    tradeSide = "SELL";

    $("sellTab").classList.add(
      "selected"
    );

    $("buyTab").classList.remove(
      "selected"
    );

  }
);

/* Execute */

function executeTrade() {

  const symbol =
    $("tradeStock").value;

  const quantity =
    Math.floor(
      Number($("tradeQty").value)
    );

  if (!quantity || quantity < 1) {

    $("tradeMessage").textContent =
      "Enter a valid quantity.";

    return;
  }

  const index =
    STOCKS.findIndex(
      stock => stock[0] === symbol
    );

  const price =
    prices[index];

  if (!holdings[symbol]) {

    holdings[symbol] = {
      qty: 0,
      averagePrice: 0
    };

  }

  const holding =
    holdings[symbol];

  if (tradeSide === "BUY") {

    const cost =
      quantity * price;

    if (cost > cashBalance) {

      $("tradeMessage").textContent =
        "Insufficient paper-trading cash.";

      return;
    }

    holding.averagePrice =
      (
        holding.averagePrice *
        holding.qty +
        cost
      ) /
      (
        holding.qty +
        quantity
      );

    holding.qty += quantity;

    cashBalance -= cost;

    transactions.push({
      date: today(),
      description:
        "Paper BUY — " + symbol,
      credit: 0,
      debit: cost,
      balance: cashBalance,
      status: "PAPER"
    });

  } else {

    if (quantity > holding.qty) {

      $("tradeMessage").textContent =
        "Insufficient paper-trading shares.";

      return;
    }

    const proceeds =
      quantity * price;

    holding.qty -= quantity;

    cashBalance += proceeds;

    transactions.push({
      date: today(),
      description:
        "Paper SELL — " + symbol,
      credit: proceeds,
      debit: 0,
      balance: cashBalance,
      status: "PAPER"
    });

    if (holding.qty === 0) {
      delete holdings[symbol];
    }

  }

  $("tradeMessage").textContent =
    "Order completed in paper trading.";

  renderAll();
}

/* =========================================================
   WITHDRAWAL
========================================================= */

function renderWithdrawals() {

  if (!$("wdHistory")) return;

  const configured =
    currentUser.pendingWithdrawal;

  let rows = [];

  if (configured > 0) {

    rows.push({
      date: today(),
      amount: configured,
      status: "PENDING",
      reference:
        "MB-PENDING-" +
        currentUser.username.toUpperCase()
    });

  }

  rows = rows.concat(
    withdrawalHistory
  );

  $("wdHistory").innerHTML =
    rows.map(item => `
      <tr>

        <td>
          ${item.date}
        </td>

        <td>
          ${money(item.amount)}
        </td>

        <td class="amber-text">
          ${item.status}
        </td>

        <td>
          ${item.reference}
        </td>

      </tr>
    `).join("");

}

/* Withdrawal request */

$("wdBtn")?.addEventListener(
  "click",
  () => {

    const amount =
      Number($("wdAmount").value);

    if (currentUser.withdrawalLimit <= 0) {

      $("wdMsg").textContent =
        "Withdrawal is currently unavailable for this account.";

      return;
    }

    if (!amount || amount <= 0) {

      $("wdMsg").textContent =
        "Enter a valid withdrawal amount.";

      return;
    }

    if (
      amount >
      currentUser.withdrawalLimit
    ) {

      $("wdMsg").textContent =
        "Amount exceeds the configured withdrawal limit.";

      return;
    }

    withdrawalHistory.push({
      date: today(),
      amount,
      status: "PENDING",
      reference:
        "MB-REQ-" +
        Date.now().toString().slice(-8)
    });

    $("wdMsg").textContent =
      "Withdrawal request submitted as PENDING.";

    $("wdAmount").value = "";

    renderWithdrawals();
  }
);

/* =========================================================
   STATEMENT
========================================================= */

function renderStatement() {

  if (!$("statementRows")) return;

  $("statementClient").textContent =
    currentUser.username;

  const rows = [
    {
      date: today(),
      description:
        "Opening paper-trading balance",
      credit: 0,
      debit: 0,
      balance:
        currentUser.balance,
      status: "PAPER"
    },

    ...transactions
  ];

  $("statementRows").innerHTML =
    rows.map(row => `
      <tr>

        <td>
          ${row.date}
        </td>

        <td>
          ${row.description}
        </td>

        <td>
          ${row.credit
            ? money(row.credit)
            : "—"}
        </td>

        <td>
          ${row.debit
            ? money(row.debit)
            : "—"}
        </td>

        <td>
          ${money(row.balance)}
        </td>

        <td>
          ${row.status}
        </td>

      </tr>
    `).join("");
}

/* =========================================================
   KYC
========================================================= */

function submitKYC() {

  alert(
    function submitKYC() {
    const message = document.getElementById("kycMessage");

    message.innerHTML = `
        <div class="kyc-success">
            ✓ All documents submitted successfully.
            <br>
            <span>Your KYC application is now under review.</span>
        </div>
    `;
}
  );

}

/* =========================================================
   MARKET SNAPSHOT
========================================================= */

function renderSnapshot() {

  if (!$("snapshot")) return;

  $("snapshot").innerHTML =
    STOCKS.slice(0, 5).map(
      (stock, index) => `
        <div class="snapshot">

          <span>
            <b>${stock[0]}</b>
            <br>
            <small class="muted">
              ${money(prices[index])}
            </small>
          </span>

          <span class="${stock[3] >= 0
            ? "up"
            : "down"}">

            ${stock[3] >= 0 ? "+" : ""}
            ${stock[3].toFixed(2)}%

          </span>

        </div>
      `
    ).join("");
}

/* =========================================================
   CHART
========================================================= */

function drawChart() {

  const canvas =
    $("marketChart");

  if (!canvas) return;

  const rect =
    canvas.getBoundingClientRect();

  const width =
    rect.width;

  const height =
    270;

  const ratio =
    window.devicePixelRatio || 1;

  canvas.width =
    width * ratio;

  canvas.height =
    height * ratio;

  const ctx =
    canvas.getContext("2d");

  ctx.scale(
    ratio,
    ratio
  );

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  const points =
    Array.from(
      { length: 60 },
      (_, index) =>
        height * 0.52 -
        Math.sin(index / 4) *
        height * 0.15 -
        index * 0.6 +
        (Math.random() - 0.5) *
        14
    );

  ctx.strokeStyle =
    "#31df7b";

  ctx.lineWidth = 2;

  ctx.beginPath();

  points.forEach(
    (y, index) => {

      const x =
        8 +
        index *
        (width - 16) /
        (points.length - 1);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

    }
  );

  ctx.stroke();
}

/* =========================================================
   PAGE NAVIGATION
========================================================= */

function showPage(pageId) {

  document
    .querySelectorAll(".page")
    .forEach(page =>
      page.classList.add("hidden")
    );

  const page =
    $(pageId);

  if (page) {
    page.classList.remove(
      "hidden"
    );
  }

  document
    .querySelectorAll(".nav")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.page ===
        pageId
      );

    });

  if (pageId === "dashboard") {
    setTimeout(drawChart, 50);
  }

}

/* Sidebar */

document
  .querySelectorAll(".nav")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => showPage(
        button.dataset.page
      )
    );

  });

/* Quick actions */

document
  .querySelectorAll("[data-goto]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => showPage(
        button.dataset.goto
      )
    );

  });

/* =========================================================
   MASTER RENDER
========================================================= */

function renderAll() {

  renderDashboard();
  renderMarkets();
  renderWatchlist();
  renderPortfolio();
  renderSnapshot();
  renderWithdrawals();
  renderStatement();
  setupTradeStocks();

  setTimeout(
    drawChart,
    50
  );
}

/* =========================================================
   LIVE-STYLE PRICE REFRESH
========================================================= */

setInterval(() => {

  if (!currentUser) return;

  prices =
    prices.map(
      price =>
        price *
        (
          1 +
          (Math.random() - 0.5) *
          0.001
        )
    );

  STOCKS.forEach(
    stock => {

      stock[3] =
        Math.max(
          -5,
          Math.min(
            5,
            stock[3] +
            (Math.random() - 0.5) *
            0.08
          )
        );

    }
  );

  renderAll();

}, 5000);

/* =========================================================
   RESTORE LOGIN
========================================================= */

const savedUser =
  sessionStorage.getItem(
    "msn_brock_user"
  );

if (savedUser) {

  const account =
    USERS.find(
      user =>
        user.username ===
        savedUser
    );

  if (account) {

    currentUser =
      account;

    cashBalance =
      account.balance;

    $("loginView")
      .classList.add("hidden");

    $("appView")
      .classList.remove("hidden");

    $("topUser").textContent =
      "● " +
      account.username;

    $("welcome").textContent =
      account.username;

    renderAll();

  }

}
