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

/* Live Discord presence and now-playing metadata. Amazon timing is approximate unless timestamps are exposed by Discord. */
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
  const musicArtFallback = document.querySelector("#discord-music-art-fallback");
  const musicTitle = document.querySelector("#discord-music-title");
  const musicArtist = document.querySelector("#discord-music-artist");
  const musicAlbum = document.querySelector("#discord-music-album");
  const musicHeading = document.querySelector("#discord-music-heading");
  const musicProgress = document.querySelector("#discord-music-progress");
  const musicElapsed = document.querySelector("#discord-music-elapsed");
  const musicDuration = document.querySelector("#discord-music-duration");
  const musicTimingNote = document.querySelector("#discord-music-timing-note");

  let activeTrack = null;
  let activeTrackKey = "";
  let presenceLoading = false;
  const metadataCache = new Map();
  const metadataRequests = new Map();

  const normalize = (value) => String(value || "").toLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(feat|ft)\.?\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ").trim();
  const formatTrackTime = (milliseconds) => {
    const seconds = Math.max(0, Math.floor(milliseconds / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  };
  const validTimestamp = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 && number < Date.now() + 5000 ? number : 0;
  };
  const setFallbackArtwork = (title, artist, key) => {
    if (musicArt) {
      musicArt.hidden = true;
      musicArt.removeAttribute("src");
      musicArt.dataset.trackKey = key || "";
    }
    if (!musicArtFallback) return;
    const words = String(title || "Music").trim().split(/\s+/).filter(Boolean);
    const initials = (words.slice(0, 2).map((word) => word[0]).join("") || "♪").toUpperCase();
    const palettes = [
      ["#645bff", "#29d6d2"], ["#ff8abe", "#ffd65e"],
      ["#99e3fa", "#a98cff"], ["#ffd49b", "#ff8a72"],
      ["#b5f28c", "#5ad6c8"]
    ];
    const hashText = `${title || ""} ${artist || ""}`;
    const hash = Array.from(hashText).reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
    const palette = palettes[hash % palettes.length];
    musicArtFallback.style.setProperty("--cover-a", palette[0]);
    musicArtFallback.style.setProperty("--cover-b", palette[1]);
    musicArtFallback.textContent = initials;
    musicArtFallback.hidden = false;
  };
  const setArtwork = (url, alt, title, artist, key) => {
    if (!url || !musicArt) {
      setFallbackArtwork(title, artist, key);
      return;
    }
    musicArt.dataset.trackKey = key;
    musicArt.alt = alt;
    if (musicArtFallback) musicArtFallback.hidden = true;
    musicArt.hidden = false;
    if (musicArt.getAttribute("src") !== url) musicArt.setAttribute("src", url);
  };
  if (musicArt) {
    musicArt.addEventListener("error", () => {
      if (!activeTrack || musicArt.dataset.trackKey !== activeTrack.key) return;
      setFallbackArtwork(activeTrack.title, activeTrack.artist, activeTrack.key);
    });
  }
  const setTrackCopy = (mode, title, artist, album) => {
    if (musicHeading) musicHeading.textContent = mode === "spotify" ? "Listening to Spotify" : "Listening to Amazon Music";
    if (musicTitle) musicTitle.textContent = title || "Unknown track";
    if (musicArtist) musicArtist.textContent = artist || "Unknown artist";
    if (musicAlbum) musicAlbum.textContent = album || (mode === "spotify" ? "Spotify" : "Amazon Music");
  };
  const updateMusicProgress = () => {
    if (!activeTrack || !musicCard || musicCard.hidden) return;
    const now = Date.now();
    const duration = Math.max(0, Number(activeTrack.durationMs) || 0);
    let elapsed = 0;
    let available = false;
    let estimated = false;

    if (activeTrack.mode === "spotify") {
      const start = validTimestamp(activeTrack.timestamps?.start);
      const end = validTimestamp(activeTrack.timestamps?.end);
      if (start && end && end > start) {
        elapsed = Math.max(0, Math.min(end - start, now - start));
        activeTrack.durationMs = end - start;
        available = true;
      }
    } else {
      const start = validTimestamp(activeTrack.sourceStartMs) || activeTrack.observedStartMs;
      if (start) {
        elapsed = Math.max(0, now - start);
        available = true;
        estimated = !validTimestamp(activeTrack.sourceStartMs);
      }
    }

    const currentDuration = Math.max(0, Number(activeTrack.durationMs) || duration);
    const clampedElapsed = currentDuration ? Math.min(currentDuration, elapsed) : elapsed;
    if (musicProgress) musicProgress.style.width = currentDuration ? `${Math.min(100, (clampedElapsed / currentDuration) * 100)}%` : "0%";
    if (musicElapsed) {
      if (!available) musicElapsed.textContent = "—:—";
      else musicElapsed.textContent = `${estimated ? "~" : ""}${formatTrackTime(clampedElapsed)}`;
    }
    if (musicDuration) musicDuration.textContent = currentDuration ? formatTrackTime(currentDuration) : "LENGTH UNKNOWN";
    if (musicTimingNote) {
      if (estimated) {
        musicTimingNote.textContent = "Approximate elapsed time, measured from when Discord first detected this track.";
        musicTimingNote.hidden = false;
      } else if (activeTrack.mode === "amazon" && !available) {
        musicTimingNote.textContent = "Amazon Music playback timing is not shared by Discord for this activity.";
        musicTimingNote.hidden = false;
      } else if (activeTrack.mode === "spotify" && !available) {
        musicTimingNote.textContent = "Spotify timing is not available in the current Discord activity.";
        musicTimingNote.hidden = false;
      } else {
        musicTimingNote.textContent = "";
        musicTimingNote.hidden = true;
      }
    }
  };

  const artworkFromItunes = (item) => {
    const source = item?.artworkUrl600 || item?.artworkUrl100 || item?.artworkUrl60;
    if (!source) return "";
    return source.replace(/\/\d+x\d+bb\./, "/600x600bb.");
  };
  const findBestItunesMatch = (results, title, artist) => {
    const wantedTitle = normalize(title);
    const artists = String(artist || "").split(/[,/&+]+/).map(normalize).filter(Boolean);
    let winner = null;
    let winnerScore = -1;
    for (const item of results) {
      if (!item || !item.trackName) continue;
      const foundTitle = normalize(item.trackName);
      let score = 0;
      if (foundTitle === wantedTitle) score += 100;
      else if (foundTitle.includes(wantedTitle) || wantedTitle.includes(foundTitle)) score += 45;
      else continue;
      const foundArtist = normalize(item.artistName);
      if (foundArtist && artists.some((name) => name === foundArtist)) score += 35;
      else if (foundArtist && artists.some((name) => name.length > 3 && (foundArtist.includes(name) || name.includes(foundArtist)))) score += 24;
      else if (foundArtist && artists.some((name) => name.split(" ").some((token) => token.length > 3 && foundArtist.includes(token)))) score += 8;
      if (item.trackTimeMillis) score += 2;
      if (item.artworkUrl100) score += 2;
      if (score > winnerScore) {
        winner = item;
        winnerScore = score;
      }
    }
    return winner;
  };
  const resolveAmazonMetadata = async (track) => {
    if (metadataCache.has(track.key)) {
      const cached = metadataCache.get(track.key);
      if (activeTrack?.key === track.key && cached) applyAmazonMetadata(track.key, cached);
      return;
    }
    if (metadataRequests.has(track.key)) return metadataRequests.get(track.key);
    const request = (async () => {
      try {
        const term = [track.title, track.artist].filter(Boolean).join(" ");
        const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15&country=IN`;
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timeout = controller ? window.setTimeout(() => controller.abort(), 9000) : null;
        let payload;
        try {
          const requestOptions = { headers: { Accept: "application/json" }, cache: "force-cache" };
          if (controller) requestOptions.signal = controller.signal;
          const response = await fetch(endpoint, requestOptions);
          if (!response.ok) throw new Error(`Music catalogue returned ${response.status}`);
          payload = await response.json();
        } finally {
          if (timeout !== null) window.clearTimeout(timeout);
        }
        const winner = findBestItunesMatch(Array.isArray(payload.results) ? payload.results : [], track.title, track.artist);
        const metadata = winner ? {
          album: winner.collectionName || "Amazon Music",
          durationMs: Number(winner.trackTimeMillis) || 0,
          artwork: artworkFromItunes(winner),
          matchedTitle: winner.trackName || track.title,
          matchedArtist: winner.artistName || track.artist
        } : null;
        metadataCache.set(track.key, metadata);
        if (activeTrack?.key === track.key && activeTrack.mode === "amazon" && metadata) applyAmazonMetadata(track.key, metadata);
        else if (activeTrack?.key === track.key && activeTrack.mode === "amazon") updateMusicProgress();
      } catch (error) {
        // Keep the track card usable when the catalogue is unavailable; next track will retry.
        if (activeTrack?.key === track.key && activeTrack.mode === "amazon") updateMusicProgress();
      } finally {
        metadataRequests.delete(track.key);
      }
    })();
    metadataRequests.set(track.key, request);
    return request;
  };
  function applyAmazonMetadata(key, metadata) {
    if (!activeTrack || activeTrack.key !== key || activeTrack.mode !== "amazon") return;
    if (metadata.durationMs) activeTrack.durationMs = metadata.durationMs;
    if (metadata.album) activeTrack.album = metadata.album;
    if (musicAlbum && metadata.album) musicAlbum.textContent = metadata.album;
    setArtwork(metadata.artwork, `Cover art for ${activeTrack.title} by ${activeTrack.artist}`, activeTrack.title, activeTrack.artist, activeTrack.key);
    updateMusicProgress();
  }

  const renderSpotify = (spotify) => {
    const title = String(spotify.song || "Unknown track").trim();
    const artist = String(spotify.artist || "Unknown artist").trim();
    const key = `spotify:${normalize(title)}:${normalize(artist)}`;
    const changed = key !== activeTrackKey;
    activeTrackKey = key;
    activeTrack = {
      key, mode: "spotify", title, artist,
      durationMs: 0, timestamps: spotify.timestamps || null
    };
    if (musicCard) musicCard.hidden = false;
    setTrackCopy("spotify", title, artist, spotify.album || "Spotify");
    setArtwork(spotify.album_art_url || "", `Album artwork for ${title} by ${artist}`, title, artist, key);
    updateMusicProgress();
    return changed;
  };

  const renderAmazon = (activity) => {
    const rawTitle = String(activity.details || "").trim();
    const rawArtist = String(activity.state || "").trim();
    const title = rawTitle.replace(/^Amazon Music\s*[-—:]\s*/i, "").trim() || "Now playing";
    const artist = rawArtist.replace(/^Amazon Music\s*[-—:]\s*/i, "").trim() || "Amazon Music";
    const key = `amazon:${normalize(title)}:${normalize(artist)}`;
    const changed = key !== activeTrackKey;
    const sourceStartMs = validTimestamp(activity.timestamps?.start);
    if (changed) {
      activeTrackKey = key;
      activeTrack = {
        key, mode: "amazon", title, artist,
        album: "Amazon Music", durationMs: 0,
        sourceStartMs, observedStartMs: Date.now()
      };
      if (musicProgress) musicProgress.style.width = "0%";
      if (musicElapsed) musicElapsed.textContent = "~0:00";
      if (musicDuration) musicDuration.textContent = "LOOKING UP…";
      if (musicAlbum) musicAlbum.textContent = "Finding album details…";
      setFallbackArtwork(title, artist, key);
    } else if (sourceStartMs) {
      activeTrack.sourceStartMs = sourceStartMs;
    }
    if (musicCard) musicCard.hidden = false;
    setTrackCopy("amazon", title, artist, activeTrack?.album || "Amazon Music");
    if (metadataCache.has(key)) {
      const cached = metadataCache.get(key);
      if (cached) applyAmazonMetadata(key, cached);
    } else if (!metadataRequests.has(key)) {
      // Retry transient catalogue failures on the next presence refresh.
      void resolveAmazonMetadata(activeTrack);
    }
    updateMusicProgress();
  };

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
    if (presenceLoading) return;
    presenceLoading = true;
    let controller = null;
    let timeout = null;
    try {
      if (typeof AbortController === "function") {
        controller = new AbortController();
        timeout = window.setTimeout(() => controller.abort(), 10000);
      }
      const requestOptions = { headers: { Accept: "application/json" }, cache: "no-store" };
      if (controller) requestOptions.signal = controller.signal;
      const response = await fetch(`https://api.lanyard.rest/v1/users/${userId}`, requestOptions);
      if (!response.ok) throw new Error(`Presence service returned ${response.status}`);
      const payload = await response.json();
      if (!payload.success || !payload.data) throw new Error("No public presence data");
      const data = payload.data;
      const activities = Array.isArray(data.activities) ? data.activities : [];
      const amazonActivity = activities.find((item) =>
        /amazon music/i.test([item.name, item.details, item.state, item.platform].filter(Boolean).join(" "))
      );
      const status = data.discord_status || "offline";
      statusLabel.textContent = statusNames[status] || "UNKNOWN";
      statusDot.dataset.status = status;
      if (avatarStatus) avatarStatus.dataset.status = status;
      const user = data.discord_user || {};
      displayName.textContent = user.global_name || user.display_name || user.username || "Pauze";
      activityText.textContent = status === "offline" ? "Currently offline" : status === "dnd" ? "Busy on Discord" : status === "idle" ? "Away on Discord" : "Active on Discord";
      if (avatar && user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_") ? "gif" : "png";
        const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
        if (avatar.getAttribute("src") !== avatarUrl) avatar.src = avatarUrl;
      } else if (avatar) {
        avatar.src = "https://cdn.discordapp.com/embed/avatars/0.png";
      }

      if (data.spotify && data.spotify.song) {
        renderSpotify(data.spotify);
      } else if (amazonActivity && musicCard) {
        renderAmazon(amazonActivity);
      } else {
        activeTrack = null;
        activeTrackKey = "";
        if (musicCard) musicCard.hidden = true;
      }

      const activity = amazonActivity ||
        activities.find((item) => String(item.name || "").toLowerCase() === "spotify") ||
        activities.find((item) => item.type !== 4) ||
        activities.find((item) => item.type === 4);
      if (activity) {
        const details = [activity.name, activity.details, activity.state].filter(Boolean);
        currentActivity.textContent = details.join(" — ") || "Activity detected";
      } else if (status === "offline") {
        currentActivity.textContent = "No current activity";
      } else {
        currentActivity.textContent = "Online — no activity shared";
      }
      if (note) note.textContent = "Discord presence refreshes every 20 seconds. Track artwork and duration are matched from a public music catalogue when available.";
    } catch (error) {
      setUnavailable("Live presence is temporarily unavailable. The page will retry automatically.");
    } finally {
      if (timeout !== null) window.clearTimeout(timeout);
      presenceLoading = false;
    }
  };

  void loadPresence();
  window.setInterval(() => { void loadPresence(); }, 20000);
  window.setInterval(updateMusicProgress, 1000);
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
    let sawIntersection = false;
    const observer = new IntersectionObserver((entries, currentObserver) => {
      if (entries.some((entry) => entry.isIntersecting)) sawIntersection = true;
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
    // Only fail open if the observer never reports anything visible; don't disable future scroll reveals.
    const watchdog = window.setTimeout(() => {
      if (!sawIntersection) {
        revealAll();
        observer.disconnect();
      }
    }, 8000);
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


/* PAUZE ARCADE: self-contained endless runner, no backend or external assets */
(() => {
  const canvas=document.querySelector("#dino-canvas"),stage=document.querySelector("#dino-stage"),overlay=document.querySelector("#dino-overlay");
  const overlayTitle=document.querySelector("#dino-overlay-title"),overlayCopy=document.querySelector("#dino-overlay-copy"),startButton=document.querySelector("#dino-start");
  const restartButton=document.querySelector("#dino-restart"),jumpButton=document.querySelector("#dino-jump"),duckButton=document.querySelector("#dino-duck");
  const scoreLabel=document.querySelector("#dino-score"),bestLabel=document.querySelector("#dino-best"),speedLabel=document.querySelector("#dino-speed"),stateLabel=document.querySelector("#dino-state");
  if(!canvas||!stage||!overlay||!startButton)return;
  const ctx=canvas.getContext("2d");
  if(!ctx){overlayTitle.textContent="GAME UNAVAILABLE";overlayCopy.textContent="This browser could not start the canvas game.";startButton.hidden=true;return;}
  const W=900,H=260,groundY=218,colors={ink:"#17121f",muted:"#786c82",sky:"#f3eaff",pink:"#ffc7e8",green:"#d8f99d",yellow:"#fff08b",white:"#fffdf8",purple:"#6656ff"};
  const bestKey="pauze-dino-best-v1";
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
  const getBest=()=>{try{const n=Number(localStorage.getItem(bestKey));return Number.isFinite(n)&&n>0?Math.floor(n):0;}catch{return 0;}};
  const fmt=n=>String(Math.max(0,Math.floor(n))).padStart(5,"0");
  let best=getBest(),score=0,speed=300,elapsed=0,spawnIn=.8,groundOffset=0,lastTime=0,raf=0,running=false,paused=false,gameOver=false;
  let obstacles=[],dust=[],clouds=[{x:130,y:52,s:1},{x:490,y:82,s:.7},{x:760,y:39,s:.85}];
  const dino={x:94,y:groundY-42,w:36,h:42,vy:0,onGround:true,ducking:false};
  const refresh=()=>{scoreLabel.textContent=fmt(score);bestLabel.textContent=fmt(best);speedLabel.textContent=(speed/300).toFixed(1)+"×";};
  const show=(title,copy,button)=>{overlayTitle.textContent=title;overlayCopy.textContent=copy;startButton.textContent=button+" ↗";overlay.hidden=false;};
  const hide=()=>{overlay.hidden=true;};
  const reset=()=>{score=0;speed=300;elapsed=0;spawnIn=.8;groundOffset=0;lastTime=0;obstacles=[];dust=[];dino.y=groundY-dino.h;dino.vy=0;dino.onGround=true;dino.ducking=false;paused=false;gameOver=false;refresh();};
  const drawCloud=c=>{rect(c.x,c.y+8*c.s,40*c.s,8*c.s,colors.white);rect(c.x+8*c.s,c.y,14*c.s,16*c.s,colors.white);rect(c.x+21*c.s,c.y+3*c.s,12*c.s,13*c.s,colors.white);rect(c.x-4*c.s,c.y+12*c.s,48*c.s,4*c.s,"#e4d9f5");};
  const drawDino=()=>{
    const x=dino.x,y=dino.y+(dino.ducking?13:0),c=colors.ink;
    if(dino.ducking){rect(x+1,y+16,30,16,c);rect(x+22,y+6,17,17,c);rect(x+32,y+11,10,8,c);rect(x+31,y+9,3,3,colors.white);rect(x+3,y+30,9,5,c);rect(x+20,y+30,10,5,c);rect(x-4,y+18,8,5,c);}
    else{rect(x+6,y+11,22,24,c);rect(x+18,y+2,19,18,c);rect(x+32,y+10,13,8,c);rect(x+25,y+5,4,4,colors.white);rect(x+1,y+13,9,5,c);rect(x+3,y+18,8,4,c);const leg=Math.floor(elapsed*14)%2;rect(x+(leg?4:6),y+(leg?37:40),10,4,c);rect(x+19,y+(leg?40:37),10,4,c);rect(x+8,y+33,7,10,c);rect(x+19,y+33,7,10,c);}
    rect(x+7,y+16,5,3,colors.pink);
  };
  const drawCactus=o=>{const x=o.x,y=o.y,c=colors.green;rect(x+7,y,8,o.h,c);rect(x+3,y+9,6,4,c);rect(x,y+5,5,13,c);rect(x+1,y+5,7,4,c);rect(x+15,y+16,5,4,c);rect(x+17,y+12,5,13,c);rect(x+15,y+24,7,4,c);rect(x+4,y+o.h-3,15,4,colors.ink);};
  const drawBird=o=>{const flap=Math.sin(elapsed*13+o.phase)>0?0:7,x=o.x,y=o.y;rect(x+9,y+8,22,10,colors.ink);rect(x+28,y+9,10,5,colors.ink);rect(x+37,y+10,5,3,colors.yellow);rect(x+13,y+4+flap,12,5,colors.purple);rect(x+8,y+1+flap,8,5,colors.purple);rect(x+14,y+18-flap,12,4,colors.purple);rect(x+4,y+8,8,5,colors.ink);rect(x+25,y+9,3,3,colors.white);};
  const draw=()=>{
    ctx.clearRect(0,0,W,H);rect(0,0,W,H,colors.sky);
    rect(764,25,34,34,colors.yellow);rect(772,17,18,8,colors.yellow);rect(772,59,18,8,colors.yellow);rect(756,33,8,18,colors.yellow);rect(798,33,8,18,colors.yellow);
    for(let i=0;i<12;i++)rect((i*89+24)%W,24+(i*37)%115,3,3,"#e6d9f6");
    clouds.forEach(drawCloud);rect(0,groundY,W,3,colors.ink);
    for(let x=-(groundOffset%44);x<W;x+=44){rect(x,groundY+12,18,3,"#b4a1ce");rect(x+24,groundY+23,6,3,"#b4a1ce");}
    obstacles.forEach(o=>o.type==="bird"?drawBird(o):drawCactus(o));drawDino();dust.forEach(p=>rect(p.x,p.y,4,4,p.color));
    ctx.fillStyle=colors.muted;ctx.font="700 12px monospace";ctx.textAlign="right";ctx.fillText("PAUZE / RUNNER",W-18,24);
  };
  const collides=(a,b)=>a.x<b.x+b.w-4&&a.x+a.w-4>b.x+3&&a.y<b.y+b.h-3&&a.y+a.h-3>b.y+3;
  const spawn=()=>{if(score>220&&Math.random()<.26)obstacles.push({type:"bird",x:W+20,y:groundY-(Math.random()<.5?53:60),w:38,h:24,phase:Math.random()*6});else{const tall=Math.random()<.35;obstacles.push({type:"cactus",x:W+20,y:groundY-(tall?51:36),w:tall?24:18,h:tall?51:36});}spawnIn=Math.max(.58,1.1+Math.random()*.8-(speed-300)/650);};
  const finish=()=>{running=false;gameOver=true;stateLabel.textContent="RUN ENDED";if(score>best){best=score;try{localStorage.setItem(bestKey,String(best));}catch{}}refresh();show("OOPS. RUN OVER.","Score "+fmt(score)+" · Best "+fmt(best)+". One more run?","PLAY AGAIN");};
  const update=dt=>{
    elapsed+=dt;speed=Math.min(650,300+elapsed*7+score*.035);score+=dt*10;spawnIn-=dt;if(spawnIn<=0)spawn();
    groundOffset=(groundOffset+speed*dt)%44;clouds.forEach(c=>{c.x-=speed*.14*dt;if(c.x<-60)c.x=W+Math.random()*100;});
    if(!dino.onGround){dino.vy+=1850*dt;dino.y+=dino.vy*dt;if(dino.y>=groundY-dino.h){dino.y=groundY-dino.h;dino.vy=0;dino.onGround=true;}}
    obstacles.forEach(o=>{o.x-=speed*dt;});obstacles=obstacles.filter(o=>o.x+o.w>-10);
    dust.forEach(p=>{p.x+=p.vx*dt;p.life-=dt;});dust=dust.filter(p=>p.life>0);
    const player={x:dino.x+4,y:dino.y+(dino.ducking?13:0),w:dino.ducking?44:32,h:dino.ducking?22:36};
    if(obstacles.some(o=>collides(player,o))){finish();return;}refresh();
  };
  const loop=time=>{if(!running||paused)return;if(!lastTime)lastTime=time;const dt=Math.min(.032,(time-lastTime)/1000||0);lastTime=time;update(dt);draw();if(running&&!paused)raf=requestAnimationFrame(loop);};
  const start=()=>{cancelAnimationFrame(raf);reset();running=true;stateLabel.textContent="RUNNING";hide();stage.focus({preventScroll:true});raf=requestAnimationFrame(loop);};
  const jump=()=>{if(!running){start();return;}if(paused){paused=false;hide();stateLabel.textContent="RUNNING";lastTime=0;raf=requestAnimationFrame(loop);return;}if(dino.onGround){dino.vy=-690;dino.onGround=false;dino.ducking=false;dust.push({x:dino.x+5,y:groundY-3,vx:-45,life:.25,color:colors.purple});}};
  const duck=down=>{dino.ducking=!!down&&running&&!paused&&!gameOver&&dino.onGround;};
  const pause=()=>{if(!running||gameOver)return;paused=!paused;stateLabel.textContent=paused?"PAUSED":"RUNNING";if(paused)show("TAKE A BREATHER.","Press P or tap resume when you’re ready.","RESUME");else{hide();lastTime=0;raf=requestAnimationFrame(loop);}};
  const onKey=e=>{if(["Space","ArrowUp","ArrowDown","KeyP"].includes(e.code))e.preventDefault();if(e.repeat&&["Space","ArrowUp","KeyP"].includes(e.code))return;if(e.code==="Space"||e.code==="ArrowUp")jump();else if(e.code==="ArrowDown")duck(true);else if(e.code==="KeyP")pause();};
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&running&&!paused)pause();});
  stage.addEventListener("keydown",onKey);
  window.addEventListener("keydown",e=>{if(stage.contains(document.activeElement))return;if(["Space","ArrowUp","ArrowDown","KeyP"].includes(e.code)&&!e.target.closest("input,textarea,button,a,select"))onKey(e);});
  window.addEventListener("keyup",e=>{if(e.code==="ArrowDown")duck(false);});
  stage.addEventListener("pointerdown",e=>{if(e.target===canvas)jump();});
  startButton.addEventListener("click",()=>{if(paused){paused=false;hide();stateLabel.textContent="RUNNING";lastTime=0;raf=requestAnimationFrame(loop);}else start();});
  restartButton.addEventListener("click",start);
  if(jumpButton)jumpButton.addEventListener("pointerdown",e=>{e.preventDefault();jump();});
  if(duckButton){duckButton.addEventListener("pointerdown",e=>{e.preventDefault();duck(true);});["pointerup","pointercancel","pointerleave"].forEach(name=>duckButton.addEventListener(name,()=>duck(false)));}
  bestLabel.textContent=fmt(best);refresh();draw();
})();
