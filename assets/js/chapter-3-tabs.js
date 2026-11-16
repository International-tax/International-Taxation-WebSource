(() => {
  const tabs = [...document.querySelectorAll('.lesson-tabs [role="tab"]')];
  const languageSwitch = document.querySelector(".language-switch");

  function selectTab(selected, focus = false) {
    tabs.forEach((tab) => {
      const active = tab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !active;
    });
    languageSwitch.hash = selected.getAttribute("aria-controls");
    if (focus) selected.focus();
  }

  function activateTab(tab) {
    selectTab(tab, true);
    history.replaceState(null, "", `#${tab.getAttribute("aria-controls")}`);
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTab(tabs[next]);
    });
  });

  function selectFromLocation() {
    const selected = tabs.find((tab) => `#${tab.getAttribute("aria-controls")}` === location.hash);
    selectTab(selected ?? tabs[0]);
  }

  window.addEventListener("hashchange", selectFromLocation);
  selectFromLocation();
})();
