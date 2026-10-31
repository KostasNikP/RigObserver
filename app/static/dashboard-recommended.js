(function () {
"use strict";

// Explicit, hardware-aware one-click starter layout. The confirmation is
// intentional: applying a preset replaces existing card sizes and visible
// sensor choices, but leaves the separately saved Free positions alone.
const button=document.getElementById("pwRecommendedLayout");
if(!button)return;
const dialog=document.createElement("dialog");
dialog.className="pw-preset-dialog";
dialog.setAttribute("aria-labelledby","pwPresetTitle");
dialog.setAttribute("aria-describedby","pwPresetDescription");
dialog.innerHTML=
    '<div class="pw-preset-icon" aria-hidden="true">✦</div>'+
    '<h2 id="pwPresetTitle">Use the recommended dashboard?</h2>'+
    '<p id="pwPresetDescription">Start with essential CPU, GPU, memory, disk, '+
        'network and motherboard readings in a balanced layout. This replaces '+
        'your current card sizes, order and selected sensor widgets.</p>'+
    '<div class="pw-preset-preview" aria-label="Recommended views">'+
        '<span><strong>CPU</strong> · Graph</span>'+
        '<span><strong>GPU</strong> · Widgets</span>'+
        '<span><strong>RAM / Storage</strong> · Widgets</span>'+
        '<span><strong>Network</strong> · Graph</span>'+
        '<span><strong>Motherboard</strong> · Widgets</span>'+
    '</div>'+
    '<p class="pw-preset-note">Your hardware data and saved Free-position '+
        'coordinates are not deleted. You can customize the layout again at any time.</p>'+
    '<div class="pw-preset-actions">'+
        '<button type="button" data-preset-cancel>Cancel</button>'+
        '<button type="button" class="pw-preset-confirm" data-preset-confirm>Apply recommended</button>'+
    '</div>';
document.body.append(dialog);
const cancel=dialog.querySelector("[data-preset-cancel]");
const apply=dialog.querySelector("[data-preset-confirm]");
button.addEventListener("click",()=>{
    if(!dialog.open)dialog.showModal();
});
cancel.addEventListener("click",()=>dialog.close());

function setView(cardSelector,buttonSelector) {
    const card=document.querySelector(cardSelector);
    const control=card?.querySelector(buttonSelector);
    if(control) control.click(); // Existing handlers persist mode and UI state.
}
apply.addEventListener("click",()=>{
    if(!window.PulseWatchWidgets ||
        typeof window.PulseWatchWidgets.applyRecommendedSensors!=="function") {
        dialog.close();
        return;
    }
    try {
        window.PulseWatchWidgets.applyRecommendedSensors();
        window.dispatchEvent(new Event("pw-apply-recommended-layout"));
        setView(".pw3-cpu-card",'[data-view="graph"]');
        setView(".pw3-gpu-card",'[data-gpu-view="widgets"]');
        for(const [group,mode] of [
            ["ram","widgets"],["storage","widgets"],
            ["network","graph"],["motherboard","widgets"]
        ]) {
            setView(".pw-"+group+"-card",
                '[data-pw-extra-view="'+mode+'"]');
        }
        dialog.close();
        const hint=document.getElementById("pwParentLayoutHint");
        if(hint)hint.textContent="Recommended setup applied. Customize any card whenever you like.";
        window.dispatchEvent(new Event("resize"));
        // Grid columns, custom widgets and graphs need a layout frame to
        // settle before checking whether any card still scrolls internally.
        // Run two bounded passes, never an ongoing resize loop.
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
            window.dispatchEvent(new Event("pw-fit-recommended-cards"));
            requestAnimationFrame(()=>{
                window.dispatchEvent(new Event("pw-fit-recommended-cards"));
            });
        }));
    } catch(error) {
        console.error("Unable to apply recommended dashboard:",error);
        dialog.close();
    }
});
})();
