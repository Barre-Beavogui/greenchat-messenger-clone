(() => {
  "use strict";

  const VAULT_PREFIX = "greenchat-vault-v2";
  const META_PREFIX = "greenchat-vault-meta-v2";
  const LIVE_URL_KEY = "greenchat-live-server-url";
  const AUTO_REPLY_DELAY = 700;
  const RECORDING_DELAY = 1300;
  const KDF_ITERATIONS = 210000;

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const colors = ["green", "teal", "blue", "amber", "purple", "red"];

  let state = null;
  let sessionKey = null;
  let sessionVaultKey = null;
  let sessionMetaKey = null;
  let sessionUserId = null;
  let identityPrivateKey = null;
  let identityPublicKey = null;
  let liveEvents = null;
  let toastTimer = null;
  let recordingTimer = null;
  let persistTimer = null;

  const els = {
    authScreen: document.getElementById("auth-screen"),
    authForm: document.getElementById("auth-form"),
    authEmail: document.getElementById("auth-email"),
    authSecret: document.getElementById("auth-secret"),
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
    detailsIdentity: document.getElementById("details-identity"),
    detailsEmail: document.getElementById("details-email"),
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
    profileButton: document.getElementById("profile-button"),
    newChatButton: document.getElementById("new-chat-button"),
    modal: document.getElementById("new-chat-modal"),
    newChatForm: document.getElementById("new-chat-form"),
    newName: document.getElementById("new-contact-name"),
    newEmail: document.getElementById("new-contact-email"),
    newGroup: document.getElementById("new-contact-group"),
    toast: document.getElementById("toast"),
  };

  function normalizeEmail(email) {
    return email.trim().toLowerCase();
  }

  function initialsFromName(value) {
    const source = value.includes("@") ? value.split("@")[0] : value;
    const parts = source.replace(/[^a-zA-Z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
    return (parts.slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "GC").slice(0, 2);
  }

  function displayNameFromEmail(email) {
    const local = email.split("@")[0] || "anonyme";
    return local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function makeSeed(email) {
    const base = Date.now();
    const name = displayNameFromEmail(email);
    return {
      version: 2,
      activeView: "chats",
      activeChatId: "family",
      filter: "all",
      query: "",
      detailsOpen: true,
      identity: null,
      live: {
        serverUrl: localStorage.getItem(LIVE_URL_KEY) || "",
        connected: false,
        status: "Hors ligne",
        lastSyncAt: 0,
        seenEnvelopeIds: [],
      },
      profile: {
        name,
        email,
        initials: initialsFromName(name),
      },
      chats: [
        {
          id: "family",
          name: "Famille",
          email: "famille@group.greenchat.local",
          initials: "FA",
          color: "green",
          presence: "groupe prive, 5 membres",
          group: true,
          pinned: true,
          favorite: true,
          unread: 3,
          media: 7,
          messages: [
            message("system", "Groupe chiffre localement. Aucun numero de telephone n'est utilise.", base - 1000 * 60 * 90),
            message("them", "Tu peux m'envoyer les documents ce soir ?", base - 1000 * 60 * 66),
            message("me", "Oui, je les prepare et je t'envoie ca.", base - 1000 * 60 * 62),
            message("them", "Parfait, merci.", base - 1000 * 60 * 30),
          ],
        },
        {
          id: "security",
          name: "Audit chiffrement",
          email: "audit@greenchat.local",
          initials: "AC",
          color: "red",
          presence: "en ligne",
          group: false,
          pinned: false,
          favorite: true,
          unread: 1,
          media: 4,
          messages: [
            message("them", "L'identite se fait par email + phrase secrete.", base - 1000 * 60 * 230),
            message("me", "Les discussions sont chiffrees avant stockage local avec AES-GCM.", base - 1000 * 60 * 226),
            message("system", "Aucun numero n'est demande. Utilisez un alias email pour plus de confidentialite.", base - 1000 * 60 * 220),
          ],
        },
        {
          id: "amina",
          name: "Amina Diallo",
          email: "amina.alias@example.com",
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
            message("me", "Oui, envoie-moi un mail avant de partir.", base - 1000 * 60 * 174),
          ],
        },
        {
          id: "school",
          name: "Projet ecole",
          email: "projet-ecole@group.greenchat.local",
          initials: "PE",
          color: "blue",
          presence: "groupe prive, 8 membres",
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
          email: "moussa.secure@example.com",
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
        { id: "me", name: "Mon statut", initials: initialsFromName(name), color: "teal", meta: "Identite email seulement", mine: true },
        { id: "amina-status", name: "Amina Diallo", initials: "AD", color: "purple", meta: "Aujourd'hui a 00:10" },
        { id: "moussa-status", name: "Moussa K.", initials: "MK", color: "amber", meta: "Hier a 21:32" },
        { id: "school-status", name: "Projet ecole", initials: "PE", color: "blue", meta: "Hier a 18:07" },
      ],
      calls: [
        { id: "c1", chatId: "amina", name: "Amina Diallo", initials: "AD", color: "purple", kind: "video", direction: "in", at: base - 1000 * 60 * 120 },
        { id: "c2", chatId: "security", name: "Audit chiffrement", initials: "AC", color: "red", kind: "audio", direction: "missed", at: base - 1000 * 60 * 210 },
        { id: "c3", chatId: "moussa", name: "Moussa K.", initials: "MK", color: "amber", kind: "audio", direction: "out", at: base - 1000 * 60 * 620 },
      ],
      channels: [
        { id: "privacy", title: "Privacy Updates", initials: "PU", color: "blue", followers: "18k", followed: true, last: "Conseil: utilisez un alias email." },
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

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function toBase64(bytes) {
    const view = new Uint8Array(bytes);
    let binary = "";
    for (let index = 0; index < view.length; index += 1) {
      binary += String.fromCharCode(view[index]);
    }
    return btoa(binary);
  }

  function fromBase64(value) {
    return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
  }

  async function sha256Base64(value) {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
    return toBase64(digest).replaceAll("/", "_").replaceAll("+", "-").replaceAll("=", "");
  }

  async function deriveKey(email, secret, salt) {
    const material = await crypto.subtle.importKey(
      "raw",
      encoder.encode(`${email}\n${secret}`),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: KDF_ITERATIONS,
        hash: "SHA-256",
      },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  async function ensureIdentityKeys() {
    if (state.identity?.privateJwk && state.identity?.publicJwk) {
      identityPrivateKey = await crypto.subtle.importKey(
        "jwk",
        state.identity.privateJwk,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey"],
      );
      identityPublicKey = await crypto.subtle.importKey(
        "jwk",
        state.identity.publicJwk,
        { name: "ECDH", namedCurve: "P-256" },
        true,
        [],
      );
      return;
    }

    const pair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"],
    );
    identityPrivateKey = pair.privateKey;
    identityPublicKey = pair.publicKey;
    state.identity = {
      algorithm: "ECDH-P256",
      privateJwk: await crypto.subtle.exportKey("jwk", pair.privateKey),
      publicJwk: await crypto.subtle.exportKey("jwk", pair.publicKey),
      createdAt: new Date().toISOString(),
    };
  }

  async function importPeerPublicKey(publicJwk) {
    return crypto.subtle.importKey(
      "jwk",
      publicJwk,
      { name: "ECDH", namedCurve: "P-256" },
      false,
      [],
    );
  }

  async function derivePeerMessageKey(peerPublicJwk) {
    const peerPublicKey = await importPeerPublicKey(peerPublicJwk);
    return crypto.subtle.deriveKey(
      { name: "ECDH", public: peerPublicKey },
      identityPrivateKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }

  async function encryptForPeer(peerPublicJwk, payload) {
    const key = await derivePeerMessageKey(peerPublicJwk);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encoder.encode(JSON.stringify(payload)),
    );
    return { iv: toBase64(iv), payload: toBase64(cipher) };
  }

  async function decryptFromPeer(senderPublicJwk, envelope) {
    const key = await derivePeerMessageKey(senderPublicJwk);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.payload),
    );
    return JSON.parse(decoder.decode(plain));
  }

  async function encryptState(data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = encoder.encode(JSON.stringify(data));
    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sessionKey, encoded);
    return {
      version: 2,
      algorithm: "AES-GCM",
      kdf: "PBKDF2-SHA256",
      iterations: KDF_ITERATIONS,
      iv: toBase64(iv),
      payload: toBase64(cipher),
      updatedAt: new Date().toISOString(),
    };
  }

  async function decryptState(vault) {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(vault.iv) },
      sessionKey,
      fromBase64(vault.payload),
    );
    return JSON.parse(decoder.decode(plain));
  }

  async function unlockVault(emailInput, secret) {
    const email = normalizeEmail(emailInput);
    if (!crypto.subtle) {
      throw new Error("Web Crypto indisponible dans ce navigateur");
    }
    if (!email || !email.includes("@")) {
      throw new Error("Email invalide");
    }
    if (!secret || secret.length < 8) {
      throw new Error("Phrase secrete trop courte");
    }

    const emailHash = await sha256Base64(email);
    sessionUserId = emailHash;
    sessionMetaKey = `${META_PREFIX}:${emailHash}`;
    sessionVaultKey = `${VAULT_PREFIX}:${emailHash}`;

    let meta = JSON.parse(localStorage.getItem(sessionMetaKey) || "null");
    if (!meta) {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      meta = {
        version: 2,
        salt: toBase64(salt),
        iterations: KDF_ITERATIONS,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(sessionMetaKey, JSON.stringify(meta));
      sessionKey = await deriveKey(email, secret, salt);
      state = makeSeed(email);
      await ensureIdentityKeys();
      await persistNow();
      return;
    }

    sessionKey = await deriveKey(email, secret, fromBase64(meta.salt));
    const vault = JSON.parse(localStorage.getItem(sessionVaultKey) || "null");
    if (!vault) {
      state = makeSeed(email);
      await ensureIdentityKeys();
      await persistNow();
      return;
    }

    try {
      state = await decryptState(vault);
    } catch {
      throw new Error("Email ou phrase secrete incorrecte");
    }
    migrateState(email);
    await ensureIdentityKeys();
  }

  function migrateState(email) {
    state.profile = {
      name: state.profile?.name || displayNameFromEmail(email),
      email: state.profile?.email || email,
      initials: state.profile?.initials || initialsFromName(email),
    };
    state.chats = (state.chats || []).map((chat) => {
      const legacyEmail = chat.email || (chat.group ? `${chat.id}@group.greenchat.local` : `${chat.id}@contact.greenchat.local`);
      const rest = { ...chat };
      delete rest.phone;
      return { ...rest, email: legacyEmail };
    });
    state.live = {
      serverUrl: localStorage.getItem(LIVE_URL_KEY) || state.live?.serverUrl || "",
      connected: false,
      status: "Hors ligne",
      lastSyncAt: state.live?.lastSyncAt || 0,
      seenEnvelopeIds: Array.isArray(state.live?.seenEnvelopeIds) ? state.live.seenEnvelopeIds : [],
    };
    state.version = 2;
  }

  async function persistNow() {
    if (!state || !sessionKey || !sessionVaultKey) return;
    try {
      const vault = await encryptState(state);
      localStorage.setItem(sessionVaultKey, JSON.stringify(vault));
    } catch (error) {
      console.warn("Sauvegarde chiffree impossible", error);
      showToast("Sauvegarde chiffree indisponible");
    }
  }

  function schedulePersist() {
    window.clearTimeout(persistTimer);
    persistTimer = window.setTimeout(() => {
      void persistNow();
    }, 80);
  }

  function normalizeServerUrl(value) {
    return value.trim().replace(/\/+$/, "");
  }

  function apiUrl(path) {
    return `${normalizeServerUrl(state.live.serverUrl)}${path}`;
  }

  function setLiveStatus(status, connected = false) {
    state.live.status = status;
    state.live.connected = connected;
    renderChrome();
    schedulePersist();
  }

  async function liveRequest(path, options = {}) {
    if (!state.live.serverUrl) {
      throw new Error("URL serveur manquante");
    }
    const response = await fetch(apiUrl(path), {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `Erreur serveur ${response.status}`);
    }
    return payload;
  }

  async function connectLive() {
    if (!state.live.serverUrl) {
      throw new Error("Ajoutez une URL serveur");
    }
    await ensureIdentityKeys();
    await liveRequest("/api/register", {
      method: "POST",
      body: JSON.stringify({
        userId: sessionUserId,
        publicKey: state.identity.publicJwk,
        label: state.profile.initials,
      }),
    });
    await syncLiveMessages();
    openLiveEvents();
    setLiveStatus("Connecte au serveur chiffre", true);
    showToast("Temps reel chiffre connecte");
  }

  function disconnectLive() {
    if (liveEvents) {
      liveEvents.close();
      liveEvents = null;
    }
    setLiveStatus("Hors ligne", false);
    showToast("Temps reel deconnecte");
  }

  function openLiveEvents() {
    if (liveEvents) liveEvents.close();
    liveEvents = new EventSource(apiUrl(`/api/events/${sessionUserId}`));
    liveEvents.addEventListener("ready", () => setLiveStatus("Connecte au serveur chiffre", true));
    liveEvents.addEventListener("message", (event) => {
      guarded("live-message", async () => {
        await processEnvelope(JSON.parse(event.data));
      });
    });
    liveEvents.onerror = () => {
      setLiveStatus("Reconnexion en cours", false);
    };
  }

  async function syncLiveMessages() {
    const result = await liveRequest(`/api/messages/${sessionUserId}?since=${Number(state.live.lastSyncAt || 0)}`);
    for (const envelope of result.messages || []) {
      await processEnvelope(envelope);
    }
    state.live.lastSyncAt = result.serverTime || Date.now();
    schedulePersist();
  }

  async function fetchPeerPublicKey(peerId) {
    const payload = await liveRequest(`/api/users/${peerId}/public-key`);
    return payload.publicKey;
  }

  function rememberEnvelope(id) {
    if (!id) return false;
    if (state.live.seenEnvelopeIds.includes(id)) return false;
    state.live.seenEnvelopeIds.push(id);
    if (state.live.seenEnvelopeIds.length > 600) {
      state.live.seenEnvelopeIds = state.live.seenEnvelopeIds.slice(-600);
    }
    return true;
  }

  async function sendLiveMessage(chat, localMessage) {
    if (!state.live.connected || !state.live.serverUrl || chat.group) return false;
    const peerId = chat.peerId || (await sha256Base64(normalizeEmail(chat.email)));
    chat.peerId = peerId;
    let publicKey;
    try {
      publicKey = await fetchPeerPublicKey(peerId);
    } catch {
      showToast("Contact non connecte au serveur chiffre");
      return false;
    }

    const envelopeId = createId();
    const encrypted = await encryptForPeer(publicKey, {
      id: localMessage.id,
      text: localMessage.text,
      kind: localMessage.kind,
      fromName: state.profile.name,
      fromEmail: state.profile.email,
      sentAt: localMessage.at,
    });

    await liveRequest("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        id: envelopeId,
        from: sessionUserId,
        to: peerId,
        senderPublicKey: state.identity.publicJwk,
        sentAt: localMessage.at,
        ...encrypted,
      }),
    });
    rememberEnvelope(envelopeId);
    return true;
  }

  async function processEnvelope(envelope) {
    if (!envelope || envelope.to !== sessionUserId || !rememberEnvelope(envelope.id)) return;
    const payload = await decryptFromPeer(envelope.senderPublicKey, envelope);
    const chat = findOrCreatePeerChat(envelope.from, payload);
    if (chat.messages.some((item) => item.remoteId === envelope.id || item.id === payload.id)) return;
    chat.messages.push({
      id: payload.id || createId(),
      remoteId: envelope.id,
      from: "them",
      text: payload.text || "",
      at: payload.sentAt || envelope.sentAt || Date.now(),
      kind: payload.kind || "text",
    });
    if (state.activeChatId !== chat.id) chat.unread = (chat.unread || 0) + 1;
    render();
  }

  function findOrCreatePeerChat(peerId, payload) {
    let chat = state.chats.find((item) => item.peerId === peerId || item.email === payload.fromEmail);
    if (chat) {
      chat.peerId = peerId;
      return chat;
    }
    const name = payload.fromName || displayNameFromEmail(payload.fromEmail || `${peerId}@anonymous.local`);
    chat = {
      id: `peer-${peerId.slice(0, 16)}`,
      peerId,
      name,
      email: payload.fromEmail || `${peerId}@anonymous.greenchat.local`,
      initials: initialsFromName(name),
      color: colors[state.chats.length % colors.length],
      presence: "recu via serveur chiffre",
      group: false,
      pinned: false,
      favorite: false,
      unread: 0,
      media: 1,
      messages: [message("system", "Contact cree automatiquement depuis un message chiffre.", Date.now())],
    };
    state.chats.unshift(chat);
    return chat;
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
    showToast(label === "unlock" ? error.message : `Action isolee: ${label}`);
    schedulePersist();
    return null;
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
    window.clearTimeout(toastTimer);
    els.toast.textContent = text;
    els.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("is-visible");
    }, 1900);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function unlockUi() {
    els.authScreen.classList.add("is-hidden");
    els.shell.classList.remove("is-locked");
    els.shell.removeAttribute("aria-hidden");
    els.profileButton.textContent = state.profile.initials;
  }

  function render() {
    if (!state) return;
    renderChrome();
    renderChat();
    renderSideContent();
    renderDetails();
    schedulePersist();
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
        ? "Rechercher par email, alias ou message"
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
        const searchable = `${chat.name} ${chat.email} ${last ? last.text : ""}`.toLowerCase();
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
      item.append(makeAvatar(chat), makeChatBody(chat), makeChatMeta(chat));
      els.sideContent.append(item);
    });
  }

  function makeChatBody(chat) {
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
    return body;
  }

  function makeChatMeta(chat) {
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
    return meta;
  }

  function previewText(msg) {
    if (!msg) return "";
    if (msg.kind === "audio") return "Message vocal chiffre";
    if (msg.kind === "attachment") return "Piece jointe chiffree";
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
      const body = document.createElement("div");
      body.className = "status-body";
      const name = document.createElement("p");
      name.className = "status-name";
      name.textContent = status.name;
      const meta = document.createElement("p");
      meta.className = "status-meta";
      meta.textContent = status.meta;
      body.append(name, meta);
      item.append(makeAvatar(status, !status.mine), body);
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
      icon.innerHTML = call.kind === "video" ? '<svg><use href="#i-video"></use></svg>' : '<svg><use href="#i-audio"></use></svg>';
      item.append(body, icon);
      els.sideContent.append(item);
    });
  }

  function callLabel(call) {
    if (call.direction === "missed") return "Manque";
    if (call.direction === "out") return "Sortant chiffre";
    return "Entrant chiffre";
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
    body.textContent = `${state.profile.email} - ${state.chats.length} discussions chiffrees`;
    wrap.append(title, body);

    const cards = [
      ["Identite", "Connexion par email uniquement. Aucun numero de telephone."],
      ["Chiffrement", "Stockage local chiffre AES-GCM avec cle derivee de votre phrase secrete."],
      ["Anonymat", "Utilisez un alias email. L'app ne verifie pas votre identite et n'envoie rien a un serveur."],
      ["Temps reel", "Renseignez l'URL du serveur GreenChat pour synchroniser des enveloppes chiffrees entre utilisateurs."],
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

    const live = document.createElement("article");
    live.className = "settings-card live-card";
    live.innerHTML = `
      <h2>Serveur chiffre</h2>
      <p>${state.live.status}</p>
      <label class="live-url-field">
        <span>URL backend</span>
        <input type="url" data-live-url value="${escapeHtml(state.live.serverUrl || "")}" placeholder="https://votre-serveur.example.com" />
      </label>
      <div class="live-actions">
        <button class="primary-button" type="button" data-live-connect>Connecter</button>
        <button class="secondary-button" type="button" data-live-disconnect>Deconnecter</button>
      </div>
    `;
    wrap.append(live);

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
    els.activeStatus.textContent = `${chat.presence} - email uniquement`;

    els.thread.replaceChildren();
    const day = document.createElement("div");
    day.className = "day-pill";
    day.textContent = formatDay(Date.now());
    els.thread.append(day);

    chat.messages.forEach((msg) => {
      const bubble = document.createElement("article");
      bubble.className = `message ${msg.from === "me" ? "me" : msg.from === "system" ? "system" : ""}`;
      const p = document.createElement("p");
      p.textContent = msg.kind === "audio" ? "Message vocal chiffre - 0:08" : msg.text;
      const meta = document.createElement("span");
      meta.className = "message-meta";
      meta.append(document.createTextNode(`${formatTime(msg.at)} - chiffre`));
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
    els.detailsIdentity.textContent = chat.email;
    els.detailsEmail.textContent = chat.email;
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
    const created = message(from, text, Date.now(), kind);
    chat.messages.push(created);
    return created;
  }

  function sendMessage(text) {
    const clean = text.trim();
    if (!clean) return;
    const chat = activeChat();
    const created = appendMessage(chat, "me", clean);
    els.input.value = "";
    resizeInput();
    render();
    guarded("live-send", async () => {
      const sentLive = await sendLiveMessage(chat, created);
      if (!sentLive) queueReply(chat.id, clean);
    });
  }

  function queueReply(chatId, text) {
    window.setTimeout(() => {
      guarded("auto-reply", () => {
        const chat = state.chats.find((item) => item.id === chatId);
        if (!chat) return;
        const lower = text.toLowerCase();
        let reply = "Recu sur mon alias email.";
        if (lower.includes("appel")) reply = "Oui, on peut lancer l'appel chiffre.";
        if (lower.includes("fichier")) reply = "Envoie le fichier ici, je regarde.";
        if (lower.includes("numero") || lower.includes("numéro") || lower.includes("telephone")) {
          reply = "Pas besoin de numero ici, uniquement un email ou alias.";
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
    appendMessage(chat, "system", kind === "video" ? "Appel video chiffre simule." : "Appel audio chiffre simule.");
    showToast(kind === "video" ? "Appel video chiffre simule" : "Appel audio chiffre simule");
    render();
  }

  function createChat() {
    const name = els.newName.value.trim() || "Nouveau contact";
    const email = normalizeEmail(els.newEmail.value) || `${name.toLowerCase().replaceAll(" ", ".")}@alias.local`;
    const group = els.newGroup.checked;
    const index = state.chats.length + 1;

    if (!email.includes("@")) {
      showToast("Email invalide");
      return;
    }

    const chat = {
      id: `chat-${Date.now()}`,
      name,
      email: group ? `${email.split("@")[0]}@group.greenchat.local` : email,
      initials: initialsFromName(name),
      color: colors[index % colors.length],
      presence: group ? "groupe prive" : "en ligne",
      group,
      pinned: false,
      favorite: false,
      unread: 0,
      media: 1,
      messages: [message("system", "Discussion email-only creee et chiffree localement.", Date.now())],
    };

    state.chats.unshift(chat);
    state.activeChatId = chat.id;
    state.activeView = "chats";
    els.newChatForm.reset();
    els.modal.close();
    showToast("Chat chiffre cree");
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
    showToast("Enregistrement vocal chiffre...");
    recordingTimer = window.setTimeout(() => {
      guarded("voice-message", () => {
        const chat = activeChat();
        const created = appendMessage(chat, "me", "Message vocal", "audio");
        els.voiceButton.classList.remove("is-recording");
        recordingTimer = null;
        render();
        guarded("live-voice", async () => {
          const sentLive = await sendLiveMessage(chat, created);
          if (!sentLive) queueReply(chat.id, "vocal");
        });
      });
    }, RECORDING_DELAY);
  }

  function bind() {
    els.authForm.addEventListener("submit", (event) => {
      event.preventDefault();
      guarded("unlock", async () => {
        await unlockVault(els.authEmail.value, els.authSecret.value);
        els.authSecret.value = "";
        unlockUi();
        resizeInput();
        render();
        showToast("Coffre chiffre deverrouille");
      });
    });

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
        schedulePersist();
      });
    });

    els.sideContent.addEventListener("click", (event) => {
      guarded("side-click", async () => {
        const liveConnect = event.target.closest("[data-live-connect]");
        if (liveConnect) {
          const input = els.sideContent.querySelector("[data-live-url]");
          state.live.serverUrl = normalizeServerUrl(input?.value || "");
          localStorage.setItem(LIVE_URL_KEY, state.live.serverUrl);
          setLiveStatus("Connexion...", false);
          await connectLive();
          render();
          return;
        }

        const liveDisconnect = event.target.closest("[data-live-disconnect]");
        if (liveDisconnect) {
          disconnectLive();
          render();
          return;
        }

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
        const created = appendMessage(chat, "me", "Piece jointe chiffree: image-demo.png", "attachment");
        chat.media = (chat.media || 0) + 1;
        showToast("Piece jointe chiffree ajoutee");
        render();
        guarded("live-attachment", async () => {
          const sentLive = await sendLiveMessage(chat, created);
          if (!sentLive) queueReply(chat.id, "fichier");
        });
      });
    });

    els.voiceButton.addEventListener("click", () => guarded("voice", simulateVoice));
    els.callButton.addEventListener("click", () => guarded("audio-call", () => addCall("audio")));
    els.videoButton.addEventListener("click", () => guarded("video-call", () => addCall("video")));

    els.detailsButton.addEventListener("click", () => {
      guarded("details", () => {
        state.detailsOpen = !state.detailsOpen;
        renderDetails();
        schedulePersist();
      });
    });
    els.openDetailsButton.addEventListener("click", () => {
      guarded("open-details", () => {
        state.detailsOpen = true;
        renderDetails();
        schedulePersist();
      });
    });
    els.closeDetailsButton.addEventListener("click", () => {
      guarded("close-details", () => {
        state.detailsOpen = false;
        renderDetails();
        schedulePersist();
      });
    });

    els.favoriteButton.addEventListener("click", () => guarded("favorite", toggleFavorite));
    els.archiveButton.addEventListener("click", () => {
      guarded("archive", () => showToast("Archivage local chiffre"));
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
      if (document.visibilityState === "hidden") void persistNow();
    });
    window.addEventListener("beforeunload", () => {
      void persistNow();
    });
  }

  bind();
})();
