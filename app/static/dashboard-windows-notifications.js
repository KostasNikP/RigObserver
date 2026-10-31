(function(){
"use strict";

const KEY="rigobserver_windows_notifications_v1";
const toggle=document.getElementById("pwWindowsNotificationsEnabled");
const test=document.getElementById("pwWindowsNotificationsTest");
const status=document.getElementById("pwWindowsNotificationsStatus");
if(!toggle || !test || !status)return;

let enabled=true;
try {
    enabled=localStorage.getItem(KEY)!=="false";
} catch(error) {
    console.warn("Could not read Windows notification preference:",error);
}
toggle.checked=enabled;

function bridge(){
    const api=window.pywebview?.api;
    return api && typeof api.notify_alert==="function" &&
        typeof api.test_notification==="function" ? api : null;
}

function updateControls(){
    const supported=Boolean(bridge());
    test.disabled=!supported || !enabled;
    if(!supported){
        status.textContent="Available in the RigObserver Windows desktop app.";
    }else if(!enabled){
        status.textContent="Windows notifications are turned off.";
    }else if(!status.dataset.tested){
        status.textContent="Enabled. Use Test notification to verify Windows permissions.";
    }
}
toggle.addEventListener("change",()=>{
    enabled=toggle.checked;
    try { localStorage.setItem(KEY,String(enabled)); }
    catch(error){ console.warn("Could not save notification preference:",error); }
    delete status.dataset.tested;
    updateControls();
});
test.addEventListener("click",async()=>{
    const api=bridge();
    if(!api || !enabled)return;
    test.disabled=true;
    status.textContent="Sending Windows test notification...";
    try{
        const result=await api.test_notification();
        if(result?.ok){
            status.textContent="Test sent. Check Windows notifications.";
        }else{
            status.textContent=result?.error || "Unable to send Windows notification.";
        }
    }catch(error){
        status.textContent="Notification test failed. Check Windows permissions.";
        console.warn("RigObserver test notification failed:",error);
    }finally{
        status.dataset.tested="true";
        updateControls();
    }
});

function notify(items){
    if(!enabled || !items.length)return;
    const api=bridge();
    if(!api)return; // Browser mode has only the in-app alert UI.
    const critical=items.some(item=>
        String(item.level??item.severity??"").toLowerCase()==="critical");
    const first=String(items[0].message||"A configured limit was reached.");
    const message=items.length===1?first:first+
        " (and "+(items.length-1)+" more active alerts)";
    // Exposed Python methods are promises; failures never interrupt charting
    // or the in-app notification workflow.
    Promise.resolve(api.notify_alert(message,critical?"critical":"warning"))
        .then(result=>{
            if(result && !result.ok && result.error!=="Rate limited.")
                console.warn("Windows notification unavailable:",result.error);
        })
        .catch(error=>console.warn("Windows notification error:",error));
}
window.RigObserverNativeNotifications={notify};
document.addEventListener("pywebviewready",updateControls);
updateControls();
})();
