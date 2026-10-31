(function () {
"use strict";

// Auto sensors use a stable number of grid columns based on parent width,
// independent of any saved smaller widget widths. Individual manually
// resized widgets can still span cells; Free mode is never modified.
const configs=[
    [".pw3-cpu-card","#pwCpuMiniWidgets"],
    [".pw3-gpu-card","#pwGpuMiniWidgets"],
    [".pw-ram-card","#pwRamMiniWidgets"],
    [".pw-storage-card","#pwStorageMiniWidgets"],
    [".pw-network-card","#pwNetworkMiniWidgets"],
    [".pw-motherboard-card","#pwMotherboardMiniWidgets"]
];
const entries=configs.map(([cardSelector,regionSelector])=>({
    card:document.querySelector(cardSelector),
    region:document.querySelector(regionSelector)
})).filter(entry=>entry.card&&entry.region);
const GAP=12;
const COMFORTABLE=275;
const PROPERTY="--pw-auto-column-count";
let pending=0;

function chooseColumns(count,width) {
    const maximum=Math.max(1,Math.floor((width+GAP)/(COMFORTABLE+GAP)));
    let columns=Math.min(Math.max(1,count),maximum);
    // Avoid a single dangling widget (e.g. 4 widgets laid out 3 + 1).
    if(columns>2 && count===columns+1) columns--;
    return columns;
}
function clear(entry) {
    const {region}=entry;
    region.style.removeProperty(PROPERTY);
    for(const widget of region.querySelectorAll(":scope > .pw-mini-widget")) {
        widget.style.removeProperty("grid-column");
    }
}
function update(entry) {
    const {card,region}=entry;
    if(card.dataset.view!=="widgets" || region.classList.contains("pw-mini-free")) {
        clear(entry);
        return;
    }
    const widgets=[...region.querySelectorAll(":scope > .pw-mini-widget")];
    const width=region.clientWidth;
    if(!widgets.length || width<1) {
        clear(entry);
        return;
    }
    const columns=chooseColumns(widgets.length,width);
    const current=parseFloat(region.style.getPropertyValue(PROPERTY));
    if(current!==columns) region.style.setProperty(PROPERTY,String(columns));
    const cellWidth=(width-GAP*(columns-1))/columns;
    for(const widget of widgets) {
        const manual=widget.classList.contains("pw-mini-manual-width");
        const savedWidth=parseFloat(widget.style.width);
        const requiredSpan=manual && Number.isFinite(savedWidth)
            ? Math.min(columns,Math.max(1,Math.ceil(
                (savedWidth+GAP-1)/(cellWidth+GAP)
            )))
            : 1;
        const span=requiredSpan>1?"span "+requiredSpan:"";
        if(widget.style.gridColumn!==span) {
            if(span)widget.style.gridColumn=span;
            else widget.style.removeProperty("grid-column");
        }
    }
}
function flush() {
    pending=0;
    for(const entry of entries)update(entry);
}
function schedule() {
    if(!pending)pending=requestAnimationFrame(flush);
}
if(typeof ResizeObserver!=="undefined") {
    const widths=new WeakMap();
    const observer=new ResizeObserver(entries=>{
        for(const {target,contentRect} of entries) {
            const width=contentRect.width;
            if(Math.abs(width-(widths.get(target)??-1))<1)continue;
            widths.set(target,width);
            schedule();
        }
    });
    for(const entry of entries)observer.observe(entry.region);
}
if(typeof MutationObserver!=="undefined") {
    for(const entry of entries) {
        new MutationObserver(schedule).observe(entry.region,{
            childList:true,attributes:true,attributeFilter:["class"]
        });
        new MutationObserver(schedule).observe(entry.card,{
            attributes:true,attributeFilter:["data-view"]
        });
    }
}
window.addEventListener("resize",schedule);
window.addEventListener("pw-mini-widget-resizing",schedule);
window.addEventListener("pw-mini-widget-resized",schedule);
window.addEventListener("pw-overview-card-order-changed",schedule);
schedule();
})();
