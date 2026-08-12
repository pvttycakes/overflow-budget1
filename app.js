
const STORAGE_KEY = "overflow-budget-v1";
const DAY = 86400000;

const defaultData = {
  version:1,
  balances:{checking:0,savings:0,hysa:0,k401:0,roth:0,creditCard:800},
  paycheck:{amount:1680, cadenceDays:14, nextDate:"2026-08-21"},
  monthlyIncome:{amount:600, day:1},
  paydayTransfers:{roth:100,hysa:100,k401:100},
  minimumBuffer:250,
  bufferGoal:1000,
  bills:[
    {id:"rent",name:"Rent",amount:1250,day:1,autopay:true},
    {id:"phone",name:"Phone",amount:117,day:15,autopay:true},
    {id:"electric",name:"Electric",amount:175,day:10,autopay:true},
    {id:"hulu",name:"Hulu",amount:27,day:27,autopay:true},
    {id:"renters",name:"Renter's insurance",amount:20,day:null,autopay:true},
    {id:"carinsurance",name:"Car insurance",amount:70,day:9,autopay:false},
    {id:"water",name:"Water",amount:50,day:1,autopay:false},
    {id:"internet",name:"Internet",amount:80,day:16,autopay:true}
  ],
  essentials:[
    {id:"groceries",name:"Groceries",amount:500},
    {id:"gas",name:"Gas",amount:100},
    {id:"eating",name:"Eating out",amount:175},
    {id:"household",name:"Household supplies",amount:250},
    {id:"pet",name:"Pet",amount:150}
  ],
  weeklySpent:0,
  oneTimeIncome:[],
  plannedPurchases:[],
  business:{cash:0,inventory:0,showReserve:500,realizedProfit:0},
  settings:{notifications:false}
};

let data = load();
let calendarCursor = new Date(2026,7,1);
let selectedDate = new Date();

function clone(x){return JSON.parse(JSON.stringify(x))}
function load(){try{return {...clone(defaultData),...JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}")}}catch{return clone(defaultData)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));renderAll()}
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n||0))}
function parseDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)}
function iso(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function startOfDay(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function addDays(d,n){let x=new Date(d);x.setDate(x.getDate()+n);return x}
function daysInMonth(y,m){return new Date(y,m+1,0).getDate()}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}

function paydayDates(from,to){
  let d=parseDate(data.paycheck.nextDate);
  while(d<from)d=addDays(d,data.paycheck.cadenceDays);
  const out=[];
  while(d<=to){out.push(new Date(d));d=addDays(d,data.paycheck.cadenceDays)}
  return out;
}
function eventsBetween(from,to){
  const events=[];
  for(const d of paydayDates(from,to)){
    events.push({date:d,type:"income",name:"Paycheck",amount:data.paycheck.amount});
    if(data.paydayTransfers.roth) events.push({date:d,type:"saving",name:"Roth IRA",amount:-data.paydayTransfers.roth});
    if(data.paydayTransfers.hysa) events.push({date:d,type:"saving",name:"HYSA",amount:-data.paydayTransfers.hysa});
  }
  let cursor=new Date(from.getFullYear(),from.getMonth(),1);
  while(cursor<=to){
    const y=cursor.getFullYear(),m=cursor.getMonth();
    const monthlyDate=new Date(y,m,Math.min(data.monthlyIncome.day,daysInMonth(y,m)));
    if(monthlyDate>=from&&monthlyDate<=to)events.push({date:monthlyDate,type:"income",name:"Monthly income",amount:data.monthlyIncome.amount});
    for(const b of data.bills){
      if(!b.day)continue;
      const bd=new Date(y,m,Math.min(b.day,daysInMonth(y,m)));
      if(bd>=from&&bd<=to)events.push({date:bd,type:"bill",name:b.name,amount:-b.amount,autopay:b.autopay});
    }
    cursor=new Date(y,m+1,1);
  }
  for(const x of data.oneTimeIncome){const d=parseDate(x.date);if(d>=from&&d<=to)events.push({date:d,type:"income",name:x.name,amount:x.amount})}
  for(const x of data.plannedPurchases){const d=parseDate(x.date);if(d>=from&&d<=to)events.push({date:d,type:"planned",name:x.name,amount:-x.amount})}
  return events.sort((a,b)=>a.date-b.date || b.amount-a.amount);
}
function nextPayday(){
  const today=startOfDay(new Date());
  let d=parseDate(data.paycheck.nextDate);
  while(d<today)d=addDays(d,data.paycheck.cadenceDays);
  return d;
}
function essentialMonthlyTotal(){return data.essentials.reduce((s,x)=>s+Number(x.amount||0),0)}
function weeklyAllowance(){return essentialMonthlyTotal()*12/52}
function obligationsUntil(date){
  const today=startOfDay(new Date());
  return eventsBetween(today,date).filter(e=>e.amount<0).reduce((s,e)=>s-e.amount,0);
}
function incomingUntil(date){
  const today=startOfDay(new Date());
  return eventsBetween(today,date).filter(e=>e.amount>0).reduce((s,e)=>s+e.amount,0);
}
function projected(date){
  return Number(data.balances.checking||0)+eventsBetween(startOfDay(new Date()),date).reduce((s,e)=>s+e.amount,0);
}
function safeToSpend(){
  const payday=nextPayday();
  const cash=Number(data.balances.checking||0);
  const netScheduled=eventsBetween(startOfDay(new Date()),payday).reduce((s,e)=>s+e.amount,0);
  const weeklyReserve=Math.max(0,weeklyAllowance()-Number(data.weeklySpent||0));
  return Math.max(0,cash+netScheduled-data.minimumBuffer-weeklyReserve);
}
function overflow(){
  const thirty=addDays(startOfDay(new Date()),30);
  return Math.max(0,projected(thirty)-data.minimumBuffer-essentialMonthlyTotal());
}
function eventHTML(e){
  return `<div class="event"><i class="mark ${e.type}"></i><div><strong>${e.name}</strong><span class="meta">${e.date.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}${e.autopay===false?" • manual":e.autopay===true?" • autopay":""}</span></div><div class="amount">${e.amount>=0?"+":""}${money(e.amount)}</div></div>`
}

function renderHome(){
  const np=nextPayday(), safe=safeToSpend();
  document.querySelector("#safeToSpend").textContent=money(safe);
  document.querySelector("#safeSub").textContent=`until ${np.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}`;
  document.querySelector("#checkingNow").textContent=money(data.balances.checking);
  document.querySelector("#overflowNow").textContent=money(overflow());
  document.querySelector("#nextPayday").textContent=`${money(data.paycheck.amount)} • ${np.toLocaleDateString("en-US",{month:"short",day:"numeric"})}`;
  document.querySelector("#projectedBalance").textContent=money(projected(addDays(startOfDay(new Date()),30)));
  const upcoming=eventsBetween(startOfDay(new Date()),addDays(startOfDay(new Date()),35)).slice(0,8);
  document.querySelector("#upcomingList").innerHTML=upcoming.length?upcoming.map(eventHTML).join(""):`<div class="muted small">No scheduled items.</div>`;
  const wa=weeklyAllowance(), spent=Number(data.weeklySpent||0), rem=Math.max(0,wa-spent);
  document.querySelector("#weeklyRemaining").textContent=`${money(rem)} left`;
  document.querySelector("#weeklyDetail").textContent=`${money(spent)} of ${money(wa)} used`;
  document.querySelector("#weeklyBar").style.width=`${Math.min(100,spent/wa*100)}%`;
  const current=Number(data.minimumBuffer||0), goal=Number(data.bufferGoal||1000);
  document.querySelector("#bufferCurrent").textContent=money(current);
  document.querySelector("#bufferBar").style.width=`${Math.min(100,current/goal*100)}%`;
  const months=Math.max(1,Math.ceil((new Date(2027,0,1)-new Date())/(30.44*DAY)));
  const perMonth=Math.max(0,(goal-current)/months);
  document.querySelector("#bufferAdvice").textContent=`To reach ${money(goal)} by the new year, build your protected checking floor by about ${money(perMonth)} per month.`;
}
function renderCalendar(){
  const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth();
  document.querySelector("#monthTitle").textContent=calendarCursor.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const first=new Date(y,m,1), offset=first.getDay();
  const start=new Date(y,m,1-offset);
  const end=addDays(start,41), ev=eventsBetween(start,end);
  const cells=[];
  for(let i=0;i<42;i++){
    const d=addDays(start,i), dayEv=ev.filter(e=>sameDay(e.date,d));
    cells.push(`<button class="day ${d.getMonth()!==m?"other":""} ${sameDay(d,new Date())?"today":""} ${sameDay(d,selectedDate)?"selected":""}" data-date="${iso(d)}"><span class="day-num">${d.getDate()}</span><span class="day-dots">${dayEv.slice(0,5).map(e=>`<i class="${e.type}"></i>`).join("")}</span></button>`);
  }
  document.querySelector("#calendarGrid").innerHTML=cells.join("");
  document.querySelectorAll(".day").forEach(b=>b.onclick=()=>{selectedDate=parseDate(b.dataset.date);renderCalendar()});
  document.querySelector("#selectedDateLabel").textContent=selectedDate.toLocaleDateString("en-US",{month:"short",day:"numeric"});
  const dayEv=eventsBetween(startOfDay(selectedDate),startOfDay(selectedDate)).filter(e=>sameDay(e.date,selectedDate));
  document.querySelector("#selectedDayEvents").innerHTML=dayEv.length?dayEv.map(eventHTML).join(""):`<div class="muted small">Nothing scheduled for this day.</div>`;
}
function renderMoney(){
  const accounts=[
    ["Checking",data.balances.checking],["Savings",data.balances.savings],["HYSA",data.balances.hysa],
    ["401(k)",data.balances.k401],["Roth IRA",data.balances.roth],["Credit card", -data.balances.creditCard]
  ];
  document.querySelector("#accountCards").innerHTML=accounts.map(([n,v])=>`<div class="account-card"><span>${n}</span><strong>${money(v)}</strong></div>`).join("");
  document.querySelector("#ccBalance").textContent=money(data.balances.creditCard);
}
function renderBusiness(){
  const b=data.business;
  const bp=Math.max(0,Number(b.cash||0)-Number(b.showReserve||0));
  document.querySelector("#buyingPower").textContent=money(bp);
  document.querySelector("#businessCards").innerHTML=[
    ["Business cash",b.cash],["Inventory value",b.inventory],["Show reserve",b.showReserve],["Realized profit",b.realizedProfit]
  ].map(([n,v])=>`<div class="account-card"><span>${n}</span><strong>${money(v)}</strong></div>`).join("");
}
function renderMore(){
  document.querySelector("#billList").innerHTML=data.bills.map((b,i)=>`<div class="setting-row"><div><strong>${b.name}</strong><div class="meta">${money(b.amount)} • ${b.day?ordinal(b.day):"date needed"} • ${b.autopay?"autopay":"manual"}</div></div><button onclick="editBill(${i})">Edit</button></div>`).join("");
  document.querySelector("#essentialList").innerHTML=data.essentials.map(x=>`<div class="setting-row"><div><strong>${x.name}</strong><div class="meta">${money(x.amount)} / month</div></div></div>`).join("");
  document.querySelector("#incomeList").innerHTML=data.oneTimeIncome.length?data.oneTimeIncome.map(x=>`<div class="setting-row"><div><strong>${x.name}</strong><div class="meta">${money(x.amount)} • ${x.date}</div></div></div>`).join(""):`<div class="muted small">No one-time income entered yet.</div>`;
}
function ordinal(n){const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0])}
function renderAll(){renderHome();renderCalendar();renderMoney();renderBusiness();renderMore()}
function showModal(html){document.querySelector("#modalContent").innerHTML=html;document.querySelector("#modal").showModal()}
function modalActions(saveText="Save"){return `<div class="modal-actions"><button value="cancel" class="secondary">Cancel</button><button id="modalSave" value="default" class="primary">${saveText}</button></div>`}

document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",()=>{
  const id=b.dataset.nav;document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===id));document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.nav===id));window.scrollTo(0,0)
}));
document.querySelector("#affordBtn").onclick=()=>{
  const amt=Number(document.querySelector("#purchaseAmount").value||0),safe=safeToSpend(), el=document.querySelector("#affordResult");
  if(!amt){el.className="decision muted";el.textContent="Enter a purchase amount first.";return}
  if(amt<=safe){el.className="decision good";el.innerHTML=`✓ Yes. This fits inside your safe-to-spend amount and leaves about <strong>${money(safe-amt)}</strong> of safe spending until payday.`}
  else{el.className="decision warn";el.innerHTML=`⚠ Wait. This is <strong>${money(amt-safe)}</strong> above your current safe-to-spend amount. Your ${money(data.minimumBuffer)} protected checking floor stays intact if you wait.`}
};
document.querySelector("#addWeeklySpend").onclick=()=>{
  showModal(`<div class="modal-stack"><h2>Add weekly spending</h2><label>Amount<input id="mSpend" class="modal-input" inputmode="decimal"></label><label>Note<input id="mNote" class="modal-input" placeholder="Groceries, gas, dinner..."></label></div>${modalActions("Add")}`);
  document.querySelector("#modalSave").onclick=()=>{data.weeklySpent+=Number(document.querySelector("#mSpend").value||0);save()}
};
document.querySelector("#editBalances").onclick=()=>{
  showModal(`<div class="modal-stack"><h2>Update balances</h2>${Object.entries({checking:"Checking",savings:"Savings",hysa:"HYSA",k401:"401(k)",roth:"Roth IRA",creditCard:"Credit card balance"}).map(([k,l])=>`<label>${l}<input id="bal_${k}" class="modal-input" inputmode="decimal" value="${data.balances[k]}"></label>`).join("")}</div>${modalActions()}`);
  document.querySelector("#modalSave").onclick=()=>{Object.keys(data.balances).forEach(k=>data.balances[k]=Number(document.querySelector("#bal_"+k).value||0));save()}
};
document.querySelector("#payDebt").onclick=()=>{const p=Math.max(0,Number(document.querySelector("#debtPayment").value||0));data.balances.creditCard=Math.max(0,data.balances.creditCard-p);data.balances.checking=Math.max(0,data.balances.checking-p);save()};
document.querySelector("#editBusiness").onclick=()=>{
  showModal(`<div class="modal-stack"><h2>Eclipse balances</h2><label>Business cash<input id="b_cash" class="modal-input" inputmode="decimal" value="${data.business.cash}"></label><label>Inventory market value<input id="b_inventory" class="modal-input" inputmode="decimal" value="${data.business.inventory}"></label><label>Protected show reserve<input id="b_showReserve" class="modal-input" inputmode="decimal" value="${data.business.showReserve}"></label></div>${modalActions()}`);
  document.querySelector("#modalSave").onclick=()=>{["cash","inventory","showReserve"].forEach(k=>data.business[k]=Number(document.querySelector("#b_"+k).value||0));save()}
};
document.querySelector("#recordSale").onclick=()=>{const s=Number(document.querySelector("#salePrice").value||0),c=Number(document.querySelector("#saleCost").value||0);if(!s)return;data.business.cash+=s;data.business.inventory=Math.max(0,data.business.inventory-c);data.business.realizedProfit+=s-c;document.querySelector("#saleResult").textContent=`Recorded ${money(s-c)} realized profit.`;save()};
document.querySelector("#prevMonth").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()};
document.querySelector("#nextMonth").onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()};
document.querySelector("#addIncomeBtn").onclick=()=>{
  showModal(`<div class="modal-stack"><h2>Add one-time income</h2><label>Name<input id="iName" class="modal-input" placeholder="Card sale, bonus..."></label><label>Amount<input id="iAmount" class="modal-input" inputmode="decimal"></label><label>Date<input id="iDate" class="modal-input" type="date" value="${iso(new Date())}"></label></div>${modalActions("Add")}`);
  document.querySelector("#modalSave").onclick=()=>{data.oneTimeIncome.push({name:document.querySelector("#iName").value||"One-time income",amount:Number(document.querySelector("#iAmount").value||0),date:document.querySelector("#iDate").value});save()}
};
document.querySelector("#addBillBtn").onclick=()=>editBill(-1);
window.editBill=(i)=>{
  const b=i>=0?data.bills[i]:{name:"",amount:0,day:1,autopay:true};
  showModal(`<div class="modal-stack"><h2>${i>=0?"Edit":"Add"} bill</h2><label>Name<input id="billName" class="modal-input" value="${b.name}"></label><label>Amount<input id="billAmount" class="modal-input" inputmode="decimal" value="${b.amount}"></label><label>Due day<input id="billDay" class="modal-input" inputmode="numeric" value="${b.day||""}" placeholder="1-31"></label><label><input id="billAuto" type="checkbox" ${b.autopay?"checked":""}> Autopay</label></div>${modalActions()}`);
  document.querySelector("#modalSave").onclick=()=>{const nb={id:b.id||Date.now().toString(),name:document.querySelector("#billName").value,amount:Number(document.querySelector("#billAmount").value||0),day:Number(document.querySelector("#billDay").value)||null,autopay:document.querySelector("#billAuto").checked};if(i>=0)data.bills[i]=nb;else data.bills.push(nb);save()}
};
document.querySelector("#notifyBtn").onclick=async()=>{
  if(!("Notification" in window)){alert("Notifications are not supported in this browser.");return}
  const p=await Notification.requestPermission();data.settings.notifications=p==="granted";save();alert(p==="granted"?"Notifications enabled.":"Notification permission was not granted.")
};
document.querySelector("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="overflow-budget-backup.json";a.click();URL.revokeObjectURL(a.href)
};
document.querySelector("#resetBtn").onclick=()=>{if(confirm("Reset all app data to your starting budget plan?")){data=clone(defaultData);save()}};
document.querySelector("#settingsBtn").onclick=()=>document.querySelector('[data-nav="more"]').click();

if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
renderAll();
