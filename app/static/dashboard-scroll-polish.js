(function () {
"use strict";

// Every display mode shares the same scrollable .pw-overview-content.
// When returning from a tall Widgets layout to Graph/Gauge, preserve the
// user-selected card size but NOT the old scroll offset, which otherwise
// hides the new chart header/first sensor until manually scrolled up.
const cards=document.querySelectorAll(
    "#overview .dashboard > .pw3-cpu-card," +
    "#overview .dashboard > .pw3-gpu-card," +
    "#overview .dashboard > .pw-extra-card"
);
function resetPosition(card) {
    const body=card.querySelector(".pw-overview-content");
    if (!body) return;
    body.scrollTop=0;
    body.scrollLeft=0;
    const region=body.querySelector(".pw-mini-region");
    // Expanded widgets used to have a second independent scroller.
    // When changing the card view, avoid restoring that old offset too.
    if (region) {
        region.scrollTop=0;
        region.scrollLeft=0;
    }
}
if (typeof MutationObserver!=="undefined") {
    const observer=new MutationObserver(records=>{
        for(const record of records) {
            if(record.attributeName!=="data-view") continue;
            resetPosition(record.target);
        }
    });
    for(const card of cards) {
        observer.observe(card,{attributes:true,attributeFilter:["data-view"]});
    }
}
// Initial navigation should show the first row of live readings, while
// ordinary scrolling after startup and sensor updates remains untouched.
window.addEventListener("load",()=>{
    requestAnimationFrame(()=>{
        for(const card of cards) resetPosition(card);
    });
},{once:true});
})();
