const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".desktop-nav");
if (menuButton && nav) {
  menuButton.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open menu");
  }));
}

/* Accessible command palette: keyboard shortcut, live filtering, and safe dismissal. */
(() => {
  const dialog = document.querySelector("#command-palette");
  const trigger = document.querySelector(".command-trigger");
  const search = document.querySelector("#command-search");
  const closeButton = document.querySelector("[data-command-close]");
  const items = [...document.querySelectorAll("[data-command-item]")];
  const empty = document.querySelector("#command-empty");
  if (!dialog || !trigger || !search || !closeButton || !items.length || !empty) return;
  const openPalette = () => {
    if (typeof dialog.showModal === "function" && !dialog.open) {
      dialog.showModal();
      search.value = "";
      filterItems();
      window.requestAnimationFrame(() => search.focus());
    }
  };
  const closePalette = () => { if (dialog.open) dialog.close(); };
  const filterItems = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    items.forEach((item) => {
      const matches = item.textContent.toLowerCase().includes(query);
      item.hidden = !matches;
      if (matches) visible++;
    });
    empty.hidden = visible !== 0;
  };
  trigger.addEventListener("click", openPalette);
  closeButton.addEventListener("click", closePalette);
  search.addEventListener("input", filterItems);
  items.forEach((item) => item.addEventListener("click", closePalette));
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closePalette(); });
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) closePalette(); else openPalette();
    }
  });
})();

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

/* Live India Standard Time (IST), rendered locally in the visitor's browser. */
(() => {
  const clock = document.querySelector("#india-time");
  const date = document.querySelector("#india-date");
  if (!clock || !date) return;

  const timeFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  const dateFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const updateIndiaClock = () => {
    const now = new Date();
    clock.textContent = timeFormatter.format(now);
    clock.dateTime = now.toISOString();
    date.textContent = dateFormatter.format(now);
  };

  updateIndiaClock();
  window.setInterval(updateIndiaClock, 1000);
})();

/* Interactive technology stack markup is not present on this page. */
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
  const avatarWrap = avatar?.closest(".discord-avatar-wrap");
  if (avatar) avatar.addEventListener("error", () => { avatar.removeAttribute("src"); avatarWrap?.classList.remove("has-avatar"); });
  const nitroStatus = document.querySelector("#discord-nitro-status");
  const nitroIcon = nitroStatus?.querySelector(".discord-nitro-icon");
  if (nitroIcon) nitroIcon.addEventListener("error", () => nitroIcon.classList.add("is-unavailable"), { once: true });
  const publicBadges = document.querySelector("#discord-badges");
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
  const validTimestamp = (value, allowFuture = false) => {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 && (allowFuture || number < Date.now() + 5000) ? number : 0;
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
      ["#315efb", "#d4ff70"], ["#151a25", "#6387ff"],
      ["#d4ff70", "#edf1ff"], ["#edf1ff", "#315efb"],
      ["#151a25", "#9cce54"]
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
      // Spotify's end timestamp is expected to be in the future while a track is playing.
      const end = validTimestamp(activeTrack.timestamps?.end, true);
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
    const artists = String(artist || "")
      .split(/\s*(?:\[[^\]]*\]|\([^)]*\)|\b(?:feat|ft)\.?\b|[,/&+])\s*/i)
      .map(normalize).filter((name) => name.length > 2);
    let winner = null;
    let winnerScore = -1;
    for (const item of results) {
      if (!item || !item.trackName) continue;
      const foundTitle = normalize(item.trackName);
      const exactTitle = foundTitle === wantedTitle;
      const titleMatches = exactTitle || foundTitle.startsWith(wantedTitle + " ") || wantedTitle.startsWith(foundTitle + " ");
      if (!titleMatches) continue;
      const foundArtist = normalize(item.artistName);
      const exactArtist = artists.some((name) => name === foundArtist);
      const artistMatches = exactArtist || artists.some((name) =>
        name.length > 3 && (foundArtist.startsWith(name + " ") || name.startsWith(foundArtist + " "))
      );
      if (!artistMatches) continue;
      const score = (exactTitle ? 100 : 65) + (exactArtist ? 35 : 25)
        + (item.trackTimeMillis ? 2 : 0) + (item.artworkUrl100 ? 2 : 0);
      if (score > winnerScore) {
        winner = item;
        winnerScore = score;
      }
    }
    return winnerScore >= 90 ? winner : null;
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
        const controller = typeof AbortController === "function" ? new AbortController() : null;
        const timeout = controller ? window.setTimeout(() => controller.abort(), 9000) : null;
        let winner = null;
        try {
          const requestOptions = { headers: { Accept: "application/json" }, cache: "force-cache" };
          if (controller) requestOptions.signal = controller.signal;
          for (const country of ["IN", "US"]) {
            try {
              const endpoint = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=15&country=${country}`;
              const response = await fetch(endpoint, requestOptions);
              if (!response.ok) throw new Error(`Music catalogue returned ${response.status}`);
              const payload = await response.json();
              winner = findBestItunesMatch(Array.isArray(payload.results) ? payload.results : [], track.title, track.artist);
              if (winner) break;
            } catch (error) {
              if (country === "US") throw error;
            }
          }
        } finally {
          if (timeout !== null) window.clearTimeout(timeout);
        }
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

  /* Render subscription details only when Lanyard actually supplies a value.
     Standard Lanyard payloads commonly include public_flags but may omit premium_type. */
  const profileBadgeDefinitions = [
    { flag: 1 << 0, label: "Discord Staff", short: "STAFF" },
    { flag: 1 << 1, label: "Partnered Server Owner", short: "PARTNER" },
    { flag: 1 << 2, label: "HypeSquad Events", short: "HYPESQUAD" },
    { flag: 1 << 3, label: "Bug Hunter Level 1", short: "BUG HUNTER I" },
    { flag: 1 << 6, label: "HypeSquad House of Bravery", short: "BRAVERY" },
    { flag: 1 << 7, label: "HypeSquad House of Brilliance", short: "BRILLIANCE" },
    { flag: 1 << 8, label: "HypeSquad House of Balance", short: "BALANCE" },
    { flag: 1 << 9, label: "Early Nitro Supporter", short: "EARLY SUPPORTER" },
    { flag: 1 << 14, label: "Bug Hunter Level 2", short: "BUG HUNTER II" },
    { flag: 1 << 17, label: "Early Verified Bot Developer", short: "EARLY DEVELOPER" },
    { flag: 1 << 18, label: "Certified Moderator", short: "MODERATOR" },
    { flag: 1 << 22, label: "Active Developer", short: "ACTIVE DEVELOPER" }
  ];
  const renderProfileMarkers = (user, presenceData) => {
    if (nitroStatus) {
      const rawNitro = user.premium_type ?? presenceData.premium_type ?? presenceData.kv?.nitro;
      const token = rawNitro == null ? "" : String(rawNitro).trim().toLowerCase();
      const nitroLabels = {
        "0": "NO NITRO", "none": "NO NITRO", "false": "NO NITRO", "no": "NO NITRO", "inactive": "NO NITRO",
        "1": "NITRO CLASSIC", "classic": "NITRO CLASSIC", "nitro classic": "NITRO CLASSIC",
        "2": "NITRO", "nitro": "NITRO",
        "3": "NITRO BASIC", "basic": "NITRO BASIC", "nitro basic": "NITRO BASIC",
        "true": "NITRO ACTIVE", "yes": "NITRO ACTIVE", "active": "NITRO ACTIVE"
      };
      const label = nitroLabels[token] || (token ? "NITRO STATUS UNKNOWN" : "NITRO NOT EXPOSED");
      const isActive = Boolean(token) && !["0", "none", "false", "no", "inactive"].includes(token) && Boolean(nitroLabels[token]);
      const displayLabel = isActive && !label.endsWith("ACTIVE") ? label + " ACTIVE" : label;
      const nitroLabel = nitroStatus.querySelector(".discord-nitro-label");
      if (nitroLabel) nitroLabel.textContent = displayLabel;
      else nitroStatus.textContent = displayLabel;
      nitroStatus.classList.toggle("is-active", isActive);
      nitroStatus.classList.toggle("is-unknown", !token || !nitroLabels[token]);
      nitroStatus.setAttribute("aria-label", "Discord Nitro status: " + displayLabel.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()));
    }

    if (!publicBadges) return;
    publicBadges.replaceChildren();
    const rawFlags = user.public_flags ?? user.flags;
    const flags = Number(rawFlags);
    const flagsAvailable = rawFlags != null && Number.isFinite(flags);
    const matchingBadges = flagsAvailable
      ? profileBadgeDefinitions.filter(({ flag }) => (Math.trunc(flags) & flag) === flag)
      : [];
    matchingBadges.forEach(({ label, short }) => {
      const badge = document.createElement("span");
      badge.className = "discord-account-badge";
      badge.textContent = short;
      badge.title = label;
      badge.setAttribute("aria-label", label);
      publicBadges.append(badge);
    });

    const guild = user.primary_guild;
    const guildId = typeof guild?.identity_guild_id === "string" ? guild.identity_guild_id : "";
    const guildBadgeHash = typeof guild?.badge === "string" ? guild.badge : "";
    if (guild?.identity_enabled && guildId && guildBadgeHash) {
      const serverBadge = document.createElement("span");
      serverBadge.className = "discord-account-badge discord-server-badge";
      serverBadge.title = guild.tag ? `Server identity: ${guild.tag}` : "Discord server identity badge";
      serverBadge.setAttribute("aria-label", serverBadge.title);
      const icon = document.createElement("img");
      icon.src = `https://cdn.discordapp.com/clan-badges/${encodeURIComponent(guildId)}/${encodeURIComponent(guildBadgeHash)}.png?size=64`;
      icon.alt = "";
      icon.loading = "lazy";
      icon.decoding = "async";
      icon.onerror = () => serverBadge.classList.add("discord-server-badge-fallback");
      serverBadge.append(icon);
      if (typeof guild.tag === "string" && guild.tag.trim()) {
        const tag = document.createElement("span");
        tag.textContent = guild.tag.trim();
        serverBadge.append(tag);
      }
      publicBadges.append(serverBadge);
    }

    if (!matchingBadges.length && !guild?.identity_enabled) {
      const empty = document.createElement("span");
      empty.className = "discord-marker-empty";
      empty.textContent = flagsAvailable ? "No public profile badges" : "Public badges unavailable";
      publicBadges.append(empty);
    }
  };

  const statusNames = { online: "ONLINE", idle: "IDLE", dnd: "DO NOT DISTURB", offline: "OFFLINE" };
  const setUnavailable = (message) => {
    activeTrack = null;
    activeTrackKey = "";
    if (musicCard) musicCard.hidden = true;
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
      renderProfileMarkers(user, data);
      displayName.textContent = user.global_name || user.display_name || user.username || "Pauze";
      activityText.textContent = status === "offline" ? "Currently offline" : status === "dnd" ? "Busy on Discord" : status === "idle" ? "Away on Discord" : "Active on Discord";
      if (avatar && user.id && user.avatar) {
        const extension = user.avatar.startsWith("a_") ? "gif" : "png";
        const avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
        if (avatar.getAttribute("src") !== avatarUrl) avatar.src = avatarUrl;
        avatarWrap?.classList.add("has-avatar");
      } else if (avatar) {
        avatar.removeAttribute("src");
        avatarWrap?.classList.remove("has-avatar");
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

/* Contact hub: copy email without blocking the mailto fallback. */
(() => {
  const button = document.querySelector("[data-copy-email]");
  const status = document.querySelector(".copy-email-status");
  if (!button || !status) return;
  button.addEventListener("click", async () => {
    const email = button.getAttribute("data-copy-email");
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(email);
      button.textContent = "Copied";
      status.textContent = "Email copied to clipboard.";
    } catch (error) {
      button.textContent = "Copy unavailable";
      status.textContent = "Clipboard access isn't available here. Use Get in touch to email directly.";
    }
    window.setTimeout(() => { button.textContent = "Copy email"; }, 2200);
  });
})();

/* Public GitHub activity from the PauzeDevs profile (commits and pull requests). */
(() => {
  const list = document.querySelector("#github-event-list");
  const state = document.querySelector("#github-feed-state");
  if (!list || !state) return;
  const feeds = [
    { label: "PROFILE", url: "https://api.github.com/users/PauzeDevs/events/public?per_page=100" }
  ];
  const eventLabels = {
    PushEvent: "Pushed commits",
    PullRequestEvent: "Updated a pull request",
    PullRequestReviewEvent: "Reviewed a pull request",
    PullRequestReviewCommentEvent: "Commented on a pull request",
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
    if (seconds < 3600) return Math.floor(seconds / 60) + "M AGO";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "H AGO";
    if (seconds < 604800) return Math.floor(seconds / 86400) + "D AGO";
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
  const pullRequestAction = (event) => {
    const pullRequest = event.payload && event.payload.pull_request;
    const action = event.payload && event.payload.action;
    const number = event.payload && event.payload.number || pullRequest && pullRequest.number;
    const merged = pullRequest && (pullRequest.merged || pullRequest.merged_at);
    const labels = {
      opened: "Opened pull request",
      reopened: "Reopened pull request",
      synchronize: "Updated pull request",
      closed: merged ? "Merged pull request" : "Closed pull request",
      merged: "Merged pull request"
    };
    return {
      number,
      label: labels[action] || "Updated pull request",
      url: number ? "https://github.com/" + event.repo.name + "/pull/" + number : "https://github.com/" + event.repo.name
    };
  };
  const renderEvents = (events, failedCount) => {
    list.replaceChildren();
    const seen = new Set();
    const uniqueEvents = events
      .filter((event) => eventLabels[event.type] && event.repo && event.repo.name && event.created_at)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .filter((event) => {
        const pullRequestEvent = event.type === "PullRequestEvent" || event.type === "PullRequestReviewEvent" || event.type === "PullRequestReviewCommentEvent";
        const number = event.payload && event.payload.number || event.payload && event.payload.pull_request && event.payload.pull_request.number;
        const key = pullRequestEvent && number ? event.repo.name + ":pr:" + number : event.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    if (!uniqueEvents.length) return false;
    const isPullRequestEvent = (event) => event.type === "PullRequestEvent" || event.type === "PullRequestReviewEvent" || event.type === "PullRequestReviewCommentEvent";
    const latestPush = uniqueEvents.find((event) => event.type === "PushEvent");
    const pullRequestEvents = uniqueEvents.filter(isPullRequestEvent);
    const otherEvents = uniqueEvents.filter((event) => event.type !== "PushEvent" && !isPullRequestEvent(event));
    const useful = [];
    if (latestPush) useful.push(latestPush);
    useful.push(...pullRequestEvents.slice(0, 5 - useful.length));
    useful.push(...otherEvents.slice(0, 5 - useful.length));
    useful.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    useful.forEach((event) => {
      const item = document.createElement("li");
      const pullRequestEvent = event.type === "PullRequestEvent" || event.type === "PullRequestReviewEvent" || event.type === "PullRequestReviewCommentEvent";
      const pullRequest = pullRequestEvent ? pullRequestAction(event) : null;
      const icon = document.createElement("span");
      icon.className = "activity-event-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = event.type === "PushEvent" ? "↥" : pullRequestEvent ? "⑂" : event.type === "ReleaseEvent" ? "◆" : "↗";
      const copy = document.createElement("div");
      copy.className = "activity-event-copy";
      const description = document.createElement("span");
      description.className = "activity-event-title";
      const label = pullRequest ? pullRequest.label : eventLabels[event.type];
      description.append(document.createTextNode(label + " · "));
      const repoName = event.repo.name.split("/").pop();
      const headSha = event.payload && event.payload.head;
      const commitUrl = typeof headSha === "string" && /^[a-f0-9]{7,40}$/i.test(headSha)
        ? "https://github.com/" + event.repo.name + "/commit/" + headSha
        : "https://github.com/" + event.repo.name;
      const targetUrl = pullRequest ? pullRequest.url : commitUrl;
      const targetLabel = pullRequest && pullRequest.number ? "#" + pullRequest.number + " · " + repoName : repoName;
      description.append(makeLink(targetUrl, targetLabel));
      if (event.type === "PushEvent" && event.payload && Array.isArray(event.payload.commits) && event.payload.commits.length) {
        const commitCount = document.createElement("span");
        commitCount.textContent = " (" + event.payload.commits.length + " commit" + (event.payload.commits.length === 1 ? "" : "s") + ")";
        description.append(commitCount);
      }
      const meta = document.createElement("span");
      meta.className = "activity-event-meta";
      meta.textContent = relativeTime(event.created_at);
      copy.append(description, meta);
      item.append(icon, copy);
      list.append(item);
    });
    state.textContent = failedCount ? "LIVE · PARTIAL DATA" : "LIVE · COMMITS + PR UPDATES";
    return true;
  };
  const renderRecentCommits = async () => {
    const repositories = [
      "PauzeDevs/Pauze-backup-website",
      "PauzeDevs/PauzeXDevelopments-Website",
      "PauzeDevs/PauzeChats",
      "PauzeDevs/PauzeControl"
    ];
    try {
      const results = await Promise.allSettled(repositories.map(async (name) => {
        const response = await fetch("https://api.github.com/repos/" + name + "/commits?per_page=3", {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store"
        });
        if (!response.ok) throw new Error("Commit feed unavailable");
        const commits = await response.json();
        return commits.map((commit) => ({
          repo: { name },
          message: commit.commit?.message?.split(/\r?\n/)[0]?.trim() || "Updated repository",
          url: commit.html_url,
          created_at: commit.commit?.committer?.date || commit.commit?.author?.date
        }));
      }));
      const commits = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value)
        .filter((commit) => commit.created_at && commit.url)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .filter((commit, index, all) => all.findIndex((other) => other.repo.name === commit.repo.name) === index)
        .slice(0, 4);
      list.replaceChildren();
      if (!commits.length) throw new Error("No public commits available");
      commits.forEach((commit) => {
        const item = document.createElement("li");
        const icon = document.createElement("span");
        icon.className = "activity-event-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "↥";
        const copy = document.createElement("div");
        copy.className = "activity-event-copy";
        const title = document.createElement("span");
        title.className = "activity-event-title";
        const link = makeLink(commit.url, commit.message);
        link.className = "activity-event-link";
        title.append(link);
        const meta = document.createElement("span");
        meta.className = "activity-event-meta";
        meta.textContent = commit.repo.name.split("/").pop() + " · " + relativeTime(commit.created_at);
        copy.append(title, meta);
        item.append(icon, copy);
        list.append(item);
      });
      state.textContent = "LIVE · RECENT COMMITS";
    } catch (error) {
      list.replaceChildren();
      const item = document.createElement("li");
      item.className = "activity-feed-empty";
      item.textContent = "Public activity couldn't be loaded right now. Use the profile links below to view repositories and commits.";
      list.append(item);
      state.textContent = "OPEN GITHUB";
    }
  };
  const loadEvents = async () => {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 8000) : null;
    try {
      const options = { headers: { Accept: "application/vnd.github+json" }, cache: "no-store" };
      if (controller) options.signal = controller.signal;
      const results = await Promise.allSettled(feeds.map(async (feed) => {
        const response = await fetch(feed.url, options);
        if (!response.ok) throw new Error("GitHub API returned " + response.status);
        const events = await response.json();
        if (!Array.isArray(events)) throw new Error("Unexpected GitHub events response");
        return events;
      }));
      const events = [];
      let failedCount = 0;
      results.forEach((result) => {
        if (result.status === "fulfilled") events.push(...result.value);
        else failedCount++;
      });
      if (!renderEvents(events, failedCount)) {
        await renderRecentCommits();
      }
    } catch (error) {
      await renderRecentCommits();
    } finally {
      if (timeout !== null) window.clearTimeout(timeout);
    }
  };
  loadEvents();
  window.setInterval(loadEvents, 300000);

  const graph = document.querySelector(".contribution-graph-link");
  const graphDisplay = document.querySelector("#contribution-graph-display");
  const graphFallback = document.querySelector(".contribution-graph-fallback");
  const graphTotal = document.querySelector("#contribution-graph-total");
  if (graph && graphDisplay && graphFallback) {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const showFallback = () => {
      graphDisplay.hidden = true;
      graphFallback.hidden = false;
      graphFallback.textContent = "Contribution calendar unavailable right now. Open the profile for current activity.";
      graph.classList.add("graph-unavailable");
    };
    const renderContributions = (contributions) => {
      const dayMs = 86400000;
      const entries = contributions.map((item) => {
        const date = new Date(`${item.date}T00:00:00Z`);
        if (!Number.isFinite(date.getTime())) return null;
        return {
          date,
          count: Math.max(0, Number(item.count) || 0),
          level: Math.max(0, Math.min(4, Number(item.level) || 0))
        };
      }).filter(Boolean);
      if (!entries.length) throw new Error("No contribution days returned");
      const first = entries[0].date;
      const last = entries[entries.length - 1].date;
      const start = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), first.getUTCDate() - first.getUTCDay()));
      const columns = Math.ceil((Math.floor((last.getTime() - start.getTime()) / dayMs) + 1) / 7);
      const step = 12, cell = 9, left = 27, top = 17;
      const width = left + columns * step;
      const height = top + 7 * step + 5;
      const total = entries.reduce((sum, item) => sum + item.count, 0);
      const colors = ["#171d25", "#35404b", "#66727d", "#a5adb5", "#e1e4e7"];
      const svg = document.createElementNS(svgNamespace, "svg");
      svg.setAttribute("class", "contribution-calendar-svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("role", "img");
      svg.setAttribute("aria-label", `${total.toLocaleString()} GitHub contributions in the last year`);
      svg.setAttribute("focusable", "false");
      const title = document.createElementNS(svgNamespace, "title");
      title.textContent = `${total.toLocaleString()} GitHub contributions in the last year`;
      svg.appendChild(title);
      const labels = ["", "Mon", "", "Wed", "", "Fri", ""];
      labels.forEach((label, row) => {
        if (!label) return;
        const text = document.createElementNS(svgNamespace, "text");
        text.setAttribute("x", "0");
        text.setAttribute("y", String(top + row * step + 8));
        text.setAttribute("class", "contribution-calendar-label");
        text.textContent = label;
        svg.appendChild(text);
      });
      let lastMonth = "";
      let lastMonthColumn = -5;
      const monthFormat = new Intl.DateTimeFormat(undefined, { month: "short", timeZone: "UTC" });
      for (const item of entries) {
        const offset = Math.floor((item.date.getTime() - start.getTime()) / dayMs);
        const column = Math.floor(offset / 7);
        const row = item.date.getUTCDay();
        const monthKey = `${item.date.getUTCFullYear()}-${item.date.getUTCMonth()}`;
        if (monthKey !== lastMonth && column - lastMonthColumn >= 2) {
          const month = document.createElementNS(svgNamespace, "text");
          month.setAttribute("x", String(left + column * step));
          month.setAttribute("y", "10");
          month.setAttribute("class", "contribution-calendar-label");
          month.textContent = monthFormat.format(item.date).toUpperCase();
          svg.appendChild(month);
          lastMonth = monthKey;
          lastMonthColumn = column;
        }
        const rect = document.createElementNS(svgNamespace, "rect");
        rect.setAttribute("x", String(left + column * step));
        rect.setAttribute("y", String(top + row * step));
        rect.setAttribute("width", String(cell));
        rect.setAttribute("height", String(cell));
        rect.setAttribute("rx", "2");
        rect.setAttribute("fill", colors[item.level]);
        const detail = document.createElementNS(svgNamespace, "title");
        detail.textContent = `${item.count} contribution${item.count === 1 ? "" : "s"} on ${item.date.toISOString().slice(0, 10)}`;
        rect.appendChild(detail);
        svg.appendChild(rect);
      }
      graphDisplay.replaceChildren(svg);
      graphDisplay.hidden = false;
      graphFallback.hidden = true;
      graph.classList.remove("graph-unavailable");
      if (graphTotal) graphTotal.textContent = `${total.toLocaleString()} / LAST YEAR`;
      graphDisplay.setAttribute("aria-label", `${total.toLocaleString()} GitHub contributions in the last year`);
    };
    const loadContributions = async () => {
      const controller = typeof AbortController === "function" ? new AbortController() : null;
      const timeout = controller ? window.setTimeout(() => controller.abort(), 9000) : null;
      try {
        const options = { headers: { Accept: "application/json" }, cache: "force-cache" };
        if (controller) options.signal = controller.signal;
        const response = await fetch("https://github-contributions-api.jogruber.de/v4/PauzeDevs?y=last", options);
        if (!response.ok) throw new Error(`Contribution service returned ${response.status}`);
        const payload = await response.json();
        if (!Array.isArray(payload.contributions)) throw new Error("Invalid contribution response");
        renderContributions(payload.contributions);
      } catch (error) {
        showFallback();
      } finally {
        if (timeout !== null) window.clearTimeout(timeout);
      }
    };
    void loadContributions();
  }
})();


/* Load the arcade engine only when its section is approaching the viewport. */
(() => {
  const arcadeStage = document.querySelector("#dino-stage");
  if (!arcadeStage) return;
  let loaded = false;
  const loadArcade = () => {
    if (loaded) return;
    loaded = true;
    import("./arcade.js").catch(() => {
      const state = document.querySelector("#dino-state");
      if (state) state.textContent = "ARCADE TEMPORARILY UNAVAILABLE";
    });
    observer?.disconnect();
  };
  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadArcade();
      }, { rootMargin: "320px 0px" })
    : null;
  if (observer) observer.observe(arcadeStage);
  else loadArcade();
})();

/* Website cost estimator: transparent indicative ranges, calculated locally. */
(() => {
  const form = document.querySelector("#webdev-estimator-form");
  const typeSelect = document.querySelector("#webdev-type");
  const pagesSelect = document.querySelector("#webdev-pages");
  const estimate = document.querySelector("#webdev-estimate");
  const summary = document.querySelector("#webdev-estimate-summary");
  if (!form || !typeSelect || !pagesSelect || !estimate || !summary) return;

  const siteTypes = {
    landing: { label: "Landing page", low: 3500, high: 6000, included: 1 },
    portfolio: { label: "Portfolio / personal brand", low: 4500, high: 8000, included: 4 },
    business: { label: "Business website", low: 6500, high: 12000, included: 5 },
    store: { label: "Online store / e-commerce", low: 15000, high: 30000, included: 5 }
  };
  const features = {
    contact: { label: "Contact form", low: 800, high: 1800 },
    booking: { label: "Booking / appointment requests", low: 1500, high: 3500 },
    cms: { label: "Editable content / CMS", low: 2500, high: 5000 },
    motion: { label: "Custom animations", low: 800, high: 2000 },
    seo: { label: "SEO basics", low: 1000, high: 2500 },
    payments: { label: "Online payments", low: 2000, high: 4500 }
  };
  const money = (amount) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(amount);
  const selectedFeatures = () => [...form.querySelectorAll('input[name="feature"]:checked')]
    .map((input) => features[input.value] ? input.value : null).filter(Boolean);

  const calculate = () => {
    const site = siteTypes[typeSelect.value] || siteTypes.landing;
    const pages = Math.max(1, Number(pagesSelect.value) || 1);
    const extraPages = Math.max(0, pages - site.included);
    let low = site.low + extraPages * 700;
    let high = site.high + extraPages * 1200;
    const selected = selectedFeatures();
    selected.forEach((key) => { low += features[key].low; high += features[key].high; });
    estimate.textContent = low === high ? money(low) : money(low) + " – " + money(high);
    const pageLabel = pages === 1 ? "1 page" : pages === 3 ? "2–3 pages" : pages === 5 ? "4–5 pages" : pages === 8 ? "6–8 pages" : "9–10 pages";
    summary.textContent = site.label + " · " + pageLabel + (selected.length ? " · " + selected.length + " extra feature" + (selected.length > 1 ? "s" : "") : " · core responsive design");
    return { site, pages, pageLabel, selected, low, high };
  };

  typeSelect.addEventListener("change", calculate);
  pagesSelect.addEventListener("change", calculate);
  form.querySelectorAll('input[name="feature"]').forEach((input) => input.addEventListener("change", calculate));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = calculate();
    const selectedLabels = result.selected.length
      ? result.selected.map((key) => features[key].label).join(", ")
      : "No extra features selected";
    const subject = "Website project enquiry — Pauze";
    const body = [
      "Hi Pauze,",
      "",
      "I'd like to discuss getting a website made.",
      "",
      "Website type: " + result.site.label,
      "Pages: " + result.pageLabel,
      "Extra features: " + selectedLabels,
      "Current estimate: " + money(result.low) + " – " + money(result.high),
      "",
      "My business / idea:",
      "",
      "Preferred timeline:",
      "",
      "Please let me know the next steps and a tailored quote.",
      "",
      "I understand this is an indicative estimate; final scope and price will be agreed before work begins."
    ].join("\n");
    window.location.href = "mailto:githubpauze@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  });
  calculate();
})();

/* Pauze direct UPI support: amount selection opens a dedicated payment page. */
(() => {
  const section = document.querySelector("#support");
  if (!section) return;
  const custom = section.querySelector("#support-custom");
  const generate = section.querySelector("#support-generate");
  const presets = [...section.querySelectorAll("[data-support-amount]")];
  let selectedAmount = 99;

  const selectAmount = (amount) => {
    selectedAmount = amount;
    custom.value = "";
    presets.forEach((button) => {
      const selected = Number(button.dataset.supportAmount) === amount;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  };

  presets.forEach((button) => button.addEventListener("click", () => {
    selectAmount(Number(button.dataset.supportAmount));
  }));

  custom.addEventListener("input", () => {
    selectedAmount = null;
    presets.forEach((button) => {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    });
  });

  generate.addEventListener("click", () => {
    const raw = custom.value.trim();
    const amount = raw ? Number(raw) : selectedAmount;
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 100000) {
      custom.setCustomValidity("Enter a whole amount between ₹1 and ₹1,00,000.");
      custom.reportValidity();
      custom.setCustomValidity("");
      custom.focus();
      return;
    }
    window.location.href = "/support-payment.html?amount=" + encodeURIComponent(String(amount));
  });

  selectAmount(99);
})();
