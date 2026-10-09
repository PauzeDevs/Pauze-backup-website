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

/* Live Discord presence via Lanyard; gracefully handles unavailable API/opt-in */
const discordPresence = (() => {
  const userId = "1547264515182432398";
  const statusLabel = document.querySelector("#discord-status-label");
  const statusDot = document.querySelector("#discord-status-dot");
  const avatarStatus = document.querySelector("#discord-avatar-status");
  const displayName = document.querySelector("#discord-display-name");
  const activityText = document.querySelector("#discord-activity-text");
  const currentActivity = document.querySelector("#discord-current-activity");
  const avatar = document.querySelector("#discord-avatar");
  const note = document.querySelector("#discord-status-note");
  if (!statusLabel || !statusDot || !displayName || !activityText || !currentActivity) return;
  const statusNames = { online: "ONLINE", idle: "IDLE", dnd: "DO NOT DISTURB", offline: "OFFLINE" };
  const setUnavailable = (message) => {
    statusLabel.textContent = "STATUS UNAVAILABLE";
    statusDot.dataset.status = "offline";
    if (avatarStatus) avatarStatus.dataset.status = "offline";
    activityText.textContent = "Live status isn't available right now.";
    currentActivity.textContent = "Discord presence could not be loaded.";
    if (note) note.textContent = message || "Live status needs the user to be available through Lanyard. The profile link still works.";
  };
  const loadPresence = async () => {
    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error("Presence service unavailable");
      const payload = await response.json();
      if (!payload.success || !payload.data) throw new Error("No public presence data");
      const data = payload.data;
      const status = data.discord_status || "offline";
      statusLabel.textContent = statusNames[status] || "UNKNOWN";
      statusDot.dataset.status = status;
      if (avatarStatus) avatarStatus.dataset.status = status;
      const user = data.discord_user || {};
      displayName.textContent = user.global_name || user.display_name || user.username || "Pauze";
      activityText.textContent = status === "offline" ? "Currently offline" : status === "dnd" ? "Busy on Discord" : status === "idle" ? "Away on Discord" : "Active on Discord";
      if (avatar && user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_") ? "gif" : "png";
        avatar.src = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
      }
      const activity = Array.isArray(data.activities) ? data.activities.find((item) => item.type !== 4) : null;
      if (activity) {
        const details = [activity.name, activity.details, activity.state].filter(Boolean);
        currentActivity.textContent = details.join(" — ") || "Activity detected";
      } else if (status === "offline") {
        currentActivity.textContent = "No current activity";
      } else {
        currentActivity.textContent = "Online — no activity shared";
      }
      if (note) note.textContent = "Status is provided by Lanyard and updates when Discord presence is available.";
    } catch (error) {
      setUnavailable("For live status, join the Lanyard Discord community and enable presence sharing for this account. The profile link remains available.");
    }
  };
  loadPresence();
  window.setInterval(loadPresence, 60000);
  return { refresh: loadPresence };
})();
