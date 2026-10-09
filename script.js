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
  const musicCard = document.querySelector("#discord-music-card");
  const musicArt = document.querySelector("#discord-music-art");
  const musicTitle = document.querySelector("#discord-music-title");
  const musicArtist = document.querySelector("#discord-music-artist");
  const musicAlbum = document.querySelector("#discord-music-album");
  const musicHeading = document.querySelector("#discord-music-heading");
  const musicProgress = document.querySelector("#discord-music-progress");
  const musicElapsed = document.querySelector("#discord-music-elapsed");
  const musicDuration = document.querySelector("#discord-music-duration");
  let spotifyTrack = null;
  let externalTrack = false;
  const formatTrackTime = (milliseconds) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const updateMusicProgress = () => {
    if (!spotifyTrack || !musicProgress || externalTrack) return;
    const now = Date.now();
    const start = Number(spotifyTrack.timestamps?.start || now);
    const end = Number(spotifyTrack.timestamps?.end || now);
    const duration = Math.max(0, end - start);
    const elapsed = Math.max(0, Math.min(duration, now - start));
    musicProgress.style.width = `${duration ? (elapsed / duration) * 100 : 0}%`;
    if (musicElapsed) musicElapsed.textContent = formatTrackTime(elapsed);
    if (musicDuration) musicDuration.textContent = formatTrackTime(duration);
  };
  const renderSpotify = (spotify) => {
    if (!musicCard) return;
    if (!spotify || !spotify.song) {
      spotifyTrack = null;
      return;
    }
    externalTrack = false;
    spotifyTrack = spotify;
    musicCard.hidden = false;
    if (musicTitle) musicTitle.textContent = spotify.song || "Unknown track";
    if (musicArtist) musicArtist.textContent = spotify.artist || "Unknown artist";
    if (musicAlbum) musicAlbum.textContent = spotify.album || "Spotify";
    if (musicHeading) musicHeading.textContent = "Listening to Spotify";
    if (musicArt) musicArt.style.visibility = "visible";
    if (musicArt && spotify.album_art_url) musicArt.src = spotify.album_art_url;
    if (musicArt) musicArt.alt = `Album artwork for ${spotify.song}`;
    updateMusicProgress();
  };
  if (musicArt) musicArt.addEventListener("error", () => {
    musicArt.src = "https://cdn.discordapp.com/embed/avatars/0.png";
    musicArt.style.visibility = "visible";
    musicArt.alt = "Default music artwork";
  });
  window.setInterval(updateMusicProgress, 1000);
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
      renderSpotify(data.spotify || null);
      if (!data.spotify) {
        const activities = Array.isArray(data.activities) ? data.activities : [];
        const musicActivity = activities.find((item) =>
          String(item.name || "").toLowerCase().includes("amazon music") ||
          [item.details, item.state].filter(Boolean).join(" ").toLowerCase().includes("amazon music")
        );
        if (musicActivity && musicCard) {
          externalTrack = true;
          musicCard.hidden = false;
          if (musicHeading) musicHeading.textContent = "Listening to Amazon Music";
          const details = String(musicActivity.details || "").trim();
          const state = String(musicActivity.state || "").trim();
          if (musicTitle) musicTitle.textContent = details || "Now playing";
          if (musicArtist) musicArtist.textContent = state || "Amazon Music";
          if (musicAlbum) musicAlbum.textContent = "Amazon Music";
          if (musicArt) {
            musicArt.src = "https://cdn.discordapp.com/embed/avatars/0.png";
            musicArt.style.visibility = "visible";
            musicArt.alt = "Amazon Music activity artwork unavailable";
          }
          if (musicProgress) musicProgress.style.width = "0%";
          if (musicElapsed) musicElapsed.textContent = "LIVE";
          if (musicDuration) musicDuration.textContent = "NO TIMING DATA";
        } else if (musicCard) {
          externalTrack = false;
          musicCard.hidden = true;
          if (musicArt) musicArt.style.visibility = "visible";
        }
      }
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
      const allActivities = Array.isArray(data.activities) ? data.activities : [];
      const activity = allActivities.find((item) => item.name && /amazon music/i.test(item.name)) || allActivities.find((item) => item.type !== 4) || allActivities.find((item) => item.type === 4);
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

/* Reliable scroll reveal: fail open, animate once when entering view */
(() => {
  const targets = Array.from(document.querySelectorAll("[data-reveal]"));
  if (!targets.length) return;

  const revealAll = () => {
    targets.forEach((element) => element.classList.add("is-revealed"));
    document.documentElement.classList.remove("reveal-ready");
  };
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealAll();
    return;
  }

  try {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        currentObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0,
      rootMargin: "0px 0px -6% 0px"
    });

    targets.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${index % 3 * 55}ms`);
      observer.observe(element);
    });
    document.documentElement.classList.add("reveal-ready");

    // Fail open if observation does not fire (e.g. browser/webview quirks).
    window.setTimeout(() => {
      targets.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          element.classList.add("is-revealed");
          observer.unobserve(element);
        }
      });
    }, 900);
  } catch (error) {
    revealAll();
  }
})();

/* Real public GitHub events with loading, empty, and error states */
(() => {
  const list = document.querySelector("#github-event-list");
  const state = document.querySelector("#github-feed-state");
  if (!list || !state) return;
  const username = "PauzeDevs";
  const eventLabels = {
    PushEvent: "Pushed commits",
    PullRequestEvent: "Updated a pull request",
    IssuesEvent: "Opened or updated an issue",
    IssueCommentEvent: "Commented on an issue",
    CreateEvent: "Created a branch or repository",
    ReleaseEvent: "Published a release",
    WatchEvent: "Starred a repository",
    ForkEvent: "Forked a repository",
    PublicEvent: "Made a repository public"
  };
  const relativeTime = (dateString) => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 1000));
    if (seconds < 60) return "JUST NOW";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}M AGO`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}H AGO`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}D AGO`;
    return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
  };
  const makeLink = (url, label) => {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = label;
    link.target = "_blank";
    link.rel = "noreferrer";
    return link;
  };
  const renderEvents = (events) => {
    list.replaceChildren();
    const useful = events.filter((event) => eventLabels[event.type] && event.repo?.name).slice(0, 5);
    if (!useful.length) {
      const item = document.createElement("li");
      item.textContent = "No recent public events to show.";
      list.append(item);
      state.textContent = "NO RECENT EVENTS";
      return;
    }
    useful.forEach((event) => {
      const item = document.createElement("li");
      const icon = document.createElement("span");
      icon.className = "activity-event-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = event.type === "PushEvent" ? "↥" : event.type === "PullRequestEvent" ? "⑂" : event.type === "ReleaseEvent" ? "◆" : "↗";
      const copy = document.createElement("div");
      copy.className = "activity-event-copy";
      const description = document.createElement("span");
      description.textContent = eventLabels[event.type] + " · ";
      description.append(makeLink(`https://github.com/${event.repo.name}`, event.repo.name.split("/").pop()));
      copy.append(description);
      if (event.type === "PushEvent" && event.payload?.commits?.length) {
        const commitCount = document.createElement("span");
        commitCount.textContent = ` (${event.payload.commits.length} commit${event.payload.commits.length === 1 ? "" : "s"})`;
        description.append(commitCount);
      }
      const meta = document.createElement("span");
      meta.className = "activity-event-meta";
      meta.textContent = relativeTime(event.created_at);
      copy.append(meta);
      item.append(icon, copy);
      list.append(item);
    });
    state.textContent = "LIVE · PUBLIC API";
  };
  const loadEvents = async () => {
    try {
      const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      renderEvents(await response.json());
    } catch (error) {
      list.replaceChildren();
      const item = document.createElement("li");
      item.textContent = "Live activity couldn't load. Open the GitHub profile to see the latest updates.";
      list.append(item);
      state.textContent = "TEMPORARILY UNAVAILABLE";
    }
  };
  loadEvents();
  window.setInterval(loadEvents, 300000);
  const graph = document.querySelector(".contribution-graph");
  if (graph) graph.addEventListener("error", () => {
    const link = graph.closest(".contribution-graph-link");
    if (link) {
      link.textContent = "Contribution graph unavailable — open the GitHub profile to view activity.";
      link.classList.add("graph-unavailable");
    }
  }, { once: true });
})();
