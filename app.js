const CLIENT_ID="BRCLT-45871293";

const USERS=[
 {username:"shreyas",password:"SHR129",balance:2000000000,withdrawalLimit:8000,pendingPayment:8000,pendingWithdrawal:8000,monthlyPayable:125000},
 {username:"zain",password:"zai129",balance:9000000000,withdrawalLimit:5000,pendingPayment:5000,pendingWithdrawal:5000,monthlyPayable:125000},
 {username:"rana",password:"ran129",balance:3650000000,withdrawalLimit:6000,pendingPayment:6000,pendingWithdrawal:6000,monthlyPayable:125000},
 {username:"gani",password:"gan129",balance:7800000,withdrawalLimit:4000,pendingPayment:4000,pendingWithdrawal:4000,monthlyPayable:125000},
 {username:"dhanush",password:"dha129",balance:3500000,withdrawalLimit:0,pendingPayment:2000,pendingWithdrawal:2000,monthlyPayable:125000},
 {username:"nadeem",password:"nad129",balance:7500000,withdrawalLimit:2500,pendingPayment:2500,pendingWithdrawal:2500,monthlyPayable:125000}
];

const STOCKS=[
 ["RELIANCE","Reliance Industries",2941.25,1.18],["TCS","Tata Consultancy Services",4178.40,-0.42],
 ["INFY","Infosys",1810.65,0.74],["HDFCBANK","HDFC Bank",1972.10,0.31],
 ["ICICIBANK","ICICI Bank",1427.80,1.02],["SBIN","State Bank of India",926.55,-0.63],
 ["ITC","ITC Limited",493.20,0.52],["BHARTIARTL","Bharti Airtel",1888.30,1.41],
 ["LT","Larsen & Toubro",3892,0.16],["MARUTI","Maruti Suzuki",12740,-0.28]
];

let prices=STOCKS.map(s=>s[2]),currentUser=null,cashBalance=0;
let watchlist=new Set(["RELIANCE","INFY"]),holdings={},transactions=[],withdrawalHistory=[],tradeSide="BUY";
const $=id=>document.getElementById(id);
const money=n=>"₹"+Number(n).toLocaleString("en-IN",{maximumFractionDigits:2});
const today=()=>new Date().toLocaleDateString("en-IN");

function login(){
 const u=$("username").value.trim().toLowerCase(),c=$("clientId").value.trim(),p=$("password").value;
 const a=USERS.find(x=>x.username===u&&x.password===p&&c===CLIENT_ID);
 if(!a){$("loginError").textContent="Invalid username, Client ID, or password.";return}
 currentUser=a;cashBalance=a.balance;sessionStorage.setItem("msn_brock_user",a.username);
 $("loginView").classList.add("hidden");$("appView").classList.remove("hidden");
 $("topUser").textContent="● "+a.username;$("welcome").textContent=a.username;renderAll();
}
$("loginBtn").onclick=login;
$("password").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
$("logoutBtn").onclick=()=>{sessionStorage.removeItem("msn_brock_user");location.reload()};

function calculatePortfolio(){
 let value=cashBalance,pnl=0;
 Object.entries(holdings).forEach(([s,h])=>{const i=STOCKS.findIndex(x=>x[0]===s);value+=h.qty*prices[i];pnl+=(prices[i]-h.averagePrice)*h.qty});
 return {value,pnl};
}

function renderDashboard(){
 const p=calculatePortfolio();
 $("balance").textContent=money(currentUser.balance);$("dashPortfolio").textContent=money(p.value);
 $("dashPnl").textContent=(p.pnl>=0?"+":"")+money(p.pnl)+" simulated P&L";$("dashPnl").className=p.pnl>=0?"up":"down";
 $("dashPending").textContent=money(currentUser.pendingPayment);$("monthlyPayable").textContent=money(currentUser.monthlyPayable);
 $("dashLimit").textContent=money(currentUser.withdrawalLimit);$("wdBalance").textContent=money(currentUser.balance);$("wdLimit").textContent=money(currentUser.withdrawalLimit);
}

function renderPendingPayment(){
 $("pendingClient").textContent=currentUser.username;$("pendingClient2").textContent=currentUser.username;
 $("pendingAmount").textContent=money(currentUser.pendingPayment);$("pendingAmount2").textContent=money(currentUser.pendingPayment);
 $("pendingMonthly").textContent=money(currentUser.monthlyPayable);$("pendingMonthly2").textContent=money(currentUser.monthlyPayable);
}

function renderMarkets(){
 const q=($("search")?.value||"").toUpperCase();
 $("marketRows").innerHTML=STOCKS.map((s,i)=>({s,i})).filter(x=>x.s[0].includes(q)||x.s[1].toUpperCase().includes(q)).map(x=>`
 <tr><td class="symbol">${x.s[0]}</td><td>${x.s[1]}</td><td>${money(prices[x.i])}</td>
 <td class="${x.s[3]>=0?"up":"down"}">${x.s[3]>=0?"+":""}${x.s[3].toFixed(2)}%</td>
 <td><button class="star ${watchlist.has(x.s[0])?"on":""}" onclick="toggleWatch('${x.s[0]}')">★</button></td>
 <td><button class="trade-btn" onclick="goTrade('${x.s[0]}')">Trade</button></td></tr>`).join("");
}
$("search").oninput=renderMarkets;

function toggleWatch(s){watchlist.has(s)?watchlist.delete(s):watchlist.add(s);renderAll()}
function renderWatchlist(){
 $("watchRows").innerHTML=[...watchlist].map(s=>{const i=STOCKS.findIndex(x=>x[0]===s);return `<div class="mover"><div><b>${s}</b><div class="muted">${STOCKS[i][1]}</div></div><div>${money(prices[i])}<br><span class="${STOCKS[i][3]>=0?"up":"down"}">${STOCKS[i][3]>=0?"+":""}${STOCKS[i][3].toFixed(2)}%</span></div></div>`}).join("")||"<p class='muted'>Watchlist is empty.</p>";
}

function renderPortfolio(){
 const p=calculatePortfolio();$("portValue").textContent=money(p.value);$("portCash").textContent=money(cashBalance);$("portPnl").textContent=money(p.pnl);$("portPnl").className=p.pnl>=0?"up":"down";
 $("portfolioRows").innerHTML=Object.entries(holdings).map(([s,h])=>{const i=STOCKS.findIndex(x=>x[0]===s),v=prices[i],val=h.qty*v,pnl=(v-h.averagePrice)*h.qty;return `<tr><td class="symbol">${s}</td><td>${h.qty}</td><td>${money(h.averagePrice)}</td><td>${money(v)}</td><td>${money(val)}</td><td class="${pnl>=0?"up":"down"}">${money(pnl)}</td></tr>`}).join("")||"<tr><td colspan='6' class='muted'>No simulated holdings.</td></tr>";
}

function renderSnapshot(){
 $("snapshot").innerHTML=STOCKS.slice(0,5).map((s,i)=>`<div class="snapshot"><span><b>${s[0]}</b><br><small class="muted">${money(prices[i])}</small></span><span class="${s[3]>=0?"up":"down"}">${s[3]>=0?"+":""}${s[3].toFixed(2)}%</span></div>`).join("");
}

function setupTradeStocks(){$("tradeStock").innerHTML=STOCKS.map(s=>`<option value="${s[0]}">${s[0]}</option>`).join("");updateTradeEstimate()}
function updateTradeEstimate(){const s=$("tradeStock").value,q=Math.floor(Number($("tradeQty").value)||0),i=STOCKS.findIndex(x=>x[0]===s);if(i>=0)$("estimate").textContent=money(prices[i]*q)}
$("tradeQty").oninput=updateTradeEstimate;$("tradeStock").onchange=updateTradeEstimate;
function goTrade(s){showPage("trade");$("tradeStock").value=s;updateTradeEstimate()}
$("buyTab").onclick=()=>{tradeSide="BUY";$("buyTab").classList.add("selected");$("sellTab").classList.remove("selected")};
$("sellTab").onclick=()=>{tradeSide="SELL";$("sellTab").classList.add("selected");$("buyTab").classList.remove("selected")};

$("tradeBtn").onclick=()=>{
 const s=$("tradeStock").value,q=Math.floor(Number($("tradeQty").value)),i=STOCKS.findIndex(x=>x[0]===s),price=prices[i];
 if(q<1){$("tradeMessage").textContent="Enter a valid quantity.";return}
 if(!holdings[s])holdings[s]={qty:0,averagePrice:0};const h=holdings[s];
 if(tradeSide==="BUY"){
  const cost=q*price;if(cost>cashBalance){$("tradeMessage").textContent="Insufficient paper-trading cash.";return}
  h.averagePrice=(h.averagePrice*h.qty+cost)/(h.qty+q);h.qty+=q;cashBalance-=cost;
  transactions.push({date:today(),description:"Paper BUY — "+s,credit:0,debit:cost,balance:cashBalance,status:"PAPER"});
 }else{
  if(q>h.qty){$("tradeMessage").textContent="Insufficient paper-trading shares.";return}
  const proceeds=q*price;h.qty-=q;cashBalance+=proceeds;
  transactions.push({date:today(),description:"Paper SELL — "+s,credit:proceeds,debit:0,balance:cashBalance,status:"PAPER"});if(h.qty===0)delete holdings[s];
 }
 $("tradeMessage").textContent="Order completed in paper trading.";renderAll();
};

function renderWithdrawals(){
 let rows=[];
 if(currentUser.pendingWithdrawal>0)rows.push({date:today(),amount:currentUser.pendingWithdrawal,status:"PENDING",reference:"MB-PENDING-"+currentUser.username.toUpperCase()});
 rows=rows.concat(withdrawalHistory);
 $("wdHistory").innerHTML=rows.map(r=>`<tr><td>${r.date}</td><td>${money(r.amount)}</td><td class="amber-text">${r.status}</td><td>${r.reference}</td></tr>`).join("")||"<tr><td colspan='4' class='muted'>No withdrawal records.</td></tr>";
}

$("wdBtn").onclick=()=>{
 const amount=Number($("wdAmount").value);
 if(currentUser.withdrawalLimit<=0){$("wdMsg").textContent="Withdrawal is currently unavailable for this account.";return}
 if(!amount||amount<=0){$("wdMsg").textContent="Enter a valid withdrawal amount.";return}
 if(amount>currentUser.withdrawalLimit){$("wdMsg").textContent="Amount exceeds the configured withdrawal limit.";return}
 withdrawalHistory.push({date:today(),amount,status:"PENDING",reference:"MB-REQ-"+Date.now().toString().slice(-8)});
 $("wdMsg").textContent="Withdrawal request submitted as PENDING.";$("wdAmount").value="";renderWithdrawals();
};

function renderStatement(){
 $("statementClient").textContent=currentUser.username;
 const rows=[{date:today(),description:"Opening paper-trading balance",credit:0,debit:0,balance:currentUser.balance,status:"PAPER"},...transactions];
 $("statementRows").innerHTML=rows.map(r=>`<tr><td>${r.date}</td><td>${r.description}</td><td>${r.credit?money(r.credit):"—"}</td><td>${r.debit?money(r.debit):"—"}</td><td>${money(r.balance)}</td><td>${r.status}</td></tr>`).join("");
}

function submitKYC(){$("kycMessage").innerHTML=`<div class="kyc-success">✓ All documents submitted successfully.<br><span>Your KYC application is now under review.</span></div>`}
function supportMessage(type){$("supportMessage").innerHTML=`<div class="support-success"><strong>${type}</strong><p>Your support request has been opened.</p><span>Please provide the relevant details.</span></div>`}

function showPage(id){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$(id).classList.remove("hidden");document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===id));if(id==="dashboard")setTimeout(drawChart,50)}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll("[data-goto]").forEach(b=>b.onclick=()=>showPage(b.dataset.goto));

function drawChart(){
 const c=$("marketChart");if(!c)return;const r=c.getBoundingClientRect(),d=devicePixelRatio||1,w=r.width,h=270;c.width=w*d;c.height=h*d;
 const ctx=c.getContext("2d");ctx.scale(d,d);ctx.clearRect(0,0,w,h);const pts=Array.from({length:60},(_,i)=>h*.52-Math.sin(i/4)*h*.15-i*.6+(Math.random()-.5)*14);
 ctx.strokeStyle="#31df7b";ctx.lineWidth=2;ctx.beginPath();pts.forEach((y,i)=>{const x=8+i*(w-16)/(pts.length-1);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
}

function renderAll(){renderDashboard();renderPendingPayment();renderMarkets();renderWatchlist();renderPortfolio();renderSnapshot();renderWithdrawals();renderStatement();setupTradeStocks();setTimeout(drawChart,50)}

setInterval(()=>{
 if(!currentUser)return;
 prices=prices.map(p=>p*(1+(Math.random()-.5)*.001));
 STOCKS.forEach(s=>s[3]=Math.max(-5,Math.min(5,s[3]+(Math.random()-.5)*.08)));
 renderAll();
},5000);
window.addEventListener("resize",drawChart);

const saved=sessionStorage.getItem("msn_brock_user");
if(saved){const a=USERS.find(u=>u.username===saved);if(a){currentUser=a;cashBalance=a.balance;$("loginView").classList.add("hidden");$("appView").classList.remove("hidden");$("topUser").textContent="● "+a.username;$("welcome").textContent=a.username;renderAll()}}
