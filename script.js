const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".desktop-nav");
if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
  }));
}
const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

/* Interactive technology stack */
const stackRoot = document.querySelector(".stack-interactive");
if (stackRoot) {
  const stackCards = Array.from(stackRoot.querySelectorAll(".tech-card"));
  const stackFilters = Array.from(stackRoot.querySelectorAll(".stack-filter"));
  const stackGroups = Array.from(stackRoot.querySelectorAll("[data-stack-group]"));
  const detailIcon = stackRoot.querySelector("#stack-detail-icon");
  const detailName = stackRoot.querySelector("#stack-detail-name");
  const detailDescription = stackRoot.querySelector("#stack-detail-description");
  const detailLink = stackRoot.querySelector("#stack-detail-link");

  const selectStackCard = (card) => {
    if (!card) return;
    stackCards.forEach((item) => {
      const selected = item === card;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });
    if (detailIcon) {
      detailIcon.src = card.dataset.logo || "";
      detailIcon.alt = `${card.dataset.name || "Technology"} logo`;
    }
    if (detailName) detailName.textContent = card.dataset.name || "Technology";
    if (detailDescription) detailDescription.textContent = card.dataset.description || "";
    if (detailLink) {
      detailLink.href = card.dataset.doc || "#";
      detailLink.setAttribute("aria-label", `Open official ${card.dataset.name || "technology"} documentation in a new tab`);
    }
  };

  const filterStack = (filter) => {
    stackFilters.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    stackCards.forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
    stackGroups.forEach((group) => {
      group.hidden = !Array.from(group.querySelectorAll(".tech-card")).some((card) => !card.hidden);
    });
    const selectedVisible = stackCards.find((card) => card.classList.contains("is-selected") && !card.hidden);
    if (!selectedVisible) selectStackCard(stackCards.find((card) => !card.hidden));
  };

  stackFilters.forEach((button) => {
    button.addEventListener("click", () => filterStack(button.dataset.filter || "all"));
  });
  stackCards.forEach((card) => {
    card.addEventListener("click", () => selectStackCard(card));
  });
  selectStackCard(stackCards.find((card) => card.classList.contains("is-selected")) || stackCards[0]);
  filterStack("all");
}
