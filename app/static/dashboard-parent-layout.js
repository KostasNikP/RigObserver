(function () {
"use strict";

// All six overview cards use the same continuous pixel-based resize
// instead of 2/3/4-column snapping. Resize only the card being dragged.
const KEY = "pulsewatch_overview_parent_sizes_v1";
const MIN_WIDTH = 310;
const MIN_HEIGHT = 230;
const selectors = [
    ["cpu",".pw3-cpu-card"],
    ["gpu",".pw3-gpu-card"],
    ["ram",".pw-ram-card"],
    ["storage",".pw-storage-card"],
    ["network",".pw-network-card"],
    ["motherboard",".pw-motherboard-card"]
];
const clamp=(v,min,max)=>Math.min(Math.max(v,min),Math.max(min,max));
let saved={};
try {
    const data=JSON.parse(localStorage.getItem(KEY)||"{}");
    if(data&&typeof data==="object"&&!Array.isArray(data))saved=data;
} catch(error){console.warn("Parent card sizing preferences unreadable:",error);}
function save(){
    try{localStorage.setItem(KEY,JSON.stringify(saved));}
    catch(error){console.warn("Could not store parent card size:",error);}
}
function availableWidth(card){
    const dashboard=card.closest(".dashboard");
    return dashboard ? dashboard.clientWidth : card.parentElement.clientWidth;
}
function apply(card,group) {
    const size=saved[group];
    if(!size)return;
    if(Number.isFinite(size.width)&&size.width>=MIN_WIDTH){
        card.style.setProperty("--pw-parent-width",
            Math.round(clamp(size.width,MIN_WIDTH,availableWidth(card)))+"px");
    }
    if(Number.isFinite(size.height)&&size.height>=MIN_HEIGHT){
        card.style.height=Math.round(size.height)+"px";
    }
}
for(const [group,selector] of selectors){
    const card=document.querySelector(selector);
    const grip=card?.querySelector('[data-pw-parent-resize="'+group+'"]');
    if(!card||!grip)continue;
    apply(card,group);
    let session=null;
    grip.addEventListener("pointerdown",event=>{
        if(event.button!==0)return;
        if(window.matchMedia("(max-width:700px)").matches)return;
        event.preventDefault();
        event.stopPropagation();
        const rect=card.getBoundingClientRect();
        session={
            id:event.pointerId,startX:event.clientX,startY:event.clientY,
            width:rect.width,height:rect.height
        };
        grip.setPointerCapture(event.pointerId);
        grip.classList.add("is-resizing");
        card.classList.add("pw-parent-is-resizing");
    });
    grip.addEventListener("pointermove",event=>{
        if(!session||event.pointerId!==session.id)return;
        card.style.setProperty("--pw-parent-width",
            Math.round(clamp(session.width+event.clientX-session.startX,
                MIN_WIDTH,availableWidth(card)))+"px");
        // Never conceal readings permanently: an undersized card scrolls
        // internally; free widget sizing and selections are untouched.
        card.style.height=Math.round(Math.max(
            MIN_HEIGHT,session.height+event.clientY-session.startY
        ))+"px";
    });
    function finish(event,commit){
        if(!session||event.pointerId!==session.id)return;
        session=null;
        grip.classList.remove("is-resizing");
        card.classList.remove("pw-parent-is-resizing");
        if(commit){
            saved[group]={
                width:parseFloat(card.style.getPropertyValue("--pw-parent-width")),
                height:parseFloat(card.style.height)
            };
            save();
        }else{
            card.style.removeProperty("--pw-parent-width");
            card.style.removeProperty("height");
            apply(card,group);
        }
        window.dispatchEvent(new Event("resize"));
    }
    grip.addEventListener("pointerup",e=>finish(e,true));
    grip.addEventListener("pointercancel",e=>finish(e,false));
    grip.addEventListener("lostpointercapture",e=>finish(e,false));
}
// Recommended is an explicit user preset, not the initial layout.
// Apply readable two-column card widths on wide windows and stack cards on
// smaller ones. All sizes remain user-resizable and persist normally.
window.addEventListener("pw-apply-recommended-layout",()=>{
    const dashboard=document.querySelector("#overview .dashboard");
    if(!dashboard)return;
    const available=Math.max(MIN_WIDTH,dashboard.clientWidth);
    const half=Math.max(MIN_WIDTH,Math.floor((available-18)/2));
    const wide=available>=1050;
    // Balanced starter pairs, tall enough for essential chart and widget
    // rows. Actual overflow is measured after view switches by the fit event.
    const heights={cpu:510,gpu:540,ram:350,storage:350,
        network:480,motherboard:540};
    saved={};
    for(const [group,selector] of selectors) {
        const card=document.querySelector(selector);
        if(!card)continue;
        const width=wide?half:available;
        saved[group]={width,height:heights[group]};
        card.style.removeProperty("--pw-parent-width");
        card.style.removeProperty("height");
        apply(card,group);
    }
    save();
    window.dispatchEvent(new Event("resize"));
});
// Make Recommended genuinely ready to use: after applying view modes and
// sensor selections, fit each card's actual rendered content. This runs
// ONLY when Recommended is explicitly applied, never on normal manual
// resizing, ordinary updates, sidebar changes or app startup.
window.addEventListener("pw-fit-recommended-cards",()=>{
    let changed=false;
    for(const [group,selector] of selectors) {
        const card=document.querySelector(selector);
        const body=card?.querySelector(".pw-overview-content");
        if(!card || !body || !body.getClientRects().length) continue;
        // Tiny overflow values (subpixel rounding) should not affect layout.
        const overflow=Math.ceil(body.scrollHeight-body.clientHeight);
        if(overflow<=3)continue;
        const current=card.getBoundingClientRect().height;
        if(!Number.isFinite(current) || current<MIN_HEIGHT)continue;
        const height=Math.min(1400,Math.ceil(current+overflow+12));
        if(height<=current || height<MIN_HEIGHT)continue;
        card.style.height=height+"px";
        saved[group]={...saved[group],height};
        changed=true;
    }
    if(changed){
        save();
        window.dispatchEvent(new Event("resize"));
    }
});
window.addEventListener("resize",()=>{
    for(const [group,selector] of selectors){
        const card=document.querySelector(selector);
        if(!card||!saved[group])continue;
        const width=Math.round(clamp(saved[group].width,MIN_WIDTH,availableWidth(card)));
        if(Number.isFinite(width))
            card.style.setProperty("--pw-parent-width",width+"px");
    }
});
})();