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
    return winnerScore >= 100 ? winner : null;
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
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const timeout = controller ? window.setTimeout(() => controller.abort(), 8000) : null;
    try {
      const requestOptions = {
        headers: { Accept: "application/vnd.github+json" },
        cache: "no-store"
      };
      if (controller) requestOptions.signal = controller.signal;
      const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, requestOptions);
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`);
      const events = await response.json();
      if (!Array.isArray(events)) throw new Error("Unexpected GitHub events response");
      renderEvents(events);
    } catch (error) {
      list.replaceChildren();
      const item = document.createElement("li");
      item.textContent = "Live activity couldn't load. Open the GitHub profile to see the latest updates.";
      list.append(item);
      state.textContent = "TEMPORARILY UNAVAILABLE";
    } finally {
      if (timeout !== null) window.clearTimeout(timeout);
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


/* PAUZE ARCADE: six standalone canvas games */
(()=>{
 const cv=document.querySelector("#dino-canvas"),stage=document.querySelector("#dino-stage"),overlay=document.querySelector("#dino-overlay"),picker=document.querySelector(".arcade-game-picker"),touch=document.querySelector("#arcade-touch-controls"),start=document.querySelector("#dino-start"),restart=document.querySelector("#dino-restart");
 const heading=document.querySelector("#arcade-game-title"),status=document.querySelector("#dino-state"),scoreEl=document.querySelector("#dino-score"),bestEl=document.querySelector("#dino-best"),modeEl=document.querySelector("#arcade-mode-label"),modeVal=document.querySelector("#arcade-mode-value"),help=document.querySelector("#arcade-instructions"),overTitle=document.querySelector("#dino-overlay-title"),overCopy=document.querySelector("#dino-overlay-copy");
 if(!cv||!stage||!overlay||!picker||!start)return;const c=cv.getContext("2d");if(!c){overTitle.textContent="GAME UNAVAILABLE";start.hidden=true;return;}
 const W=900,H=260,G=218,ink="#17121f",muted="#786c82",purple="#6656ff",green="#d8f99d",pink="#ffc7e8",yellow="#fff08b",white="#fffdf8",blue="#bdeaff",bgc="#f3eaff";
 const config={
 dino:["DINO RUN / ENDLESS MODE","Jump obstacles and beat your best score.","START RUN","SPACE / ↑ JUMP • ↓ DUCK • P PAUSE","SPEED",[["jump","JUMP ↑"],["duck","DUCK ↓"]]],
 snake:["SNAKE.EXE / SURVIVAL MODE","Eat the data. Grow the line. Avoid yourself and the walls.","START SNAKE","ARROWS / WASD MOVE • P PAUSE","PACE",[["up","UP ↑"],["left","← LEFT"],["down","DOWN ↓"],["right","RIGHT →"]]],
 space:["SPACE PROTOCOL / DEFENCE MODE","Shoot the incoming signals before they reach your ship.","DEPLOY SHIP","← / → MOVE • SPACE / X FIRE • P PAUSE","WAVE",[["left","← LEFT"],["fire","FIRE ✦"],["right","RIGHT →"]]],
 breakout:["BREAKPOINT / BRICK MODE","Keep the ball alive and break every block.","START BREAKOUT","← / → OR A / D MOVE PADDLE • P PAUSE","LEVEL",[["left","← LEFT"],["right","RIGHT →"]]],
 memory:["MEMORY LEAK / MATCH MODE","Find all eight pairs. Fewer turns means a cleaner system.","OPEN MEMORY","TAP / CLICK TWO CARDS TO FIND A MATCH","PAIRS",[]],
 pong:["PING.EXE / PLAYER VS CPU","Beat the CPU to five points. Keep the paddle ready.","START MATCH","↑ / ↓ OR W / S MOVE • FIRST TO 5 WINS","CPU",[["up","UP ↑"],["down","DOWN ↓"]]]
 };
 let game="dino",s=null,score=0,best=0,time=0,last=0,raf=0,running=false,paused=false,ended=false;
 const k={left:false,right:false,up:false,down:false,duck:false},rnd=(a,b)=>Math.random()*(b-a)+a,fmt=n=>String(Math.max(0,Math.floor(n))).padStart(5,"0"),storage=()=>"pauze-arcade-"+game+"-best-v1";
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
 const txt=(v,x,y,size,col=muted,align="left")=>{c.fillStyle=col;c.font="700 "+size+"px monospace";c.textAlign=align;c.fillText(v,x,y);};
 const background=col=>rect(0,0,W,H,col||bgc);
 const show=(tag,title,copy,button)=>{overlay.querySelector(".dino-overlay-label").textContent=tag;overTitle.textContent=title;overCopy.textContent=copy;start.textContent=button+" ↗";overlay.hidden=false;};
 const hide=()=>overlay.hidden=true,stat=v=>status.textContent=v,clearKeys=()=>Object.keys(k).forEach(a=>k[a]=false);
 const bestRead=()=>{try{return Math.max(0,Number(localStorage.getItem(storage()))||0);}catch{return 0;}};
 const stats=()=>{scoreEl.textContent=fmt(game==="pong"&&s?s.you:score);bestEl.textContent=fmt(best);
  modeVal.textContent=game==="dino"?(s?(s.speed/300).toFixed(1):"1.0")+"×":game==="snake"?(1+Math.floor(score/50))+"×":game==="space"?String(s?s.wave:1).padStart(2,"0"):game==="breakout"?String(s?s.level:1).padStart(2,"0"):game==="memory"?(s?s.pairs:0)+"/8":(s?s.cpu:0)+"/5";};
 const save=()=>{if(score>best){best=score;try{localStorage.setItem(storage(),String(score));}catch{}}};
 const finish=(title,copy,state)=>{running=false;paused=false;ended=true;save();stats();stat(state||"GAME OVER");show("SESSION ENDED",title,copy,"PLAY AGAIN");stage.focus({preventScroll:true});};
 const bricks=()=>{let a=[],cols=14,w=48,gap=8,left=(W-(cols*w+(cols-1)*gap))/2,rows=Math.min(3+s.level,6),colors=[pink,blue,yellow,green,"#ffd5a8",purple];for(let r=0;r<rows;r++)for(let col=0;col<cols;col++)a.push({x:left+col*(w+gap),y:34+r*19,w,h:12,on:true,col:colors[r%colors.length]});return a;};
 const food=()=>{let p;do{p={x:Math.floor(rnd(0,s.cols)),y:Math.floor(rnd(0,s.rows))};}while(s.body.some(b=>b.x===p.x&&b.y===p.y));return p;};
 const reset=()=>{
  score=0;time=0;last=0;ended=false;paused=false;clearKeys();best=bestRead();
  if(game==="dino")s={x:95,y:G-38,w:34,h:38,vy:0,on:true,obs:[],spawn:.9,speed:300};
  if(game==="snake"){s={cell:20,cols:45,rows:13,body:[{x:12,y:6},{x:11,y:6},{x:10,y:6}],dir:{x:1,y:0},next:{x:1,y:0},tick:0,food:null};s.food=food();}
  if(game==="space")s={x:W/2,shots:[],foes:[],spawn:.5,cool:0,wave:1};
  if(game==="breakout"){s={paddle:W/2,ball:{x:W/2,y:205,vx:230,vy:-210,r:6},level:1,lives:3,bricks:[]};s.bricks=bricks();}
  if(game==="memory"){let vals=["⌘","⌁","⟡","⌬","⏣","⎔","⧉","◈"],cards=vals.concat(vals).map(v=>({v,open:false,done:false}));for(let i=cards.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}s={cards,a:-1,b:-1,lock:0,pairs:0,turns:0};}
  if(game==="pong")s={y:H/2,cpuY:H/2,x:W/2,ballY:H/2,vx:-220,vy:rnd(-110,110),you:0,cpu:0,ph:64};
  stats();draw();stat("READY?");
 };
 const jump=()=>{if(game==="dino"&&running&&!paused&&s.on){s.vy=-650;s.on=false;}};
 const fire=()=>{if(game==="space"&&running&&!paused&&s.cool<=0){s.shots.push({x:s.x,y:220});s.cool=.2;}};
 const flip=i=>{if(game!=="memory"||!running||paused||ended||time<s.lock)return;const card=s.cards[i];if(!card||card.done||card.open)return;card.open=true;if(s.a<0){s.a=i;return;}s.b=i;s.turns++;const a=s.cards[s.a],b=s.cards[s.b];if(a.v===b.v){a.done=b.done=true;s.pairs++;score+=10;s.a=s.b=-1;stats();if(s.pairs===8)finish("MEMORY CLEAN.","All eight pairs found in "+s.turns+" turns. No leaks detected.","SYSTEM CLEAR");}else s.lock=time+.7;};
 const update=dt=>{
  time+=dt;
  if(game==="dino"){
   s.speed=Math.min(650,300+time*7+score*.035);score+=dt*10;s.spawn-=dt;
   if(s.spawn<=0){let h=rnd(28,50);s.obs.push({x:W+8,h,w:18});s.spawn=Math.max(.58,rnd(.95,1.8)-(s.speed-300)/650);}
   s.obs.forEach(o=>o.x-=s.speed*dt);s.obs=s.obs.filter(o=>o.x+o.w>0);
   if(!s.on){s.vy+=1750*dt;s.y+=s.vy*dt;if(s.y>=G-s.h){s.y=G-s.h;s.vy=0;s.on=true;}}
   s.duck=k.duck&&s.on;if(s.obs.some(o=>s.x+26>o.x&&s.x+5<o.x+o.w&&s.y+s.h>G-o.h+3)){finish("OOPS. RUN OVER.","Score "+fmt(score)+". One more run?","RUN ENDED");return;}stats();
  }else if(game==="snake"){
   s.tick+=dt;if(s.tick>=Math.max(.065,.14-score*.0004)){s.tick=0;s.dir=s.next;const h={x:s.body[0].x+s.dir.x,y:s.body[0].y+s.dir.y};
    if(h.x<0||h.x>=s.cols||h.y<0||h.y>=s.rows||s.body.some((p,i)=>i<s.body.length-1&&p.x===h.x&&p.y===h.y)){finish("SYSTEM CRASH.","Score "+fmt(score)+". The line hit a wall or itself.","GAME OVER");return;}
    s.body.unshift(h);if(h.x===s.food.x&&h.y===s.food.y){score+=10;s.food=food();stats();}else s.body.pop();
   }
  }else if(game==="space"){
   if(k.left)s.x-=350*dt;if(k.right)s.x+=350*dt;s.x=Math.max(22,Math.min(W-22,s.x));s.cool-=dt;s.spawn-=dt;
   if(s.spawn<=0){s.foes.push({x:rnd(25,W-25),y:-12,size:rnd(12,19),speed:rnd(65,102)});s.spawn=Math.max(.28,.78-Math.floor(score/100)*.025);}
   s.wave=1+Math.floor(score/100);s.shots.forEach(b=>b.y-=440*dt);s.shots=s.shots.filter(b=>b.y>0);
   for(let i=s.foes.length-1;i>=0;i--){let f=s.foes[i];f.y+=f.speed*dt;let hit=s.shots.findIndex(b=>Math.abs(b.x-f.x)<f.size+3&&Math.abs(b.y-f.y)<f.size+3);
    if(hit>=0){s.shots.splice(hit,1);s.foes.splice(i,1);score+=10;stats();continue;}
    if(f.y>H-7||(Math.abs(f.x-s.x)<f.size+15&&f.y>190)){finish("SIGNAL LOST.","Score "+fmt(score)+". The defence line was breached.","MISSION ENDED");return;}
   }
  }else if(game==="breakout"){
   if(k.left)s.paddle-=410*dt;if(k.right)s.paddle+=410*dt;s.paddle=Math.max(65,Math.min(W-65,s.paddle));const b=s.ball;b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(b.x<b.r||b.x>W-b.r)b.vx*=-1;if(b.y<b.r+6)b.vy=Math.abs(b.vy);
   if(b.vy>0&&b.y+b.r>=240&&b.y<=248&&Math.abs(b.x-s.paddle)<65){b.vy=-Math.abs(b.vy);b.vx=(b.x-s.paddle)*3.5;b.y=234;}
   for(const br of s.bricks){if(br.on&&b.x+b.r>br.x&&b.x-b.r<br.x+br.w&&b.y+b.r>br.y&&b.y-b.r<br.y+br.h){br.on=false;score+=10;b.vy*=-1;stats();break;}}
   if(b.y>H+8){s.lives--;if(s.lives<=0){finish("BALL DROPPED.","Score "+fmt(score)+". Keep the rally alive next time.","GAME OVER");return;}b.x=s.paddle;b.y=207;b.vx=rnd(-180,180);b.vy=-220;}
   if(s.bricks.every(br=>!br.on)){s.level++;s.bricks=bricks();b.vx*=1.08;b.vy*=1.08;}
  }else if(game==="memory"){
   if(s.b>=0&&time>=s.lock){s.cards[s.a].open=false;s.cards[s.b].open=false;s.a=s.b=-1;}
  }else if(game==="pong"){
   if(k.up)s.y-=360*dt;if(k.down)s.y+=360*dt;s.y=Math.max(36,Math.min(H-36,s.y));const d=s.ballY-s.cpuY;if(Math.abs(d)>4)s.cpuY+=Math.sign(d)*Math.min(Math.abs(d),210*dt);s.cpuY=Math.max(36,Math.min(H-36,s.cpuY));
   s.x+=s.vx*dt;s.ballY+=s.vy*dt;if(s.ballY<7||s.ballY>H-7)s.vy*=-1;
   if(s.vx<0&&s.x<46&&Math.abs(s.ballY-s.y)<s.ph/2+7){s.x=47;s.vx=Math.abs(s.vx)*1.04;s.vy+=(s.ballY-s.y)*2;}
   if(s.vx>0&&s.x>W-46&&Math.abs(s.ballY-s.cpuY)<s.ph/2+7){s.x=W-47;s.vx=-Math.abs(s.vx)*1.02;s.vy+=(s.ballY-s.cpuY)*1.5;}
   if(s.x>W+8||s.x<-8){if(s.x>W){s.you++;score=s.you;}else s.cpu++;stats();if(s.you>=5){finish("PING CONFIRMED.","You beat the CPU "+s.you+"–"+s.cpu+". Connection stable.","YOU WIN");return;}if(s.cpu>=5){finish("CONNECTION LOST.","The CPU won "+s.cpu+"–"+s.you+". Run it back.","CPU WINS");return;}s.x=W/2;s.ballY=H/2;s.vx=s.you>s.cpu?-230:230;s.vy=rnd(-130,130);}
  }
 };
 const draw=()=>{
  if(!s)return;
  if(game==="dino"){
   background();rect(764,25,34,34,yellow);rect(0,G,W,3,ink);for(let x=0;x<W;x+=44)rect(x-(time*s.speed%44),230,15,3,"#b4a1ce");
   s.obs.forEach(o=>{rect(o.x,G-o.h,5,o.h,green);rect(o.x+5,G-o.h+7,13,5,green);rect(o.x+8,G-o.h+15,5,o.h-15,green);});
   rect(s.x+5,s.y+9,24,25,ink);rect(s.x+18,s.y,17,18,ink);rect(s.x+28,s.y+7,13,8,ink);rect(s.x+23,s.y+4,4,4,white);rect(s.x+7,s.y+31,7,7,ink);rect(s.x+20,s.y+31,7,7,ink);txt("PAUZE / RUNNER",W-18,24,12,muted,"right");
  }else if(game==="snake"){
   background("#f7f1ff");rect(0,0,W,H,"#eee2fb");for(let x=0;x<s.cols;x++)for(let y=0;y<s.rows;y++)rect(x*s.cell,y*s.cell,1,1,"#dfd1f1");
   rect(s.food.x*s.cell+4,s.food.y*s.cell+4,12,12,pink);s.body.forEach((p,i)=>{rect(p.x*s.cell+1,p.y*s.cell+1,18,18,i?green:purple);if(!i){rect(p.x*s.cell+5,p.y*s.cell+5,3,3,white);rect(p.x*s.cell+12,p.y*s.cell+5,3,3,white);}});
  }else if(game==="space"){
   background("#eee8ff");for(let i=0;i<55;i++)rect((i*167+31)%W,(i*47+19)%H,2,2,"#c7b5e5");s.shots.forEach(b=>rect(b.x-2,b.y-8,4,12,purple));
   s.foes.forEach(f=>{rect(f.x-f.size,f.y-f.size,f.size*2,f.size*2,pink);rect(f.x-7,f.y-2,14,5,ink);});rect(s.x-4,204,8,25,ink);rect(s.x-14,214,28,13,purple);rect(s.x-8,208,16,9,blue);txt("DEFENCE / WAVE "+s.wave,W-18,23,11,muted,"right");
  }else if(game==="breakout"){
   background("#f7f1ff");rect(16,12,W-32,H-24,"#eee5fb");s.bricks.forEach(b=>{if(b.on){rect(b.x,b.y,b.w,b.h,b.col);rect(b.x,b.y,b.w,2,ink);}});
   rect(s.paddle-58,240,116,8,ink);rect(s.paddle-16,242,32,4,yellow);rect(s.ball.x-s.ball.r,s.ball.y-s.ball.r,s.ball.r*2,s.ball.r*2,purple);txt("LIVES / "+s.lives,W-22,H-12,10,muted,"right");
  }else if(game==="memory"){
   background();txt("MEMORY / MATCH THE PAIRS",W/2,18,10,muted,"center");const cw=125,ch=40,gx=14,gy=11,left=(W-(cw*4+gx*3))/2,top=29,icons=["⌘","⌁","⟡","⌬","⏣","⎔","⧉","◈"];
   s.cards.forEach((a,i)=>{const x=left+(i%4)*(cw+gx),y=top+Math.floor(i/4)*(ch+gy);rect(x+2,y+3,cw,ch,ink);rect(x,y,cw,ch,a.done?green:a.open?yellow:white);rect(x,y,cw,3,ink);txt(a.done||a.open?a.v:icons[i%8],x+cw/2,y+27,a.done||a.open?23:17,a.done||a.open?ink:"#b5a8c5","center");});txt("TURNS / "+s.turns,W/2,H-8,10,muted,"center");
  }else if(game==="pong"){
   background("#f1e9ff");for(let y=12;y<H;y+=19)rect(W/2-2,y,4,10,"#cbbce2");rect(20,s.y-s.ph/2,11,s.ph,purple);rect(W-31,s.cpuY-s.ph/2,11,s.ph,ink);rect(s.x-6,s.ballY-6,12,12,pink);txt(String(s.you),W/2-42,40,20,ink,"center");txt(String(s.cpu),W/2+42,40,20,ink,"center");txt("YOU",40,22,9,muted);txt("CPU",W-40,22,9,muted,"right");
  }
 };
 const loop=t=>{if(!running||paused)return;if(!last)last=t;const dt=Math.min(.032,(t-last)/1000||0);last=t;update(dt);draw();if(running&&!paused)raf=requestAnimationFrame(loop);};
 const startGame=()=>{cancelAnimationFrame(raf);reset();running=true;paused=false;ended=false;hide();stat("IN SESSION");stage.focus({preventScroll:true});raf=requestAnimationFrame(loop);};
 const resume=()=>{paused=false;running=true;last=0;hide();stat("IN SESSION");stage.focus({preventScroll:true});raf=requestAnimationFrame(loop);};
 const pause=()=>{if(!running||ended)return;paused=true;stat("PAUSED");show("PAUSED / TAKE A BREATHER","GAME PAUSED","Press P or tap resume when you are ready.","RESUME");};
 const choose=id=>{
  if(!config[id])return;cancelAnimationFrame(raf);running=false;paused=false;game=id;heading.textContent=config[id][0];modeEl.textContent=config[id][4];help.textContent=config[id][3];
  picker.querySelectorAll("[data-arcade-game]").forEach(b=>{const on=b.dataset.arcadeGame===id;b.classList.toggle("is-active",on);b.setAttribute("aria-pressed",String(on));});
  touch.replaceChildren();config[id][5].forEach(([action,caption])=>{const b=document.createElement("button");b.type="button";b.textContent=caption;b.addEventListener("pointerdown",e=>{
   e.preventDefault();if(!running||paused||ended)return;if(game==="dino"&&action==="jump"){jump();return;}if(game==="space"&&action==="fire"){fire();return;}
   if(game==="snake"){const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[action];if(d&&!(s.dir.x+d[0]===0&&s.dir.y+d[1]===0))s.next={x:d[0],y:d[1]};return;}if(["left","right","up","down","duck"].includes(action))k[action]=true;
  });["pointerup","pointercancel","pointerleave"].forEach(ev=>b.addEventListener(ev,()=>{if(["left","right","up","down","duck"].includes(action))k[action]=false;}));touch.append(b);});
  reset();const names={dino:"LET’S RUN.",snake:"GROW THE LINE.",space:"DEFEND THE SIGNAL.",breakout:"BREAK THE BLOCKS.",memory:"CLEAR YOUR CACHE.",pong:"PING THE CPU."};show("CHOOSE YOUR CHALLENGE",names[id],config[id][1],config[id][2]);draw();
 };
 const keydown=e=>{
  if(!["Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","KeyA","KeyD","KeyW","KeyS","KeyP","KeyX","Enter"].includes(e.code))return;
  if(e.target.closest&&e.target.closest("button,a,input,textarea,select"))return;
  if(["Space","ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.code))e.preventDefault();
  if(e.code==="KeyP"&&(running||paused)){paused?resume():pause();return;}
  if(!running&&!paused&&!ended&&(e.code==="Enter"||e.code==="Space")){startGame();return;}if(paused&&(e.code==="Enter"||e.code==="Space")){resume();return;}if(!running||paused||ended)return;
  if(game==="dino"){if(e.code==="Space"||e.code==="ArrowUp")jump();if(e.code==="ArrowDown")k.duck=true;}
  if(game==="snake"){const d={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]}[e.code];if(d&&!(s.dir.x+d[0]===0&&s.dir.y+d[1]===0))s.next={x:d[0],y:d[1]};}
  if(game==="space"){if(e.code==="ArrowLeft"||e.code==="KeyA")k.left=true;if(e.code==="ArrowRight"||e.code==="KeyD")k.right=true;if(e.code==="Space"||e.code==="KeyX")fire();}
  if(game==="breakout"){if(e.code==="ArrowLeft"||e.code==="KeyA")k.left=true;if(e.code==="ArrowRight"||e.code==="KeyD")k.right=true;}
  if(game==="pong"){if(e.code==="ArrowUp"||e.code==="KeyW")k.up=true;if(e.code==="ArrowDown"||e.code==="KeyS")k.down=true;}
 };
 const keyup=e=>{if(e.code==="ArrowLeft"||e.code==="KeyA")k.left=false;if(e.code==="ArrowRight"||e.code==="KeyD")k.right=false;if(e.code==="ArrowUp"||e.code==="KeyW")k.up=false;if(e.code==="ArrowDown"||e.code==="KeyS"){k.down=false;k.duck=false;}};
 const memoryClick=e=>{const r=cv.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height,cw=125,ch=40,gx=14,gy=11,left=(W-(cw*4+gx*3))/2,top=29;for(let i=0;i<s.cards.length;i++){const cx=left+(i%4)*(cw+gx),cy=top+Math.floor(i/4)*(ch+gy);if(x>=cx&&x<=cx+cw&&y>=cy&&y<=cy+ch){flip(i);break;}}};
  picker.querySelectorAll("[data-arcade-game]").forEach(b=>b.addEventListener("click",()=>choose(b.dataset.arcadeGame)));
  start.addEventListener("click",()=>{if(paused)resume();else startGame();});restart.addEventListener("click",startGame);
  window.addEventListener("keydown",e=>{if(stage.contains(document.activeElement)||!(e.target.closest&&e.target.closest("button,a,input,textarea,select")))keydown(e);});window.addEventListener("keyup",keyup);
  stage.addEventListener("pointerdown",e=>{if(!running||paused||ended)return;if(game==="dino")jump();if(game==="space")fire();if(game==="memory")memoryClick(e);});
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&running&&!paused)pause();});window.addEventListener("blur",clearKeys);window.addEventListener("resize",draw);
  choose("dino");
})();
