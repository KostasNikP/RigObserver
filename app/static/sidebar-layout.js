(function(){
"use strict";
const KEY="pulsewatch_sidebar_collapsed_v1";
const root=document.querySelector(".app-layout");
const toggle=document.getElementById("pwSidebarToggle");
const brand=root?.querySelector(".brand");
const navLinks=[...document.querySelectorAll(".sidebar-nav .nav-item")];
let collapsed=false;
try{collapsed=localStorage.getItem(KEY)==="true";}
catch(error){console.warn("Sidebar state unavailable:",error);}
function update(){
    root.classList.toggle("pw-sidebar-collapsed",collapsed);
    // Keep the vector button in place while reflecting the saved state.
    toggle.dataset.collapsed=String(collapsed);
    toggle.setAttribute("aria-label",collapsed?"Expand sidebar":"Collapse sidebar");
    toggle.title=collapsed?"Expand sidebar":"Collapse sidebar";
    toggle.setAttribute("aria-expanded",String(!collapsed));
    // In icon-only mode, a native title reveals each destination without
    // being clipped by the scrollable sidebar. Screen readers retain names
    // regardless of whether the visual labels are hidden.
    for(const link of navLinks) {
        const label=link.querySelector(".pw-nav-label")?.textContent.trim();
        if(!label)continue;
        link.setAttribute("aria-label",label);
        if(collapsed)link.title=label;
        else link.removeAttribute("title");
    }
    if(brand) {
        brand.setAttribute("aria-label","RigObserver — Overview");
        if(collapsed)brand.title="RigObserver — Overview";
        else brand.removeAttribute("title");
    }
    // Allow responsive charts to measure the new content width.
    window.dispatchEvent(new Event("resize"));
}
toggle.addEventListener("click",()=>{
    collapsed=!collapsed;
    try{localStorage.setItem(KEY,String(collapsed));}
    catch(error){console.warn("Could not save sidebar state:",error);}
    update();
});
update();
})();