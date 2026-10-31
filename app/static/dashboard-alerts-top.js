(function(){
"use strict";

// Always-visible summary beside connection status, with detail popover.
// The backend's existing alert list remains the single source of truth.
const root=document.getElementById("pwTopAlerts");
const toggle=document.getElementById("pwTopAlertsToggle");
const badge=document.getElementById("pwTopAlertsCount");
const panel=document.getElementById("pwTopAlertsPanel");
const summary=document.getElementById("pwTopAlertsSummary");
const list=document.getElementById("pwTopAlertsList");
const close=document.getElementById("pwTopAlertsClose");
const toast=document.getElementById("pwAlertToast");
const toastTitle=document.getElementById("pwAlertToastTitle");
const toastMessage=document.getElementById("pwAlertToastMessage");
const toastView=document.getElementById("pwAlertToastView");
const toastClose=document.getElementById("pwAlertToastClose");
if(![root,toggle,badge,panel,summary,list,close,toast,toastTitle,
    toastMessage,toastView,toastClose].every(Boolean))return;

let priorKeys=new Set();
let hasReceivedAlerts=false;
let toastTimeout=null;
let latestAlerts=null;
let lastListSignature=null;

const alertKey=(alert)=>[
    String(alert.id??alert.metric??alert.message??"unknown"),
    String(alert.threshold??""),
    String(alert.level??alert.severity??"")
].join("|");
const isCritical=(alert)=>
    String(alert.level??alert.severity??"").toLowerCase()==="critical";

function dismissToast() {
    if(toastTimeout!==null)clearTimeout(toastTimeout);
    toastTimeout=null;
    toast.hidden=true;
}
function openPanel() {
    panel.hidden=false;
    toggle.setAttribute("aria-expanded","true");
    if(latestAlerts!==null)renderList(latestAlerts);
}
function closePanel() {
    panel.hidden=true;
    toggle.setAttribute("aria-expanded","false");
}
function makeAlertRow(alert) {
    const row=document.createElement("div");
    row.className="pw-top-alert-row";
    row.setAttribute("role","listitem");
    if(isCritical(alert))row.classList.add("critical");
    const label=document.createElement("strong");
    label.textContent=String(alert.message||"System threshold exceeded");
    const detail=document.createElement("span");
    const current=Number(alert.value);
    const threshold=Number(alert.threshold);
    const now=Number.isFinite(current)?current+"%":"—";
    const limit=Number.isFinite(threshold)?threshold+"%":"—";
    detail.textContent="Current "+now+" · Limit "+limit;
    row.append(label,detail);
    return row;
}
function renderList(alerts) {
    // Most 3-second polls have the same alert content. Avoid destroying
    // the entire list (and its keyboard focus) unless visible data changes.
    const signature=JSON.stringify(alerts.map(alert=>[
        alertKey(alert),alert.message,alert.value
    ]));
    if(signature===lastListSignature)return;
    lastListSignature=signature;
    // Keep the user's position when alerts refresh while the popover is open.
    const previousScroll=list.scrollTop;
    list.replaceChildren();
    if(!alerts.length) {
        const ok=document.createElement("div");
        ok.className="pw-top-alerts-ok";
        const icon=document.createElement("span");
        icon.textContent="✓";
        icon.setAttribute("aria-hidden","true");
        const text=document.createElement("div");
        const title=document.createElement("strong");
        title.textContent="All systems within limits";
        const detail=document.createElement("span");
        detail.textContent="No active threshold warnings.";
        text.append(title,detail);
        ok.append(icon,text);
        list.append(ok);
        list.scrollTop=previousScroll;
        return;
    }
    // Panel is scrollable; show every active alert, not a hidden subset.
    for(const alert of alerts)list.append(makeAlertRow(alert));
    list.scrollTop=previousScroll;
}
function notifyNewAlert(items) {
    if(!items.length)return;
    toast.dataset.state=items.some(isCritical)?"critical":"warning";
    toastTitle.textContent=items.length===1
        ?"New system alert":items.length+" new system alerts";
    toastMessage.textContent=items.length===1
        ?String(items[0].message||"A configured limit was reached.")
        :String(items[0].message||"A configured limit was reached.")+
            " and "+(items.length-1)+" more";
    dismissToast();
    toast.hidden=false;
    // No constant repeated popup during live polling.
    toastTimeout=setTimeout(dismissToast,9000);
}
function update(alerts) {
    if(!Array.isArray(alerts))return;
    latestAlerts=alerts;
    const count=alerts.length;
    const critical=alerts.some(isCritical);
    root.dataset.state=count?(critical?"critical":"warning"):"healthy";
    badge.textContent=String(count);
    summary.textContent=count
        ?count===1?"1 active warning":count+" active warnings"
        :"All systems within limits";
    toggle.setAttribute("aria-label",count
        ?count+" active system "+(count===1?"alert":"alerts")+", open details"
        :"System alerts, no active warnings");
    // Nothing in the hidden popover needs DOM work while it is closed.
    if(!panel.hidden)renderList(alerts);

    const newKeys=new Set(alerts.map(alertKey));
    const additions=alerts.filter(alert=>!priorKeys.has(alertKey(alert)));
    priorKeys=newKeys;
    // Native notifications are only sent for newly triggered alerts, not
    // pre-existing warnings reloaded when the desktop app starts.
    if(hasReceivedAlerts && additions.length)
        window.RigObserverNativeNotifications?.notify(additions);
    hasReceivedAlerts=true;
    if(additions.length)notifyNewAlert(additions);
    if(!count)dismissToast();
}

toggle.addEventListener("click",()=>panel.hidden?openPanel():closePanel());
close.addEventListener("click",()=>{
    closePanel();toggle.focus();
});
toastView.addEventListener("click",()=>{dismissToast();openPanel();});
toastClose.addEventListener("click",dismissToast);
panel.querySelectorAll("a").forEach(link=>{
    link.addEventListener("click",closePanel);
});
document.addEventListener("pointerdown",event=>{
    if(!panel.hidden&&!root.contains(event.target))closePanel();
});
document.addEventListener("keydown",event=>{
    if(event.key==="Escape"&&!panel.hidden){
        closePanel();toggle.focus();
    }
});

// The main dashboard can send each new metrics alert snapshot here.
window.RigObserverTopAlerts={update};
})();
