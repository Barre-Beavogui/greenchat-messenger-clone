(() => {
  "use strict";

  const STORAGE_KEY = "greenchat-state-v1";
  const AUTO_REPLY_DELAY = 700;
  const RECORDING_DELAY = 1300;

  const colors = ["green", "teal", "blue", "amber", "purple", "red"];

  function makeSeed() {
    const base = Date.now();
    return {
      activeView: "chats",
      activeChatId: "family",
      filter: "all",
      query: "",
      detailsOpen: true,
      profile: {
        name: "Tesla Beavogui",
        phone: "+33 6 12 34 56 78",
        initials: "TB",
      },
      chats: [
        {
          id: "family",
          name: "Famille",
          phone: "Groupe",
          initials: "FA",
          color: "green",
          presence: "5 membres, 2 en ligne",
          group: true,
          pinned: true,
          favorite: true,
          unread: 3,
          media: 7,
          messages: [
            message("system", "Groupe cree localement. Les donnees restent dans ce navigateur.", base - 1000 * 60 * 90),
            message("them", "Tu peux m'envoyer les documents ce soir ?", base - 1000 * 60 * 66),
            message("me", "Oui, je les prepare et je t'envoie ca.", base - 1000 * 60 * 62),
            message("them", "Parfait, merci.", base - 1000 * 60 * 30),
          ],
        },
        {
          id: "crash-room",
          name: "Cellule incident",
          phone: "+33 6 27 44 10 90",
          initials: "CI",
          color: "red",
          presence: "en ligne",
          group: false,
          pinned: false,
          favorite: true,
          unread: 1,
          media: 4,
          messages: [
            message("them", "Le crash arrive quand l'app sort du plein ecran.", base - 1000 * 60 * 230),
            message("me", "Je recode une version web locale avec les actions UI isolees.", base - 1000 * 60 * 226),
            message("system", "Signature: SIGTRAP sur main thread pendant une transition AppKit.", base - 1000 * 60 * 220),
          ],
        },
        {
          id: "amina",
          name: "Amina Diallo",
          phone: "+33 7 19 63 80 22",
          initials: "AD",
          color: "purple",
          presence: "vue aujourd'hui a 00:14",
          group: false,
          pinned: false,
          favorite: false,
          unread: 0,
          media: 12,
          messages: [
            message("them", "On se voit demain ?", base - 1000 * 60 * 180),
            message("me", "Oui, appelle-moi avant de partir.", base - 1000 * 60 * 174),
          ],
        },
        {
          id: "school",
          name: "Projet ecole",
          phone: "Groupe",
          initials: "PE",
          color: "blue",
          presence: "8 membres",
          group: true,
          pinned: false,
          favorite: false,
          unread: 0,
          media: 5,
          messages: [
            message("them", "La maquette est prete pour test.", base - 1000 * 60 * 340),
            message("me", "Je regarde et je te fais un retour.", base - 1000 * 60 * 332),
          ],
        },
        {
          id: "moussa",
          name: "Moussa K.",
          phone: "+224 622 18 44 09",
          initials: "MK",
          color: "amber",
          presence: "en ligne",
          group: false,
          pinned: false,
          favorite: false,
          unread: 0,
          media: 2,
          messages: [
            message("them", "J'ai recu ton message vocal.", base - 1000 * 60 * 530),
            message("me", "Top, je te rappelle plus tard.", base - 1000 * 60 * 528),
          ],
        },
      ],
      statuses: [
        { id: "me", name: "Mon statut", initials: "TB", color: "teal", meta: "Ajouter une mise a jour", mine: true },
        { id: "amina-status", name: "Amina Diallo", initials: "AD", color: "purple", meta: "Aujourd'hui a 00:10" },
        { id: "moussa-status", name: "Moussa K.", initials: "MK", color: "amber", meta: "Hier a 21:32" },
        { id: "school-status", name: "Projet ecole", initials: "PE", color: "blue", meta: "Hier a 18:07" },
      ],
      calls: [
        { id: "c1", chatId: "amina", name: "Amina Diallo", initials: "AD", color: "purple", kind: "video", direction: "in", at: base - 1000 * 60 * 120 },
        { id: "c2", chatId: "crash-room", name: "Cellule incident", initials: "CI", color: "red", kind: "audio", direction: "missed", at: base - 1000 * 60 * 210 },
        { id: "c3", chatId: "moussa", name: "Moussa K.", initials: "MK", color: "amber", kind: "audio", direction: "out", at: base - 1000 * 60 * 620 },
      ],
      channels: [
        { id: "tech", title: "Tech Updates", initials: "TU", color: "blue", followers: "18k", followed: true, last: "Nouvelle build disponible." },
        { id: "news", title: "Actu locale", initials: "AL", color: "green", followers: "9k", followed: false, last: "Resume de la journee." },
        { id: "design", title: "Design Lab", initials: "DL", color: "purple", followers: "42k", followed: false, last: "Nouveau kit UI publie." },
      ],
    };
  }

  function message(from, text, at, kind = "text") {
    return {
      id: createId(),
      from,
      text,
      at,
      kind,
    };
  }

  const els = {
    shell: document.getElementById("app-shell"),
    viewTitle: document.getElementById("view-title"),
    sideContent: document.getElementById("side-content"),
    filterTabs: document.getElementById("filter-tabs"),
    search: document.getElementById("search-input"),
    thread: document.getElementById("message-thread"),
    activeAvatar: document.getElementById("active-avatar"),
    activeName: document.getElementById("active-name"),
    activeStatus: document.getElementById("active-status"),
    detailsPanel: document.getElementById("details-panel"),
    detailsAvatar: document.getElementById("details-avatar"),
    detailsName: document.getElementById("details-name"),
    detailsPhone: document.getElementById("details-phone"),
    detailsPresence: document.getElementById("details-presence"),
    mediaGrid: document.getElementById("media-grid"),
    favoriteButton: document.getElementById("favorite-button"),
    favoriteState: document.getElementById("favorite-state"),
    archiveButton: document.getElementById("archive-button"),
    detailsButton: document.getElementById("details-button"),
    openDetailsButton: document.getElementById("open-details-button"),
    closeDetailsButton: document.getElementById("close-details-button"),
    composer: document.getElementById("composer"),
    input: document.getElementById("message-input"),
    emojiButton: document.getElementById("emoji-button"),
    attachButton: document.getElementById("attach-button"),
    voiceButton: document.getElementById("voice-button"),
    callButton: document.getElementById("call-button"),
    videoButton: document.getElementById("video-button"),
    newChatButton: document.getElementById("new-chat-button"),
    modal: document.getElementById("new-chat-modal"),
    newChatForm: document.getElementById("new-chat-form"),
    newName: document.getElementById("new-contact-name"),
    newPhone: document.getElementById("new-contact-phone"),
    newGroup: document.getElementById("new-contact-group"),
    toast: document.getElementById("toast"),
  };

  let state = loadState();
  let toastTimer = null;
  let recordingTimer = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return makeSeed();
      const parsed = JSON.parse(raw);
      const seed = makeSeed();
      return {
        ...seed,
        ...parsed,
        profile: { ...seed.profile, ...(parsed.profile || {}) },
        chats: Array.isArray(parsed.chats) ? parsed.chats : seed.chats,
        statuses: Array.isArray(parsed.statuses) ? parsed.statuses : seed.statuses,
        calls: Array.isArray(parsed.calls) ? parsed.calls : seed.calls,
        channels: Array.isArray(parsed.channels) ? parsed.channels : seed.channels,
      };
    } catch (error) {
      console.warn("Impossible de restaurer l'etat", error);
      return makeSeed();
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn("Sauvegarde locale impossible", error);
      showToast("Sauvegarde locale indisponible");
    }
  }

  function guarded(label, fn) {
    try {
      const result = fn();
      if (result && typeof result.then === "function") {
        return result.catch((error) => handleError(label, error));
      }
      return result;
    } catch (error) {
      return handleError(label, error);
    }
  }

  function handleError(label, error) {
    console.error(label, error);
    showToast(`Action isolee: ${label}`);
    persist();
    return null;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function activeChat() {
    return state.chats.find((chat) => chat.id === state.activeChatId) || state.chats[0];
  }

  function lastMessage(chat) {
    return chat.messages[chat.messages.length - 1];
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp || Date.now()));
  }

  function formatDay(timestamp) {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }).format(new Date(timestamp || Date.now()));
  }

  function showToast(text) {
    clearTimeout(toastTimer);
    els.toast.textContent = text;
    els.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 1800);
  }

  function render() {
    renderChrome();
    renderChat();
    renderSideContent();
    renderDetails();
    persist();
  }

  function renderChrome() {
    document.querySelectorAll(".rail-button").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === state.activeView);
    });

    const titles = {
      chats: "Discussions",
      status: "Statuts",
      calls: "Appels",
      channels: "Channels",
      settings: "Reglages",
    };
    els.viewTitle.textContent = titles[state.activeView] || "Discussions";
    els.filterTabs.hidden = state.activeView !== "chats";
    els.search.placeholder =
      state.activeView === "chats"
        ? "Rechercher ou demarrer une discussion"
        : "Rechercher";

    document.querySelectorAll(".filter-tab").forEach((button) => {
      const active = button.dataset.filter === state.filter;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
  }

  function renderSideContent() {
    els.sideContent.replaceChildren();

    if (state.activeView === "chats") renderChatList();
    if (state.activeView === "status") renderStatusList();
    if (state.activeView === "calls") renderCallList();
    if (state.activeView === "channels") renderChannelList();
    if (state.activeView === "settings") renderSettings();
  }

  function renderChatList() {
    const query = state.query.trim().toLowerCase();
    const chats = state.chats
      .filter((chat) => {
        const last = lastMessage(chat);
        const searchable = `${chat.name} ${chat.phone} ${last ? last.text : ""}`.toLowerCase();
        const matchesQuery = !query || searchable.includes(query);
        const matchesFilter =
          state.filter === "all" ||
          (state.filter === "unread" && chat.unread > 0) ||
          (state.filter === "groups" && chat.group) ||
          (state.filter === "favorites" && chat.favorite);
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || lastMessage(b).at - lastMessage(a).at);

    if (!chats.length) {
      renderEmpty("Aucune discussion", "Aucun resultat avec ce filtre.");
      return;
    }

    chats.forEach((chat) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = `chat-item${chat.id === state.activeChatId ? " is-active" : ""}`;
      item.dataset.chatId = chat.id;

      const avatar = makeAvatar(chat);
      const body = document.createElement("div");
      body.className = "chat-body";

      const line = document.createElement("div");
      line.className = "chat-line";
      const name = document.createElement("p");
      name.className = "chat-name";
      name.textContent = chat.name;
      const time = document.createElement("span");
      time.className = "chat-time";
      time.textContent = formatTime(lastMessage(chat).at);
      line.append(name, time);

      const preview = document.createElement("p");
      preview.className = "chat-preview";
      preview.textContent = previewText(lastMessage(chat));

      body.append(line, preview);

      const meta = document.createElement("div");
      meta.className = "chat-meta";
      if (chat.unread > 0) {
        const unread = document.createElement("span");
        unread.className = "unread";
        unread.textContent = String(chat.unread);
        meta.append(unread);
      } else if (chat.pinned) {
        const pin = document.createElement("span");
        pin.className = "pin-badge";
        pin.innerHTML = '<svg><use href="#i-pin"></use></svg>';
        meta.append(pin);
      }

      item.append(avatar, body, meta);
      els.sideContent.append(item);
    });
  }

  function previewText(msg) {
    if (!msg) return "";
    if (msg.kind === "audio") return "Message vocal";
    if (msg.kind === "attachment") return "Piece jointe";
    return msg.text;
  }

  function renderStatusList() {
    const query = state.query.trim().toLowerCase();
    const statuses = state.statuses.filter((status) => {
      return !query || `${status.name} ${status.meta}`.toLowerCase().includes(query);
    });

    statuses.forEach((status) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "status-item";
      item.dataset.statusId = status.id;
      const avatar = makeAvatar(status, !status.mine);
      const body = document.createElement("div");
      body.className = "status-body";
      const name = document.createElement("p");
      name.className = "status-name";
      name.textContent = status.name;
      const meta = document.createElement("p");
      meta.className = "status-meta";
      meta.textContent = status.meta;
      body.append(name, meta);
      item.append(avatar, body);
      els.sideContent.append(item);
    });
  }

  function renderCallList() {
    const query = state.query.trim().toLowerCase();
    const calls = state.calls.filter((call) => !query || call.name.toLowerCase().includes(query));

    calls.forEach((call) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "call-item";
      item.dataset.chatId = call.chatId;
      item.append(makeAvatar(call));

      const body = document.createElement("div");
      body.className = "call-body";
      const line = document.createElement("div");
      line.className = "call-line";
      const name = document.createElement("p");
      name.className = "call-name";
      name.textContent = call.name;
      const time = document.createElement("span");
      time.className = "chat-time";
      time.textContent = formatTime(call.at);
      line.append(name, time);

      const meta = document.createElement("p");
      meta.className = `call-meta call-direction ${call.direction}`;
      meta.textContent = callLabel(call);
      body.append(line, meta);

      const icon = document.createElement("span");
      icon.className = "pin-badge";
      icon.innerHTML = call.kind === "video" ? '<svg><use href="#i-video"></use></svg>' : '<svg><use href="#i-phone"></use></svg>';

      item.append(body, icon);
      els.sideContent.append(item);
    });
  }

  function callLabel(call) {
    if (call.direction === "missed") return "Manque";
    if (call.direction === "out") return "Sortant";
    return "Entrant";
  }

  function renderChannelList() {
    const query = state.query.trim().toLowerCase();
    const channels = state.channels.filter((channel) => {
      return !query || `${channel.title} ${channel.last}`.toLowerCase().includes(query);
    });

    channels.forEach((channel) => {
      const item = document.createElement("article");
      item.className = "channel-item";
      item.dataset.channelId = channel.id;
      item.append(makeAvatar({ initials: channel.initials, color: channel.color }));

      const body = document.createElement("div");
      body.className = "channel-body";
      const line = document.createElement("div");
      line.className = "channel-line";
      const title = document.createElement("p");
      title.className = "channel-title";
      title.textContent = channel.title;
      const followers = document.createElement("span");
      followers.className = "chat-time";
      followers.textContent = channel.followers;
      line.append(title, followers);

      const meta = document.createElement("p");
      meta.className = "channel-meta";
      meta.textContent = channel.last;
      body.append(line, meta);

      const button = document.createElement("button");
      button.type = "button";
      button.className = `follow-button${channel.followed ? " is-on" : ""}`;
      button.dataset.channelToggle = channel.id;
      button.textContent = channel.followed ? "Suivi" : "Suivre";
      item.append(body, button);
      els.sideContent.append(item);
    });
  }

  function renderSettings() {
    const wrap = document.createElement("section");
    wrap.className = "settings-panel";
    const title = document.createElement("h2");
    title.textContent = state.profile.name;
    const body = document.createElement("p");
    body.textContent = `${state.profile.phone} - ${state.chats.length} discussions locales`;
    wrap.append(title, body);

    const cards = [
      ["Compte", "Profil local, aucune connexion serveur."],
      ["Confidentialite", "Les donnees restent dans localStorage."],
      ["Notifications", "Simulation locale des messages entrants."],
    ];

    cards.forEach(([head, text]) => {
      const card = document.createElement("article");
      card.className = "settings-card";
      const h = document.createElement("h2");
      h.textContent = head;
      const p = document.createElement("p");
      p.textContent = text;
      card.append(h, p);
      wrap.append(card);
    });

    els.sideContent.append(wrap);
  }

  function renderEmpty(title, text) {
    const empty = document.createElement("section");
    empty.className = "empty-state";
    const h = document.createElement("h2");
    h.textContent = title;
    const p = document.createElement("p");
    p.textContent = text;
    empty.append(h, p);
    els.sideContent.append(empty);
  }

  function renderChat() {
    const chat = activeChat();
    if (!chat) return;

    chat.unread = 0;
    els.activeAvatar.className = `avatar avatar-lg ${chat.color || "green"}`;
    els.activeAvatar.textContent = chat.initials;
    els.activeName.textContent = chat.name;
    els.activeStatus.textContent = chat.presence;

    els.thread.replaceChildren();
    const day = document.createElement("div");
    day.className = "day-pill";
    day.textContent = formatDay(Date.now());
    els.thread.append(day);

    chat.messages.forEach((msg) => {
      const bubble = document.createElement("article");
      bubble.className = `message ${msg.from === "me" ? "me" : msg.from === "system" ? "system" : ""}`;
      const p = document.createElement("p");
      p.textContent = msg.kind === "audio" ? "Message vocal - 0:08" : msg.text;
      const meta = document.createElement("span");
      meta.className = "message-meta";
      meta.append(document.createTextNode(formatTime(msg.at)));
      if (msg.from === "me") {
        const check = document.createElement("span");
        check.innerHTML = '<svg><use href="#i-check"></use></svg>';
        meta.append(check);
      }
      bubble.append(p, meta);
      els.thread.append(bubble);
    });

    requestAnimationFrame(() => {
      els.thread.scrollTop = els.thread.scrollHeight;
    });
  }

  function renderDetails() {
    const chat = activeChat();
    if (!chat) return;

    els.detailsPanel.classList.toggle("is-hidden", !state.detailsOpen);
    els.detailsAvatar.className = `profile-avatar ${chat.color || "green"}`;
    els.detailsAvatar.textContent = chat.initials;
    els.detailsName.textContent = chat.name;
    els.detailsPhone.textContent = chat.phone;
    els.detailsPresence.textContent = chat.presence;
    els.favoriteState.textContent = chat.favorite ? "Oui" : "Non";

    els.mediaGrid.replaceChildren();
    const count = Math.max(1, Math.min(9, chat.media || 1));
    for (let i = 0; i < count; i += 1) {
      const tile = document.createElement("div");
      tile.className = "media-tile";
      els.mediaGrid.append(tile);
    }
  }

  function makeAvatar(item, ring = false) {
    const avatar = document.createElement("span");
    avatar.className = `avatar ${item.color || "green"}${ring ? " status-ring" : ""}`;
    avatar.textContent = item.initials || "?";
    return avatar;
  }

  function selectChat(id) {
    const chat = state.chats.find((item) => item.id === id);
    if (!chat) return;
    state.activeChatId = id;
    state.activeView = "chats";
    state.query = "";
    els.search.value = "";
    render();
  }

  function appendMessage(chat, from, text, kind = "text") {
    chat.messages.push(message(from, text, Date.now(), kind));
  }

  function sendMessage(text) {
    const clean = text.trim();
    if (!clean) return;
    const chat = activeChat();
    appendMessage(chat, "me", clean);
    els.input.value = "";
    resizeInput();
    render();
    queueReply(chat.id, clean);
  }

  function queueReply(chatId, text) {
    window.setTimeout(() => {
      guarded("auto-reply", () => {
        const chat = state.chats.find((item) => item.id === chatId);
        if (!chat) return;
        const lower = text.toLowerCase();
        let reply = "Recu.";
        if (lower.includes("appel")) reply = "Oui, on peut lancer l'appel.";
        if (lower.includes("fichier")) reply = "Envoie le fichier ici, je regarde.";
        if (lower.includes("crash") || lower.includes("plein ecran")) {
          reply = "Je garde la sortie plein ecran separee de la fermeture.";
        }
        appendMessage(chat, "them", reply);
        if (state.activeChatId !== chat.id) chat.unread += 1;
        render();
      });
    }, AUTO_REPLY_DELAY);
  }

  function resizeInput() {
    els.input.style.height = "auto";
    els.input.style.height = `${Math.min(130, els.input.scrollHeight)}px`;
  }

  function addCall(kind) {
    const chat = activeChat();
    state.calls.unshift({
      id: createId(),
      chatId: chat.id,
      name: chat.name,
      initials: chat.initials,
      color: chat.color,
      kind,
      direction: "out",
      at: Date.now(),
    });
    appendMessage(chat, "system", kind === "video" ? "Appel video simule." : "Appel audio simule.");
    showToast(kind === "video" ? "Appel video simule" : "Appel audio simule");
    render();
  }

  function createChat() {
    const name = els.newName.value.trim() || "Nouveau contact";
    const phone = els.newPhone.value.trim() || "+33 6 00 00 00 00";
    const group = els.newGroup.checked;
    const index = state.chats.length + 1;
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("")
      .slice(0, 2) || "NC";

    const chat = {
      id: `chat-${Date.now()}`,
      name,
      phone: group ? "Groupe" : phone,
      initials,
      color: colors[index % colors.length],
      presence: group ? "Nouveau groupe" : "en ligne",
      group,
      pinned: false,
      favorite: false,
      unread: 0,
      media: 1,
      messages: [message("system", "Discussion creee localement.", Date.now())],
    };

    state.chats.unshift(chat);
    state.activeChatId = chat.id;
    state.activeView = "chats";
    els.newChatForm.reset();
    els.modal.close();
    showToast("Chat cree");
    render();
  }

  function toggleFavorite() {
    const chat = activeChat();
    chat.favorite = !chat.favorite;
    showToast(chat.favorite ? "Ajoute aux favoris" : "Retire des favoris");
    render();
  }

  function toggleChannel(id) {
    const channel = state.channels.find((item) => item.id === id);
    if (!channel) return;
    channel.followed = !channel.followed;
    showToast(channel.followed ? "Channel suivi" : "Channel retire");
    render();
  }

  function simulateVoice() {
    if (recordingTimer) {
      window.clearTimeout(recordingTimer);
      recordingTimer = null;
      els.voiceButton.classList.remove("is-recording");
      showToast("Vocal annule");
      return;
    }

    els.voiceButton.classList.add("is-recording");
    showToast("Enregistrement vocal...");
    recordingTimer = window.setTimeout(() => {
      guarded("voice-message", () => {
        const chat = activeChat();
        appendMessage(chat, "me", "Message vocal", "audio");
        els.voiceButton.classList.remove("is-recording");
        recordingTimer = null;
        render();
        queueReply(chat.id, "vocal");
      });
    }, RECORDING_DELAY);
  }

  function bind() {
    document.querySelectorAll(".rail-button").forEach((button) => {
      button.addEventListener("click", () => {
        guarded("nav", () => {
          state.activeView = button.dataset.view || "chats";
          state.query = "";
          els.search.value = "";
          render();
        });
      });
    });

    document.querySelectorAll(".filter-tab").forEach((button) => {
      button.addEventListener("click", () => {
        guarded("filter", () => {
          state.filter = button.dataset.filter || "all";
          render();
        });
      });
    });

    els.search.addEventListener("input", () => {
      guarded("search", () => {
        state.query = els.search.value;
        renderSideContent();
        persist();
      });
    });

    els.sideContent.addEventListener("click", (event) => {
      guarded("side-click", () => {
        const follow = event.target.closest("[data-channel-toggle]");
        if (follow) {
          toggleChannel(follow.dataset.channelToggle);
          return;
        }

        const chatItem = event.target.closest("[data-chat-id]");
        if (chatItem) {
          selectChat(chatItem.dataset.chatId);
          return;
        }

        const status = event.target.closest("[data-status-id]");
        if (status) {
          showToast("Statut affiche localement");
        }
      });
    });

    els.composer.addEventListener("submit", (event) => {
      event.preventDefault();
      guarded("send", () => sendMessage(els.input.value));
    });

    els.input.addEventListener("input", resizeInput);
    els.input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        guarded("send-shortcut", () => sendMessage(els.input.value));
      }
    });

    document.querySelectorAll("[data-snippet]").forEach((button) => {
      button.addEventListener("click", () => {
        guarded("snippet", () => {
          els.input.value = button.dataset.snippet || "";
          resizeInput();
          els.input.focus();
        });
      });
    });

    els.emojiButton.addEventListener("click", () => {
      guarded("emoji", () => {
        els.input.value = `${els.input.value}:)`;
        resizeInput();
        els.input.focus();
      });
    });

    els.attachButton.addEventListener("click", () => {
      guarded("attachment", () => {
        const chat = activeChat();
        appendMessage(chat, "me", "Piece jointe: image-demo.png", "attachment");
        chat.media = (chat.media || 0) + 1;
        showToast("Piece jointe ajoutee");
        render();
      });
    });

    els.voiceButton.addEventListener("click", () => guarded("voice", simulateVoice));
    els.callButton.addEventListener("click", () => guarded("audio-call", () => addCall("audio")));
    els.videoButton.addEventListener("click", () => guarded("video-call", () => addCall("video")));

    els.detailsButton.addEventListener("click", () => {
      guarded("details", () => {
        state.detailsOpen = !state.detailsOpen;
        renderDetails();
        persist();
      });
    });
    els.openDetailsButton.addEventListener("click", () => {
      guarded("open-details", () => {
        state.detailsOpen = true;
        renderDetails();
        persist();
      });
    });
    els.closeDetailsButton.addEventListener("click", () => {
      guarded("close-details", () => {
        state.detailsOpen = false;
        renderDetails();
        persist();
      });
    });

    els.favoriteButton.addEventListener("click", () => guarded("favorite", toggleFavorite));
    els.archiveButton.addEventListener("click", () => {
      guarded("archive", () => showToast("Archivage simule localement"));
    });

    els.newChatButton.addEventListener("click", () => {
      guarded("new-chat-modal", () => {
        if (typeof els.modal.showModal === "function") {
          els.modal.showModal();
        } else {
          els.modal.setAttribute("open", "");
        }
      });
    });

    els.newChatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      guarded("new-chat", createChat);
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") guarded("visibility-save", persist);
    });
    window.addEventListener("beforeunload", () => guarded("beforeunload", persist));
  }

  bind();
  resizeInput();
  render();
})();
