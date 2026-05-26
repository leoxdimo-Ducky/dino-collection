import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const CORE_RARITIES = [
  { label: "Comune", short: "CM", color: "#d0d6e0" },
  { label: "Tear C", short: "C", color: "#7ddf8f" },
  { label: "Tear B", short: "B", color: "#69b7ff" },
  { label: "Tear A", short: "A", color: "#e879f9" },
  { label: "Tear S", short: "S", color: "#f7c948" },
];

const EXTRA_RARITIES = [
  { label: "Time Shifted", short: "TS", color: "#b7f3ff" },
  { label: "Land scape", short: "LS", color: "#64d8cb" },
  { label: "Safari", short: "SF", color: "#ffb86b" },
  { label: "Master piece", short: "MP", color: "#ff7aa8" },
  { label: "Boom", short: "BM", color: "#ff6b4a" },
  { label: "Explosion", short: "EX", color: "#ffe66d" },
];

const RARITY_DEFINITIONS = [...CORE_RARITIES, ...EXTRA_RARITIES];
const RARITY_LABELS = RARITY_DEFINITIONS.map((rarity) => rarity.label);
const RARITY_META = Object.fromEntries(
  RARITY_DEFINITIONS.map((rarity) => [rarity.label, rarity])
);

const LEGACY_RARITY_MAP = {
  Common: "Tear C",
  Rare: "Tear B",
  Epic: "Tear A",
  Legendary: "Tear S",
};

const COLLECTION_SECTIONS = [
  {
    key: "main",
    title: "Collezione base",
    count: 150,
    rarities: CORE_RARITIES.map((rarity) => rarity.label),
    getName: (index) => `Dino ${padCardNumber(index)}`,
  },
  {
    key: "time-shifted",
    title: "Time Shifted",
    count: 30,
    rarities: ["Time Shifted"],
    getName: (index) => `Time Shifted ${padCardNumber(index)}`,
  },
  {
    key: "special",
    title: "Special Card",
    count: 9,
    rarities: ["Land scape", "Safari", "Master piece"],
    getName: (index) => `Special ${padCardNumber(index)}`,
  },
  {
    key: "pre-order",
    title: "Pre Order",
    count: 9,
    rarities: ["Boom", "Explosion"],
    getName: (index) => `Pre Order ${padCardNumber(index)}`,
  },
];

const COLLECTION_SECTION_MAP = Object.fromEntries(
  COLLECTION_SECTIONS.map((section) => [section.key, section])
);

const TOTAL_DISPLAY_CARDS = COLLECTION_SECTIONS.reduce(
  (total, section) => total + section.count,
  0
);

const TOTAL_CARD_VARIANTS = COLLECTION_SECTIONS.reduce(
  (total, section) => total + section.count * section.rarities.length,
  0
);

const CUSTOM_CARD_PREFIX = "custom::";
const FALLBACK_CARD_CATALOG = createFallbackCatalog();
const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_PATTERN = "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{10,}";
const PASSWORD_REQUIREMENTS = "Minimo 10 caratteri, con maiuscola, minuscola, numero e simbolo.";
const QUICK_MESSAGE_TEMPLATES = [
  { code: "want_to_trade", text: "Ti va di fare uno scambio?" },
  { code: "great_collection", text: "Complimenti per la tua collezione!" },
  { code: "thanks", text: "Grazie per lo scambio!" },
];

// ============================================================
// i18n
// ============================================================
const T = {
  it: {
    appSubtitle: (cards, variants) => `${cards} carte uniche, ${variants} varianti da completare.`,
    progression: "Progressione varianti",
    completed: (pct, owned, total) => `${pct}% completato, ${owned}/${total} carte accese`,
    setCollection: "Set collezione",
    rarityDivision: "Divisione rarità",
    cardGrid: "Griglia carte",
    search: "Cerca carta...",
    allSets: "Tutti i set",
    allRarities: "Tutte le rarità",
    collection: "Collezione",
    duplicates: "Doppioni",
    friends: "Amici",
    notifications: "Notifiche",
    friendRequestsLabel: "Richieste amicizia",
    messages: "Messaggi",
    usefulDupes: "Doppioni utili",
    noNotifications: "Nessuna nuova notifica.",
    noMessages: "Nessun nuovo messaggio.",
    noUsefulDupes: "Nessun doppione utile segnalato.",
    openFriend: "Apri amico",
    openChat: "Apri chat",
    messageReceived: "Nuovo messaggio",
    usefulDupeAlert: "Ha una carta doppia che ti manca",
    clearNotices: "Pulisci avvisi",
    dismiss: "Cancella",
    requestsNeedAction: "Accetta o rifiuta le richieste per rimuoverle.",
    tradeProposal: "Proposta di scambio",
    requestedCard: "Carta richiesta",
    offeredCard: "Carta offerta",
    sendTradeProposal: "Proponi scambio",
    noTradeCards: "Per proporre uno scambio servono doppioni in entrambe le collezioni.",
    progress: "Progressione",
    settings: "Impostazioni",
    more: "Menu",
    loading: "Caricamento...",
    noCards: "Nessuna carta trovata.",
    addMissing: "Aggiungi mancanti",
    deleteOwned: "Elimina possedute",
    adding: "Aggiunta...",
    deleting: "Elimino...",
    ownedLabel: "possedute",
    missingLabel: "mancanti",
    totalLabel: "totali",
    dupesLabel: "doppioni",
    addDupe: "+1 doppione",
    removeDupe: "-1 doppione",
    friendsTitle: "Amici e Scambio",
    friendSearch: "Cerca nickname esatto...",
    sendRequest: "Invia richiesta",
    accept: "Accetta",
    decline: "Rifiuta",
    removeFriend: "Rimuovi",
    noFriends: "Nessun amico ancora. Cerca un utente per email per iniziare!",
    pendingRequests: "Richieste in arrivo",
    sentRequests: "Richieste inviate",
    noPendingRequests: "Nessuna richiesta in arrivo.",
    noSentRequests: "Nessuna richiesta in attesa di risposta.",
    pendingReply: "In attesa di risposta",
    refresh: "Aggiorna",
    friendshipLoadError: "Non riesco a caricare richieste e amicizie.",
    alreadyFriends: "Siete gia amici.",
    existingPendingRequest: "C'e gia una richiesta in attesa tra voi.",
    friendshipRemoved: "Amicizia eliminata.",
    requestDeclined: "Richiesta rifiutata.",
    yourFriends: "I tuoi amici",
    viewCollection: "Vedi collezione",
    backToMine: "← Torna alla mia collezione",
    tradeList: "Lista scambio",
    tradeDesc: "Carte con doppioni disponibili per lo scambio:",
    noTrades: "Nessun doppione disponibile per lo scambio.",
    copyTrade: "Copia lista",
    progressTitle: "Storico progressione",
    progressDesc: "Crescita della tua collezione nel tempo.",
    exportCSV: "Esporta CSV",
    disconnect: "Disconnetti account",
    accessibility: "Modalità accessibilità",
    language: "Lingua",
    theme: "Tema applicazione",
    dark: "🌙 Scuro",
    light: "☀️ Chiaro",
    saveUsername: "Salva nome utente",
    changePassword: "Cambia password",
    profileSection: "Profilo personale",
    customization: "Personalizzazione",
    security: "Sicurezza account",
    statsRecap: "Riepilogo statistiche",
  },
  en: {
    appSubtitle: (cards, variants) => `${cards} unique cards, ${variants} variants to complete.`,
    progression: "Variant progression",
    completed: (pct, owned, total) => `${pct}% completed, ${owned}/${total} cards lit`,
    setCollection: "Collection sets",
    rarityDivision: "Rarity breakdown",
    cardGrid: "Card grid",
    search: "Search card...",
    allSets: "All sets",
    allRarities: "All rarities",
    collection: "Collection",
    duplicates: "Duplicates",
    friends: "Friends",
    notifications: "Notifications",
    friendRequestsLabel: "Friend requests",
    messages: "Messages",
    usefulDupes: "Useful duplicates",
    noNotifications: "No new notifications.",
    noMessages: "No new messages.",
    noUsefulDupes: "No useful duplicates reported.",
    openFriend: "Open friend",
    openChat: "Open chat",
    messageReceived: "New message",
    usefulDupeAlert: "Has a duplicate card you need",
    clearNotices: "Clear notices",
    dismiss: "Delete",
    requestsNeedAction: "Accept or decline requests to remove them.",
    tradeProposal: "Trade proposal",
    requestedCard: "Requested card",
    offeredCard: "Offered card",
    sendTradeProposal: "Propose trade",
    noTradeCards: "Both collections need duplicates to propose a trade.",
    progress: "Progress",
    settings: "Settings",
    more: "Menu",
    loading: "Loading...",
    noCards: "No cards found.",
    addMissing: "Add missing",
    deleteOwned: "Delete owned",
    adding: "Adding...",
    deleting: "Deleting...",
    ownedLabel: "owned",
    missingLabel: "missing",
    totalLabel: "total",
    dupesLabel: "dupes",
    addDupe: "+1 dupe",
    removeDupe: "-1 dupe",
    friendsTitle: "Friends & Trading",
    friendSearch: "Search exact nickname...",
    sendRequest: "Send request",
    accept: "Accept",
    decline: "Decline",
    removeFriend: "Remove",
    noFriends: "No friends yet. Search a user by email to start!",
    pendingRequests: "Incoming requests",
    sentRequests: "Sent requests",
    noPendingRequests: "No incoming requests.",
    noSentRequests: "No requests waiting for a response.",
    pendingReply: "Waiting for a response",
    refresh: "Refresh",
    friendshipLoadError: "I cannot load friend requests and friendships.",
    alreadyFriends: "You are already friends.",
    existingPendingRequest: "A request is already pending between you.",
    friendshipRemoved: "Friend removed.",
    requestDeclined: "Request declined.",
    yourFriends: "Your friends",
    viewCollection: "View collection",
    backToMine: "← Back to my collection",
    tradeList: "Trade list",
    tradeDesc: "Cards with available dupes for trading:",
    noTrades: "No dupes available for trading.",
    copyTrade: "Copy list",
    progressTitle: "Progress history",
    progressDesc: "Growth of your collection over time.",
    exportCSV: "Export CSV",
    disconnect: "Sign out",
    accessibility: "Accessibility mode",
    language: "Language",
    theme: "App theme",
    dark: "🌙 Dark",
    light: "☀️ Light",
    saveUsername: "Save username",
    changePassword: "Change password",
    profileSection: "Personal profile",
    customization: "Customization",
    security: "Account security",
    statsRecap: "Stats recap",
  },
};

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [cards, setCards] = useState([]);
  const [cardCatalog, setCardCatalog] = useState(FALLBACK_CARD_CATALOG);
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState("All");
  const [filterRarity, setFilterRarity] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [variantBusy, setVariantBusy] = useState("");
  const [bulkBusy, setBulkBusy] = useState("");
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState("");
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);

  // Nuovi stati per Impostazioni, Tema e Responsività
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rtc_theme") || "dark";
    }
    return "dark";
  });

  const [profileUsername, setProfileUsername] = useState("");
  const [lang, setLang] = useState(() => localStorage.getItem("rtc_lang") || "it");
  const [accessibilityMode, setAccessibilityMode] = useState(() => localStorage.getItem("rtc_a11y") === "1");
  const [activeTab, setActiveTab] = useState("collection"); // "collection"|"friends"|"progress"
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentFriendRequests, setSentFriendRequests] = useState([]);
  const [receivedFriendMessages, setReceivedFriendMessages] = useState([]);
  const [usefulDuplicateAlerts, setUsefulDuplicateAlerts] = useState([]);
  const [socialNotificationsBusy, setSocialNotificationsBusy] = useState(false);
  const [socialNotificationsMessage, setSocialNotificationsMessage] = useState("");
  const [seenSocialNotificationIds, setSeenSocialNotificationIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("rtc_seen_social_notifications") || "[]");
    } catch {
      return [];
    }
  });
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState([]);
  const [friendDataBusy, setFriendDataBusy] = useState(false);
  const [friendDataMessage, setFriendDataMessage] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [friendSearchEmail, setFriendSearchEmail] = useState("");
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [friendSearchBusy, setFriendSearchBusy] = useState(false);
  const [friendSearchMsg, setFriendSearchMsg] = useState("");
  const [viewingFriend, setViewingFriend] = useState(null);
  const [friendStats, setFriendStats] = useState(null);
  const [friendMessages, setFriendMessages] = useState([]);
  const [friendMessagesBusy, setFriendMessagesBusy] = useState(false);
  const [friendMessageSending, setFriendMessageSending] = useState("");
  const [friendMessageStatus, setFriendMessageStatus] = useState("");
  const [snapshots, setSnapshots] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const prevOwnedRef = React.useRef({});
  const friendsRef = React.useRef([]);

  const user = session?.user;

  // Monitoraggio della larghezza dello schermo per la responsività dei menù
  useEffect(() => {
    function handleResize() {
      setIsMobile(
        window.innerWidth < 760 ||
        (window.innerHeight < 520 && window.innerWidth < 1100)
      );
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Applica il tema al documento ogni volta che cambia
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, [currentTheme]);

  const t = T[lang] || T.it;

  // Accessibilità
  useEffect(() => {
    document.documentElement.setAttribute("data-a11y", accessibilityMode ? "1" : "0");
  }, [accessibilityMode]);

  // Carica il nome utente dal profilo quando il user cambia
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("username").eq("id", user.id).single()
      .then(({ data }) => { if (data?.username) setProfileUsername(data.username); });
  }, [user]);

  const loadCatalog = useCallback(async () => {
    const { data, error } = await supabase
      .from("cards")
      .select("card_id,name,rarity,sort_order")
      .order("sort_order");

    const hasNewCatalog =
      !error &&
      data?.length >= TOTAL_CARD_VARIANTS &&
      data.some((card) => card.rarity === "Tear C");

    if (hasNewCatalog) {
      setCardCatalog(data.map((card, index) => enrichCatalogRow(card, index)));
    } else {
      setCardCatalog(FALLBACK_CARD_CATALOG);
    }
  }, []);

  // --- SNAPSHOT GIORNALIERO ---
  const saveSnapshot = useCallback(async (currentUser, count) => {
    if (!currentUser) return;
    await supabase.from("collection_snapshots").upsert(
      { user_id: currentUser.id, snapshot_date: new Date().toISOString().split("T")[0], owned_count: count },
      { onConflict: "user_id,snapshot_date" }
    );
  }, []);
  
  const loadCards = useCallback(async (currentUser = user, { showLoading = true } = {}) => {
    if (!currentUser) {
      setCards([]);
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("card_id");

    if (error) {
      setMessage("Non riesco a caricare la collezione.");
      if (showLoading) {
        setCards([]);
      }
    } else {
      setMessage("");
      setCards(data || []);
    }

    if (showLoading) {
      setLoading(false);
    }

    if (currentUser && data) {
      saveSnapshot(currentUser, data.length);
    }
  }, [user, saveSnapshot]);

  const dupesMap = useMemo(() => {
    const m = new Map();
    for (const c of cards) m.set(c.card_id, c.dupes || 0);
    return m;
  }, [cards]);

  const totalDupes = useMemo(() => [...dupesMap.values()].reduce((a, b) => a + b, 0), [dupesMap]);

  // --- CONFETTI al completamento sezione/rarità ---
  const loadSnapshots = useCallback(async (currentUser) => {
    if (!currentUser) return;
    const { data } = await supabase.from("collection_snapshots")
      .select("snapshot_date,owned_count")
      .eq("user_id", currentUser.id)
      .order("snapshot_date");
    setSnapshots(data || []);
  }, []);

  // --- AMICIZIE ---
  const loadFriends = useCallback(async (currentUser, { showLoading = false } = {}) => {
    if (!currentUser) {
      friendsRef.current = [];
      setFriends([]);
      setFriendRequests([]);
      setSentFriendRequests([]);
      return [];
    }

    if (showLoading) {
      setFriendDataBusy(true);
    }
    setFriendDataMessage("");

    const { data: friendshipRows, error } = await supabase
      .from("friendships")
      .select("id,requester_id,addressee_id,status,created_at")
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
      .in("status", ["accepted", "pending"]);

    if (error) {
      friendsRef.current = [];
      setFriends([]);
      setFriendRequests([]);
      setSentFriendRequests([]);
      setFriendDataMessage(t.friendshipLoadError);
      setFriendDataBusy(false);
      return [];
    }

    const rows = friendshipRows || [];
    const acceptedRows = rows.filter((friendship) => friendship.status === "accepted");
    const incomingRequests = rows.filter(
      (friendship) =>
        friendship.status === "pending" && friendship.addressee_id === currentUser.id
    );
    const outgoingRequests = rows.filter(
      (friendship) =>
        friendship.status === "pending" && friendship.requester_id === currentUser.id
    );
    const visibleProfileIds = new Set();

    acceptedRows.forEach((friendship) => {
      visibleProfileIds.add(
        friendship.requester_id === currentUser.id
          ? friendship.addressee_id
          : friendship.requester_id
      );
    });
    incomingRequests.forEach((friendship) => visibleProfileIds.add(friendship.requester_id));
    outgoingRequests.forEach((friendship) => visibleProfileIds.add(friendship.addressee_id));

    let profilesById = new Map();
    if (visibleProfileIds.size > 0) {
      const { data: visibleProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id,username")
        .in("id", [...visibleProfileIds]);

      if (profileError) {
        setFriendDataMessage(t.friendshipLoadError);
      } else {
        profilesById = new Map(
          (visibleProfiles || []).map((profile) => [profile.id, profile])
        );
      }
    }

    const acceptedFriends = acceptedRows.map((friendship) => {
        const friendId =
          friendship.requester_id === currentUser.id
            ? friendship.addressee_id
            : friendship.requester_id;
        return {
          ...friendship,
          friendId,
          friendProfile: profilesById.get(friendId) || null,
        };
      });

    friendsRef.current = acceptedFriends;
    setFriends(acceptedFriends);
    setFriendRequests(
      incomingRequests.map((request) => ({
        ...request,
        requesterProfile: profilesById.get(request.requester_id) || null,
      }))
    );
    setSentFriendRequests(
      outgoingRequests.map((request) => ({
        ...request,
        addresseeProfile: profilesById.get(request.addressee_id) || null,
      }))
    );
    setFriendDataBusy(false);
    return acceptedFriends;
  }, [t.friendshipLoadError]);

  async function searchFriendByNickname() {
    setFriendSearchBusy(true);
    setFriendSearchMsg("");
    setFriendSearchResult(null);
    const nickname = normalizeNickname(friendSearchEmail);

    if (!nickname) {
      setFriendSearchMsg("Inserisci il nickname esatto da cercare.");
      setFriendSearchBusy(false);
      return;
    }

    const { data: byNickname } = await supabase
      .from("profiles")
      .select("id,username")
      .eq("nickname_key", nickname)
      .neq("id", user.id)
      .maybeSingle();

    if (byNickname) {
      setFriendSearchResult(byNickname);
    } else {
      setFriendSearchMsg("Nessun utente trovato con questo nickname.");
    }
    setFriendSearchBusy(false);
  }

  async function sendFriendRequest(addresseeId) {
    if (!user || !addresseeId) return;

    const knownRelationship = [...friends, ...friendRequests, ...sentFriendRequests].find(
      (friendship) =>
        [friendship.requester_id, friendship.addressee_id].includes(user.id) &&
        [friendship.requester_id, friendship.addressee_id].includes(addresseeId)
    );

    if (knownRelationship?.status === "accepted") {
      setFriendSearchMsg(t.alreadyFriends);
      return;
    }
    if (knownRelationship?.status === "pending") {
      setFriendSearchMsg(t.existingPendingRequest);
      return;
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("friendships")
      .select("id,status")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`
      )
      .in("status", ["accepted", "pending"])
      .limit(1);

    if (existingError) {
      setFriendSearchMsg("Non riesco a verificare l'amicizia. Riprova tra poco.");
      return;
    }
    if (existingRows?.[0]?.status === "accepted") {
      setFriendSearchMsg(t.alreadyFriends);
      await loadFriends(user);
      return;
    }
    if (existingRows?.length > 0) {
      setFriendSearchMsg(t.existingPendingRequest);
      await loadFriends(user);
      return;
    }

    const { error } = await supabase.from("friendships").insert({
      requester_id: user.id,
      addressee_id: addresseeId,
      status: "pending",
    });
    if (error?.code === "23505") {
      setFriendSearchMsg(t.existingPendingRequest);
      await loadFriends(user);
    } else if (error) {
      setFriendSearchMsg("Non riesco a inviare la richiesta. Riprova tra poco.");
      setFriendDataMessage(t.friendshipLoadError);
    } else {
      setFriendSearchMsg("Richiesta inviata!");
      setFriendSearchResult(null);
      setFriendSearchEmail("");
      await loadFriends(user);
    }
  }

  async function respondToRequest(id, accept) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: accept ? "accepted" : "declined" })
      .eq("id", id);
    if (error) {
      setFriendDataMessage(t.friendshipLoadError);
      return;
    }
    await loadFriends(user);
    setFriendDataMessage(accept ? "Amicizia accettata." : t.requestDeclined);
  }

  async function removeFriend(id) {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) {
      setFriendDataMessage(t.friendshipLoadError);
      return;
    }
    await loadFriends(user);
    setViewingFriend(null);
    setFriendStats(null);
    setFriendMessages([]);
    setFriendDataMessage(t.friendshipRemoved);
  }

  async function loadFriendStats(friendId) {
    const { data: cols } = await supabase.from("collections").select("card_id,rarity,dupes").eq("user_id", friendId);
    const { data: prof } = await supabase.from("profiles").select("username").eq("id", friendId).single();
    const friendCards = (cols || []).map((card) => mapOwnedCardToCatalog(card, cardCatalog));
    const owned = friendCards.length;
    const dupes = friendCards.reduce((a, c) => a + (c.dupes || 0), 0);
    const byRarity = RARITY_LABELS.reduce((acc, r) => {
      acc[r] = friendCards.filter(c => c.rarity === r).length;
      return acc;
    }, {});
    setFriendStats({ id: friendId, username: prof?.username || "Amico", owned, dupes, byRarity, cards: friendCards });
    setViewingFriend(friendId);
    await loadFriendMessages(friendId);
  }

  async function loadFriendMessages(friendId) {
    if (!user || !friendId) return;
    setFriendMessagesBusy(true);
    setFriendMessageStatus("");

    const { data, error } = await supabase
      .from("friend_messages")
      .select("id,sender_id,recipient_id,message_code,card_id,offered_card_id,created_at")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true })
      .limit(60);

    if (error) {
      setFriendMessages([]);
      setFriendMessageStatus("Non riesco a caricare i messaggi.");
    } else {
      setFriendMessages(data || []);
    }
    setFriendMessagesBusy(false);
  }

  async function sendFriendMessage(friendId, messageCode, cardId = null, offeredCardId = null) {
    if (!user || !friendId) return false;
    const pendingKey = `${messageCode}:${cardId || ""}:${offeredCardId || ""}`;
    setFriendMessageSending(pendingKey);
    setFriendMessageStatus("");

    const { error } = await supabase.from("friend_messages").insert({
      sender_id: user.id,
      recipient_id: friendId,
      message_code: messageCode,
      card_id: ["need_card", "trade_offer"].includes(messageCode) ? cardId : null,
      offered_card_id: messageCode === "trade_offer" ? offeredCardId : null,
    });

    if (error) {
      setFriendMessageStatus("Non riesco a inviare il messaggio.");
      setFriendMessageSending("");
      return false;
    } else {
      await loadFriendMessages(friendId);
    }
    setFriendMessageSending("");
    return true;
  }

  // --- EXPORT CSV ---
  function exportCSV() {
    const rows = [["card_id","name","rarity","dupes"]];
    for (const card of collectionCards) {
      rows.push([card.card_id, card.name, card.rarity, dupesMap.get(card.card_id) || 0]);
    }
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "collezione.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");

    const credentials = {
      email: authEmail.trim(),
      password: authPassword,
    };

    const response =
      authMode === "login"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (response.error) {
      setAuthMessage(response.error.message);
    } else if (authMode === "register") {
      await supabase.auth.signOut();
      setAuthMode("login");
      setAuthEmail("");
      setAuthPassword("");
      setAuthMessage("Registrazione completata. Controlla la mail, poi accedi.");
    } else {
      setAuthEmail("");
      setAuthPassword("");
    }

    setAuthBusy(false);
  }

  async function logout(scope = "global") {
    await supabase.auth.signOut({ scope });
    setCards([]);
    setSearch("");
  }

  const collectionCards = cards.map((card) => mapOwnedCardToCatalog(card, cardCatalog));

  const duplicateCards = collectionCards
    .filter((card) => (card.dupes || 0) > 0)
    .sort(
      (first, second) =>
        second.dupes - first.dupes ||
        rarityIndex(first.rarity) - rarityIndex(second.rarity) ||
        first.name.localeCompare(second.name)
    );

  const catalogByNameRarity = useMemo(() => {
    const map = new Map();

    for (const card of cardCatalog) {
      const key = makeNameRarityKey(card.name, card.rarity);

      if (!map.has(key)) {
        map.set(key, card);
      }
    }

    return map;
  }, [cardCatalog]);

  const ownershipMap = useMemo(() => {
    const map = new Map();

    for (const card of collectionCards) {
      map.set(card.card_id, card.card_id);

      const catalogMatch = catalogByNameRarity.get(
        makeNameRarityKey(card.name, card.rarity)
      );

      if (catalogMatch && !map.has(catalogMatch.card_id)) {
        map.set(catalogMatch.card_id, card.card_id);
      }
    }

    return map;
  }, [catalogByNameRarity, collectionCards]);

  const loadSocialNotifications = useCallback(async (
    currentUser,
    acceptedFriends = friendsRef.current,
    { showLoading = false } = {}
  ) => {
    if (!currentUser) {
      setReceivedFriendMessages([]);
      setUsefulDuplicateAlerts([]);
      setDismissedNotificationIds([]);
      return;
    }

    const connectedFriends = acceptedFriends || [];
    const friendIds = connectedFriends.map((friendship) => friendship.friendId);

    if (friendIds.length === 0) {
      setReceivedFriendMessages([]);
      setUsefulDuplicateAlerts([]);
      setDismissedNotificationIds([]);
      setSocialNotificationsMessage("");
      setSocialNotificationsBusy(false);
      return;
    }

    if (showLoading) setSocialNotificationsBusy(true);
    setSocialNotificationsMessage("");

    const [
      { data: receivedMessages, error: messagesError },
      { data: duplicateRows, error: duplicatesError },
      { data: dismissedRows, error: dismissalsError },
    ] =
      await Promise.all([
        supabase
          .from("friend_messages")
          .select("id,sender_id,recipient_id,message_code,card_id,offered_card_id,created_at")
          .eq("recipient_id", currentUser.id)
          .in("sender_id", friendIds)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("collections")
          .select("user_id,card_id,rarity,dupes,updated_at")
          .in("user_id", friendIds)
          .gt("dupes", 0),
        supabase
          .from("notification_dismissals")
          .select("notification_key")
          .eq("user_id", currentUser.id)
          .limit(500),
      ]);

    const profilesById = new Map(
      connectedFriends.map((friendship) => [friendship.friendId, friendship.friendProfile])
    );

    if (messagesError) {
      setReceivedFriendMessages([]);
    } else {
      setReceivedFriendMessages(
        (receivedMessages || []).map((messageItem) => ({
          ...messageItem,
          friendId: messageItem.sender_id,
          friendProfile: profilesById.get(messageItem.sender_id) || null,
          notificationId: `message:${messageItem.id}`,
        }))
      );
    }

    if (duplicatesError) {
      setUsefulDuplicateAlerts([]);
    } else {
      setUsefulDuplicateAlerts(
        (duplicateRows || [])
          .map((duplicate) => {
            const mappedCard = mapOwnedCardToCatalog(duplicate, cardCatalog);
            const targetCardId = mappedCard.catalogCardId || mappedCard.card_id;

            return {
              ...mappedCard,
              friendId: duplicate.user_id,
              friendProfile: profilesById.get(duplicate.user_id) || null,
              updated_at: duplicate.updated_at,
              notificationId:
                `duplicate:${currentUser.id}:${duplicate.user_id}:${targetCardId}:${duplicate.dupes}`,
            };
          })
          .filter((alert) => !ownershipMap.has(alert.catalogCardId || alert.card_id))
          .sort((first, second) =>
            String(second.updated_at || "").localeCompare(String(first.updated_at || ""))
          )
      );
    }

    if (dismissalsError) {
      setDismissedNotificationIds([]);
    } else {
      setDismissedNotificationIds(
        (dismissedRows || []).map((dismissal) => dismissal.notification_key)
      );
    }

    if (messagesError || duplicatesError || dismissalsError) {
      setSocialNotificationsMessage("Non riesco a caricare tutte le notifiche social.");
    }
    setSocialNotificationsBusy(false);
  }, [cardCatalog, ownershipMap]);

  const loadSocialNotificationsRef = React.useRef(loadSocialNotifications);

  useEffect(() => {
    loadSocialNotificationsRef.current = loadSocialNotifications;
    if (!user) return undefined;

    const socialNotificationTimer = window.setTimeout(() => {
      loadSocialNotifications(user);
    }, 0);

    return () => window.clearTimeout(socialNotificationTimer);
  }, [loadSocialNotifications, user]);

  const seenNotificationSet = useMemo(
    () => new Set(Array.isArray(seenSocialNotificationIds) ? seenSocialNotificationIds : []),
    [seenSocialNotificationIds]
  );

  const dismissedNotificationSet = useMemo(
    () => new Set(Array.isArray(dismissedNotificationIds) ? dismissedNotificationIds : []),
    [dismissedNotificationIds]
  );

  const visibleReceivedFriendMessages = useMemo(
    () => receivedFriendMessages.filter(
      (notification) => !dismissedNotificationSet.has(notification.notificationId)
    ),
    [dismissedNotificationSet, receivedFriendMessages]
  );

  const visibleUsefulDuplicateAlerts = useMemo(
    () => usefulDuplicateAlerts.filter(
      (notification) => !dismissedNotificationSet.has(notification.notificationId)
    ),
    [dismissedNotificationSet, usefulDuplicateAlerts]
  );

  const unseenPassiveNotificationCount = useMemo(
    () =>
      [...visibleReceivedFriendMessages, ...visibleUsefulDuplicateAlerts].filter(
        (notification) => !seenNotificationSet.has(notification.notificationId)
      ).length,
    [seenNotificationSet, visibleReceivedFriendMessages, visibleUsefulDuplicateAlerts]
  );

  const notificationCount = friendRequests.length + unseenPassiveNotificationCount;

  useEffect(() => {
    localStorage.setItem(
      "rtc_seen_social_notifications",
      JSON.stringify(Array.isArray(seenSocialNotificationIds) ? seenSocialNotificationIds : [])
    );
  }, [seenSocialNotificationIds]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    const currentlyVisibleIds = [...visibleReceivedFriendMessages, ...visibleUsefulDuplicateAlerts].map(
      (notification) => notification.notificationId
    );
    if (currentlyVisibleIds.length === 0) return;

    const rememberTimer = window.setTimeout(() => {
      setSeenSocialNotificationIds((previousIds) => {
        const remembered = new Set(Array.isArray(previousIds) ? previousIds : []);
        let changed = false;

        currentlyVisibleIds.forEach((notificationId) => {
          if (!remembered.has(notificationId)) {
            remembered.add(notificationId);
            changed = true;
          }
        });

        return changed ? Array.from(remembered).slice(-240) : previousIds;
      });
    }, 0);

    return () => window.clearTimeout(rememberTimer);
  }, [isNotificationsOpen, visibleReceivedFriendMessages, visibleUsefulDuplicateAlerts]);

  async function dismissNotifications(notificationIds) {
    if (!user || notificationIds.length === 0) return;

    const rows = notificationIds.map((notificationKey) => ({
      user_id: user.id,
      notification_key: notificationKey,
    }));
    const { error } = await supabase.from("notification_dismissals").upsert(rows, {
      onConflict: "user_id,notification_key",
      ignoreDuplicates: true,
    });

    if (error) {
      setSocialNotificationsMessage("Non riesco a cancellare la notifica.");
      return;
    }

    setDismissedNotificationIds((previousIds) =>
      Array.from(new Set([...(previousIds || []), ...notificationIds]))
    );
    setSocialNotificationsMessage("");
  }

  async function clearPassiveNotifications() {
    await dismissNotifications(
      [...visibleReceivedFriendMessages, ...visibleUsefulDuplicateAlerts].map(
        (notification) => notification.notificationId
      )
    );
  }

  const displayCatalog = useMemo(() => {
    const knownCatalogIds = new Set(cardCatalog.map((card) => card.card_id));
    const manualCards = collectionCards
      .filter((card) => {
        const hasCatalogId = knownCatalogIds.has(card.card_id);
        const hasEquivalentCatalogCard = catalogByNameRarity.has(
          makeNameRarityKey(card.name, card.rarity)
        );

        return !hasCatalogId && !hasEquivalentCatalogCard;
      })
      .map((card) => createManualCatalogRow(card.name, card.rarity, card.card_id));

    return [...cardCatalog, ...manualCards];
  }, [cardCatalog, catalogByNameRarity, collectionCards]);

  const cardGroups = useMemo(() => {
    const groups = new Map();

    for (const card of displayCatalog) {
      const groupId = card.group_id || `${card.section}-${slugify(card.name)}`;

      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          name: card.name,
          section: card.section,
          sectionTitle: card.sectionTitle,
          sort_order: card.sort_order,
          variants: [],
        });
      }

      groups.get(groupId).variants.push(card);
    }

    return Array.from(groups.values())
      .map((group) => {
        const variants = group.variants
          .slice()
          .sort(
            (first, second) =>
              rarityIndex(first.rarity) - rarityIndex(second.rarity) ||
              first.sort_order - second.sort_order
          );
        const ownedCount = variants.filter((variant) =>
          ownershipMap.has(variant.card_id)
        ).length;

        return {
          ...group,
          variants,
          ownedCount,
          variantCount: variants.length,
        };
      })
      .sort(
        (first, second) =>
          first.sort_order - second.sort_order || first.name.localeCompare(second.name)
      );
  }, [displayCatalog, ownershipMap]);

  const filteredGroups = useMemo(() => {
    return cardGroups.filter((group) => {
      const normalizedSearch = normalizeText(search);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        normalizeText(group.name).includes(normalizedSearch) ||
        group.variants.some((variant) =>
          normalizeText(variant.card_id).includes(normalizedSearch)
        );

      const matchesSection =
        filterSection === "All" ? true : group.section === filterSection;

      const matchesRarity =
        filterRarity === "All"
          ? true
          : group.variants.some(
              (variant) =>
                variant.rarity === filterRarity &&
                ownershipMap.has(variant.card_id)
            );

      const hasDupes = group.variants.some((variant) => {
        const ownedId = ownershipMap.get(variant.card_id);
        return ownedId && (dupesMap.get(ownedId) || 0) > 0;
      });
      const matchesStatus =
        filterStatus === "All" ||
        (filterStatus === "Missing" && group.ownedCount < group.variantCount) ||
        (filterStatus === "Complete" && group.ownedCount === group.variantCount) ||
        (filterStatus === "Dupes" && hasDupes);

      return matchesSearch && matchesSection && matchesRarity && matchesStatus;
    });
  }, [cardGroups, dupesMap, filterRarity, filterSection, filterStatus, ownershipMap, search]);

  const rarityStats = useMemo(() => {
    return RARITY_LABELS.reduce((acc, rarity) => {
      const variants = displayCatalog.filter((card) => card.rarity === rarity);

      acc[rarity] = {
        total: variants.length,
        owned: variants.filter((variant) => ownershipMap.has(variant.card_id)).length,
      };

      return acc;
    }, {});
  }, [displayCatalog, ownershipMap]);

  const sectionStats = useMemo(() => {
    return COLLECTION_SECTIONS.map((section) => {
      const variants = displayCatalog.filter((card) => card.section === section.key);
      const owned = variants.filter((variant) =>
        ownershipMap.has(variant.card_id)
      ).length;

      return {
        ...section,
        total: variants.length,
        owned,
        percentage: variants.length > 0 ? Math.round((owned / variants.length) * 100) : 0,
      };
    });
  }, [displayCatalog, ownershipMap]);

  useEffect(() => {
    let resetTimer;

    for (const section of COLLECTION_SECTIONS) {
      const variants = displayCatalog.filter((card) => card.section === section.key);
      const owned = variants.filter((variant) =>
        ownershipMap.has(variant.card_id)
      ).length;
      const previousOwned = prevOwnedRef.current[section.key] || 0;

      if (owned === variants.length && variants.length > 0 && previousOwned < variants.length) {
        setConfettiActive(true);
        resetTimer = window.setTimeout(() => setConfettiActive(false), 3500);
      }

      prevOwnedRef.current[section.key] = owned;
    }

    return () => window.clearTimeout(resetTimer);
  }, [displayCatalog, ownershipMap]);

  const ownedCatalogVariantCount = displayCatalog.filter((variant) =>
    ownershipMap.has(variant.card_id)
  ).length;
  const ownedDisplayCards = cardGroups.filter((group) => group.ownedCount > 0).length;
  const progress = Math.min(
    100,
    Math.round((ownedCatalogVariantCount / TOTAL_CARD_VARIANTS) * 100)
  );

  // --- DOPPIONI ---
  async function incrementDupe(variant) {
    if (!user || variantBusy) return;
    const ownedSourceId = ownershipMap.get(variant.card_id);
    const existing = cards.find((card) => card.card_id === ownedSourceId);
    if (!existing) { await addVariant(variant); return; }
    setVariantBusy(variant.card_id);
    const newDupes = (existing.dupes || 0) + 1;
    const { error } = await supabase
      .from("collections")
      .update({ dupes: newDupes })
      .eq("user_id", user.id)
      .eq("card_id", existing.card_id);
    if (error) {
      setMessage(`Non riesco ad aggiungere un doppione di ${variant.name}.`);
    } else {
      setMessage("");
      await loadCards(user, { showLoading: false });
    }
    setVariantBusy("");
  }

  async function decrementDupe(variant) {
    if (!user || variantBusy) return;
    const ownedSourceId = ownershipMap.get(variant.card_id);
    const existing = cards.find((card) => card.card_id === ownedSourceId);
    if (!existing || (existing.dupes || 0) === 0) return;
    setVariantBusy(variant.card_id);
    const newDupes = Math.max(0, (existing.dupes || 0) - 1);
    const { error } = await supabase
      .from("collections")
      .update({ dupes: newDupes })
      .eq("user_id", user.id)
      .eq("card_id", existing.card_id);
    if (error) {
      setMessage(`Non riesco a rimuovere un doppione di ${variant.name}.`);
    } else {
      setMessage("");
      await loadCards(user, { showLoading: false });
    }
    setVariantBusy("");
  }

  async function addVariant(variant) {
    if (!user) return false;

    setVariantBusy(variant.card_id);

    const { error } = await supabase.from("collections").upsert(
      {
        user_id: user.id,
        card_id: variant.card_id,
        found: true,
        dupes: 0,
        rarity: variant.rarity,
      },
      {
        onConflict: "user_id,card_id",
      }
    );

    if (error) {
      setMessage(`Non riesco ad aggiungere ${variant.name}.`);
      setVariantBusy("");
      return false;
    }

    setMessage("");
    await loadCards(user, { showLoading: false });
    setVariantBusy("");
    return true;
  }

  async function addCopy(variant) {
    if (!user) return;

    const ownedSourceId = ownershipMap.get(variant.card_id);
    if (ownedSourceId) {
      await incrementDupe(variant);
      return;
    }

    await addVariant(variant);
  }

  async function addMissingVariants(group) {
    if (!user || variantBusy) return;

    const missingVariants = group.variants.filter(
      (variant) => !ownershipMap.has(variant.card_id)
    );
    if (missingVariants.length === 0) return;

    setVariantBusy(`group:${group.id}`);
    const { error } = await supabase.from("collections").upsert(
      missingVariants.map((variant) => ({
        user_id: user.id,
        card_id: variant.card_id,
        found: true,
        dupes: 0,
        rarity: variant.rarity,
      })),
      { onConflict: "user_id,card_id" }
    );

    if (error) {
      setMessage(`Non riesco ad aggiungere le varianti mancanti di ${group.name}.`);
    } else {
      setMessage(`Aggiunte ${missingVariants.length} varianti di ${group.name}.`);
      await loadCards(user, { showLoading: false });
    }

    setVariantBusy("");
  }

  async function removeVariant(variant) {
    if (!user || variantBusy) return;

    const ownedSourceId = ownershipMap.get(variant.card_id);
    if (!ownedSourceId) return;

    setVariantBusy(variant.card_id);
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("user_id", user.id)
      .eq("card_id", ownedSourceId);

    if (error) {
      setMessage(`Non riesco a rimuovere ${variant.name}.`);
    } else {
      setMessage("");
      await loadCards(user, { showLoading: false });
    }

    setVariantBusy("");
  }

  async function addAllByRarity(rarity) {
    if (!user) return;

    const missingCards = cardCatalog.filter(
      (card) => card.rarity === rarity && !ownershipMap.has(card.card_id)
    );

    if (missingCards.length === 0) {
      setMessage(`Hai gia tutte le carte ${rarity}.`);
      return;
    }

    setBulkBusy(rarity);

    const rows = missingCards.map((card) => ({
      user_id: user.id,
      card_id: card.card_id,
      found: true,
      dupes: 0,
      rarity: card.rarity,
    }));

    const { error } = await supabase.from("collections").upsert(rows, {
      onConflict: "user_id,card_id",
    });

    if (error) {
      setMessage(`Non riesco ad aggiungere le carte ${rarity}.`);
    } else {
      setMessage(`Aggiunte ${missingCards.length} carte ${rarity}.`);
      await loadCards(user, { showLoading: false });
    }

    setBulkBusy("");
  }

  async function removeAllByRarity(rarity) {
    if (!user) return;

    const idsToDelete = collectionCards
      .filter((card) => card.rarity === rarity)
      .map((card) => card.card_id);

    if (idsToDelete.length === 0) {
      setMessage(`Non hai carte ${rarity} da eliminare.`);
      return;
    }

    setBulkDeleteBusy(rarity);

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("user_id", user.id)
      .in("card_id", idsToDelete);

    if (error) {
      setMessage(`Non riesco a eliminare le carte ${rarity}.`);
    } else {
      setMessage(`Eliminate ${idsToDelete.length} carte ${rarity}.`);
      await loadCards(user, { showLoading: false });
    }

    setBulkDeleteBusy("");
  }

  useEffect(() => {
    let mounted = true;

    const catalogTimer = window.setTimeout(() => {
      loadCatalog();
    }, 0);

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);

      if (!nextSession?.user) {
        setCards([]);
        setProfileUsername("");
        setFriends([]);
        setFriendRequests([]);
        setSentFriendRequests([]);
        friendsRef.current = [];
        setReceivedFriendMessages([]);
        setUsefulDuplicateAlerts([]);
        setDismissedNotificationIds([]);
        setSocialNotificationsMessage("");
        setFriendDataMessage("");
        setIsNotificationsOpen(false);
      }
    });

    return () => {
      mounted = false;
      window.clearTimeout(catalogTimer);
      subscription.unsubscribe();
    };
  }, [loadCatalog]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const loadTimer = window.setTimeout(() => {
      loadCards(user);
    }, 0);

    const relatedDataTimer = window.setTimeout(async () => {
      const currentFriends = await loadFriends(user, { showLoading: true });
      loadSocialNotificationsRef.current(user, currentFriends, { showLoading: true });
      loadSnapshots(user);
    }, 0);

    const channel = supabase
      .channel(`cards-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collections",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadCards(user, { showLoading: false });
        }
      )
      .subscribe();

    const friendshipChannel = supabase
      .channel(`friendships-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
        },
        async () => {
          const currentFriends = await loadFriends(user);
          loadSocialNotificationsRef.current(user, currentFriends);
        }
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`friend-messages-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friend_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          loadSocialNotificationsRef.current(user);
        }
      )
      .subscribe();

    const friendCollectionsChannel = supabase
      .channel(`friend-duplicates-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collections",
        },
        () => {
          loadSocialNotificationsRef.current(user);
        }
      )
      .subscribe();

    const refreshFriendData = async () => {
      if (document.visibilityState === "visible") {
        const currentFriends = await loadFriends(user);
        loadSocialNotificationsRef.current(user, currentFriends);
      }
    };
    const friendRefreshTimer = window.setInterval(refreshFriendData, 15000);
    window.addEventListener("focus", refreshFriendData);
    document.addEventListener("visibilitychange", refreshFriendData);

    return () => {
      window.clearTimeout(loadTimer);
      window.clearTimeout(relatedDataTimer);
      window.clearInterval(friendRefreshTimer);
      window.removeEventListener("focus", refreshFriendData);
      document.removeEventListener("visibilitychange", refreshFriendData);
      supabase.removeChannel(channel);
      supabase.removeChannel(friendshipChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(friendCollectionsChannel);
    };
  }, [loadCards, loadFriends, loadSnapshots, user]);

  if (authLoading) {
    return <PageShell center>Caricamento...</PageShell>;
  }

  if (!user) {
    return (
      <PageShell center>
        <AuthPanel
          authMode={authMode}
          setAuthMode={setAuthMode}
          authEmail={authEmail}
          setAuthEmail={setAuthEmail}
          authPassword={authPassword}
          setAuthPassword={setAuthPassword}
          authMessage={authMessage}
          authBusy={authBusy}
          handleAuth={handleAuth}
        />
      </PageShell>
    );
  }

  return (
    <PageShell isMobile={isMobile}>
      <header style={{ ...headerStyle, ...(isMobile ? mobileHeaderStyle : {}) }}>
        <div>
          <h1 style={{ ...titleStyle, ...(isMobile ? mobileTitleStyle : {}) }}>Release The Creature</h1>
          <p style={subtitleStyle}>
            {t.appSubtitle(TOTAL_DISPLAY_CARDS, TOTAL_CARD_VARIANTS)}
          </p>
        </div>

        <div style={{ ...headerActionsStyle, ...(isMobile ? mobileHeaderActionsStyle : {}) }}>
          <button
            type="button"
            onClick={async () => {
              const willOpen = !isNotificationsOpen;
              setIsNotificationsOpen(willOpen);
              if (willOpen) {
                const currentFriends = await loadFriends(user, { showLoading: true });
                loadSocialNotificationsRef.current(user, currentFriends, { showLoading: true });
              }
            }}
            style={notificationTriggerStyle}
            aria-expanded={isNotificationsOpen}
            aria-label={`${t.notifications}: ${notificationCount}`}
          >
            <span>{t.notifications}</span>
            {notificationCount > 0 && (
              <span style={notificationBadgeStyle}>{notificationCount}</span>
            )}
          </button>

          {!isMobile && (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              style={desktopProfileTriggerStyle}
            >
              <div style={avatarStyle}>
                {(profileUsername || user.email).slice(0, 2).toUpperCase()}
              </div>
              <span style={emailStyle}>{profileUsername || user.email}</span>
            </button>
          )}

          {isNotificationsOpen && (
            <NotificationCenter
              t={t}
              requests={friendRequests}
              messages={visibleReceivedFriendMessages}
              duplicateAlerts={visibleUsefulDuplicateAlerts}
              seenIds={seenNotificationSet}
              cardCatalog={cardCatalog}
              isMobile={isMobile}
              busy={friendDataBusy || socialNotificationsBusy}
              message={friendDataMessage || socialNotificationsMessage}
              onRespond={respondToRequest}
              onDismiss={(notificationId) => dismissNotifications([notificationId])}
              onClear={clearPassiveNotifications}
              onRefresh={async () => {
                const currentFriends = await loadFriends(user, { showLoading: true });
                loadSocialNotificationsRef.current(user, currentFriends, { showLoading: true });
              }}
              onOpenFriend={async (friendId) => {
                setActiveTab("friends");
                setIsNotificationsOpen(false);
                await loadFriendStats(friendId);
              }}
              onOpenFriends={() => {
                setActiveTab("friends");
                setIsNotificationsOpen(false);
              }}
              onClose={() => setIsNotificationsOpen(false)}
            />
          )}
        </div>
      </header>

      {/* CONFETTI */}
      {confettiActive && <ConfettiOverlay />}

      {/* TAB NAVIGATION */}
      {!isMobile && <div style={tabNavStyle}>
        {["collection", "duplicates", "friends", "progress"].map(tab => (
          <button key={tab} type="button"
            onClick={() => setActiveTab(tab)}
            style={{ ...tabBtnStyle, ...(activeTab === tab ? tabBtnActiveStyle : {}) }}
          >
            <span style={tabLabelStyle}>
              {tab === "collection"
                ? t.collection
                : tab === "duplicates"
                  ? t.duplicates
                  : tab === "friends"
                    ? t.friends
                    : t.progress}
              {tab === "friends" && friendRequests.length > 0 && (
                <span style={tabBadgeStyle}>{friendRequests.length}</span>
              )}
            </span>
          </button>
        ))}
      </div>}

      {activeTab === "duplicates" && (
        <DuplicatesPanel
          duplicateCards={duplicateCards}
          totalDupes={totalDupes}
          variantBusy={variantBusy}
          onIncrementDupe={incrementDupe}
          onDecrementDupe={decrementDupe}
          isMobile={isMobile}
        />
      )}

      {activeTab === "friends" && (
        <FriendsPanel
          user={user}
          t={t}
          friends={friends}
          friendRequests={friendRequests}
          sentFriendRequests={sentFriendRequests}
          friendDataBusy={friendDataBusy}
          friendDataMessage={friendDataMessage}
          friendSearchEmail={friendSearchEmail}
          setFriendSearchEmail={setFriendSearchEmail}
          friendSearchResult={friendSearchResult}
          friendSearchBusy={friendSearchBusy}
          friendSearchMsg={friendSearchMsg}
          onSearch={searchFriendByNickname}
          onSendRequest={sendFriendRequest}
          onRespond={respondToRequest}
          onRefresh={() => loadFriends(user, { showLoading: true })}
          onRemove={removeFriend}
          onViewFriend={loadFriendStats}
          viewingFriend={viewingFriend}
          friendStats={friendStats}
          onBackToMine={() => {
            setViewingFriend(null);
            setFriendStats(null);
            setFriendMessages([]);
            setFriendMessageStatus("");
          }}
          collectionCards={collectionCards}
          ownershipMap={ownershipMap}
          friendMessages={friendMessages}
          friendMessagesBusy={friendMessagesBusy}
          friendMessageSending={friendMessageSending}
          friendMessageStatus={friendMessageStatus}
          onSendMessage={sendFriendMessage}
          onRefreshMessages={loadFriendMessages}
          cardCatalog={cardCatalog}
          isMobile={isMobile}
        />
      )}

      {activeTab === "progress" && (
        <ProgressPanel
          t={t}
          snapshots={snapshots}
          onExportCSV={exportCSV}
          ownedCount={ownedCatalogVariantCount}
          totalCount={TOTAL_CARD_VARIANTS}
        />
      )}

      {activeTab === "collection" && <>

      <section style={progressBoxStyle}>
        <div style={progressHeaderStyle}>
          <span>{t.progression}</span>
          <span>
            {ownedCatalogVariantCount}/{TOTAL_CARD_VARIANTS}
          </span>
        </div>

        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${progress}%` }} />
        </div>

        <div style={progressTextStyle}>
          {t.completed(progress, ownedDisplayCards, TOTAL_DISPLAY_CARDS)}
        </div>
      </section>

      <section style={statsGridStyle}>
        {CORE_RARITIES.map((rarity) => (
          <StatCard
            key={rarity.label}
            title={rarity.label}
            value={rarityStats[rarity.label]?.owned || 0}
            total={rarityStats[rarity.label]?.total || 0}
            color={rarity.color}
          />
        ))}
      </section>

      <section style={trackingPanelStyle}>
        <div>
          <h2 style={sectionTitleStyle}>Set collezione</h2>
          <p style={sectionTextStyle}>
            Base 150 x 5, Time Shifted 30, Special 9 x 3, Pre Order 9 x 2.
          </p>
        </div>

        <div style={trackingGridStyle}>
          {sectionStats.map((section) => (
            <div key={section.key} style={trackingCardStyle}>
              <div style={trackingCardHeaderStyle}>
                <span style={trackingNameStyle}>{section.title}</span>
                <span style={trackingPercentStyle}>{section.percentage}%</span>
              </div>

              <div style={trackingBarStyle}>
                <div
                  style={{
                    ...trackingBarFillStyle,
                    width: `${section.percentage}%`,
                  }}
                />
              </div>

              <div style={trackingNumbersStyle}>
                <span>{section.owned} possedute</span>
                <span>{section.total - section.owned} mancanti</span>
                <span>{section.total} totali</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={bulkPanelStyle}>
        <button
          type="button"
          style={bulkPanelHeaderButtonStyle}
          onClick={() => setBulkActionsOpen((open) => !open)}
          aria-expanded={bulkActionsOpen}
        >
          <span>
            <strong style={{ ...sectionTitleStyle, display: "block" }}>Gestione per rarita</strong>
            <span style={bulkPanelSummaryStyle}>
              Aggiungi o elimina molte varianti solo quando ti serve.
            </span>
          </span>
          <span style={expandIndicatorStyle}>{bulkActionsOpen ? "-" : "+"}</span>
        </button>

        {bulkActionsOpen && <div style={bulkGridStyle}>
          {RARITY_DEFINITIONS.map((rarity) => {
            const stats = rarityStats[rarity.label] || { owned: 0, total: 0 };
            const addDisabled = bulkBusy === rarity.label || stats.owned === stats.total;
            const deleteDisabled =
              bulkDeleteBusy === rarity.label || stats.owned === 0;

            return (
              <div key={rarity.label} style={bulkActionCardStyle}>
                <div style={bulkActionHeaderStyle}>
                  <span style={{ color: rarity.color, fontWeight: 900 }}>
                    {rarity.label}
                  </span>
                  <span style={bulkCountStyle}>
                    {stats.owned}/{stats.total}
                  </span>
                </div>

                <div style={bulkActionButtonsStyle}>
                  <button
                    type="button"
                    onClick={() => addAllByRarity(rarity.label)}
                    disabled={addDisabled}
                    style={{
                      ...bulkButtonStyle,
                      borderColor: `${rarity.color}80`,
                      opacity: addDisabled ? 0.55 : 1,
                    }}
                    title={`Aggiungi tutte le varianti mancanti ${rarity.label}`}
                  >
                    {bulkBusy === rarity.label ? "..." : "+ Mancanti"}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAllByRarity(rarity.label)}
                    disabled={deleteDisabled}
                    style={{
                      ...bulkDeleteButtonStyle,
                      opacity: deleteDisabled ? 0.55 : 1,
                    }}
                    title={`Elimina tutte le varianti possedute ${rarity.label}`}
                  >
                    {bulkDeleteBusy === rarity.label
                      ? "..."
                      : "Elimina"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>}
      </section>

      <section style={toolbarStyle}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca carta..."
          style={{ ...inputStyle, ...compactFilterInputStyle, flex: 1, minWidth: isMobile ? "100%" : 220 }}
        />

        <select
          value={filterSection}
          onChange={(event) => {
            setFilterSection(event.target.value);
            setFilterRarity("All");
          }}
          style={{ ...inputStyle, ...compactFilterInputStyle }}
          aria-label="Filtra set"
        >
          <option value="All">Tutti i set</option>
          {COLLECTION_SECTIONS.map((section) => (
            <option key={section.key} value={section.key}>
              {section.title}
            </option>
          ))}
        </select>

        <select
          value={filterRarity}
          onChange={(event) => setFilterRarity(event.target.value)}
          style={{ ...inputStyle, ...compactFilterInputStyle }}
          aria-label="Filtra rarita"
        >
          <option value="All">Tutte le rarita</option>
          {(filterSection === "All"
            ? RARITY_LABELS
            : COLLECTION_SECTION_MAP[filterSection]?.rarities || RARITY_LABELS
          ).map((rarity) => (
            <option key={rarity} value={rarity}>
              {rarity}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
          style={{ ...inputStyle, ...compactFilterInputStyle }}
          aria-label="Filtra stato collezione"
        >
          <option value="All">Tutti gli stati</option>
          <option value="Missing">Da completare</option>
          <option value="Complete">Complete</option>
          <option value="Dupes">Con doppioni</option>
        </select>
      </section>

      {message ? <div style={messageStyle}>{message}</div> : null}

      <section style={cardBrowserStyle}>
        <div style={cardBrowserHeaderStyle}>
          <h2 style={sectionTitleStyle}>Griglia carte</h2>
          <span style={gridCountStyle}>
            {filteredGroups.length}/{cardGroups.length}
          </span>
        </div>
        <div style={compactCardLegendStyle}>
          <span><strong>- / +</strong> gestisce i doppioni</span>
          <span><strong>x</strong> rimuove la variante</span>
        </div>

        {loading ? (
          <EmptyState text="Caricamento..." />
        ) : filteredGroups.length === 0 ? (
          <EmptyState text="Nessuna carta trovata." />
        ) : (
          <SectionedCardGrid
            groups={filteredGroups}
            ownershipMap={ownershipMap}
            variantBusy={variantBusy}
            onAddCopy={addCopy}
            onAddMissingVariants={addMissingVariants}
            onRemoveVariant={removeVariant}
            dupesMap={dupesMap}
            onDecrementDupe={decrementDupe}
            t={t}
          />
        )}
      </section>

      </> }

      {/* Pannello Modale Overlay delle Impostazioni */}
      {isSettingsOpen && (
        <SettingsModal 
          user={user}
          logout={logout}
          currentTheme={currentTheme}
          setCurrentTheme={setCurrentTheme}
          rarityStats={rarityStats}
          isMobile={isMobile}
          onClose={() => setIsSettingsOpen(false)}
          onUsernameSaved={setProfileUsername}
          lang={lang}
          setLang={setLang}
          accessibilityMode={accessibilityMode}
          setAccessibilityMode={setAccessibilityMode}
          t={t}
          onExportCSV={exportCSV}
        />
      )}

      {/* Bottom Bar Mobile Style Navigation */}
      {isMobile && (
        <nav style={{ ...bottomNavigationStyle, gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }} aria-label="Navigazione principale">
          {["collection", "duplicates", "friends", "progress"].map(tab => (
            <button key={tab} type="button" style={{ ...bottomNavTabStyle, borderTop: activeTab === tab ? "2px solid var(--accent-green)" : "2px solid transparent" }} onClick={() => setActiveTab(tab)}>
              <span style={bottomNavLabelStyle}>
                {tab === "collection"
                  ? t.collection
                  : tab === "duplicates"
                    ? t.duplicates
                    : tab === "friends"
                      ? t.friends
                      : t.progress}
                {tab === "friends" && friendRequests.length > 0 && (
                  <span style={tabBadgeStyle}>{friendRequests.length}</span>
                )}
              </span>
            </button>
          ))}
          <button type="button" style={bottomNavTabStyle} onClick={() => setIsSettingsOpen(true)}>
            <span style={bottomNavLabelStyle}>{t.more}</span>
          </button>
        </nav>
      )}
    </PageShell>
  );
}

function AuthPanel({
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authMessage,
  authBusy,
  handleAuth,
}) {
  const isLogin = authMode === "login";

  return (
    <form onSubmit={handleAuth} style={authPanelStyle}>
      <h1 style={{ ...titleStyle, marginBottom: 8 }}>Release The Creature</h1>
      <p style={{ ...subtitleStyle, marginBottom: 24 }}>
        Accedi per vedere solo la tua collezione privata.
      </p>

      <div style={authSwitchStyle}>
        <button
          type="button"
          onClick={() => setAuthMode("login")}
          style={isLogin ? switchActiveStyle : switchButtonStyle}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setAuthMode("register")}
          style={!isLogin ? switchActiveStyle : switchButtonStyle}
        >
          Registrati
        </button>
      </div>

      <input
        type="email"
        value={authEmail}
        onChange={(event) => setAuthEmail(event.target.value)}
        placeholder="Email"
        autoComplete={isLogin ? "email" : "off"}
        required
        style={{ ...inputStyle, width: "100%" }}
      />

      <input
        type="password"
        value={authPassword}
        onChange={(event) => setAuthPassword(event.target.value)}
        placeholder={isLogin ? "Password" : "Password sicura"}
        autoComplete={isLogin ? "current-password" : "off"}
        minLength={isLogin ? undefined : PASSWORD_MIN_LENGTH}
        pattern={isLogin ? undefined : PASSWORD_PATTERN}
        title={isLogin ? undefined : PASSWORD_REQUIREMENTS}
        required
        style={{ ...inputStyle, width: "100%" }}
      />

      {!isLogin ? (
        <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: -4 }}>
          {PASSWORD_REQUIREMENTS}
        </div>
      ) : null}

      {authMessage ? <div style={messageStyle}>{authMessage}</div> : null}

      <button type="submit" disabled={authBusy} style={buttonStyle}>
        {authBusy ? "Attendi..." : isLogin ? "Entra" : "Crea account"}
      </button>
    </form>
  );
}

function PageShell({ children, center = false, isMobile = false }) {
  return (
    <div style={{
      ...pageStyle,
      padding: isMobile
        ? "max(14px, env(safe-area-inset-top)) 12px calc(86px + env(safe-area-inset-bottom))"
        : pageStyle.padding,
    }}>
      <main style={center ? centerShellStyle : shellStyle}>{children}</main>
    </div>
  );
}

function StatCard({ title, value, total, color }) {
  return (
    <article style={{ ...statCardStyle, borderColor: `${color}55` }}>
      <div style={statLabelStyle}>{title}</div>
      <div style={{ ...statValueStyle, color }}>{value}</div>
      <div style={statTotalStyle}>su {total}</div>
    </article>
  );
}

function SectionedCardGrid({ groups, ownershipMap, variantBusy, onAddCopy, onAddMissingVariants, onRemoveVariant, dupesMap, onDecrementDupe, t }) {
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(COLLECTION_SECTIONS.map((section) => [section.key, true]))
  );

  // Raggruppa per sezione mantenendo l'ordine
  const sections = useMemo(() => {
    const map = new Map();
    for (const group of groups) {
      const key = group.section;
      if (!map.has(key)) {
        map.set(key, { key, title: group.sectionTitle, groups: [] });
      }
      map.get(key).groups.push(group);
    }
    return Array.from(map.values());
  }, [groups]);

  function toggleSection(key) {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {sections.map((section) => {
        const isOpen = !collapsed[section.key];
        const ownedInSection = section.groups.filter((g) => g.ownedCount > 0).length;
        return (
          <div key={section.key}>
            <button
              type="button"
              onClick={() => toggleSection(section.key)}
              style={sectionFolderHeaderStyle}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18, transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>▶</span>
                <span style={{ fontWeight: 900, fontSize: 17, color: "var(--text-heading)" }}>{section.title}</span>
              </span>
              <span style={{ color: "#a9b4c4", fontSize: 13, fontWeight: 700 }}>
                {ownedInSection}/{section.groups.length} carte
              </span>
            </button>
            {isOpen && (
              <div style={{ ...cardGridStyle, marginTop: 12 }}>
                {section.groups.map((group) => (
                  <CollectionCard
                    key={group.id}
                    group={group}
                    ownershipMap={ownershipMap}
                    variantBusy={variantBusy}
                    onAddCopy={onAddCopy}
                    onAddMissingVariants={onAddMissingVariants}
                    onRemoveVariant={onRemoveVariant}
                    dupesMap={dupesMap}
                    onDecrementDupe={onDecrementDupe}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CollectionCard({ group, ownershipMap, variantBusy, onAddCopy, onAddMissingVariants, onRemoveVariant, dupesMap, onDecrementDupe }) {
  const activeVariant =
    group.variants.find((variant) => ownershipMap.has(variant.card_id)) ||
    group.variants[0];
  const activeColor = getRarityMeta(activeVariant.rarity).color;
  const imageSeed = encodeURIComponent(`${group.section}-${group.name}`);
  const isOwned = group.ownedCount > 0;
  const missingVariantCount = group.variantCount - group.ownedCount;
  const groupBusy = variantBusy === `group:${group.id}`;

  return (
    <article
      id={`card-${group.id}`}
      style={{
        ...collectionCardStyle,
        borderColor: isOwned ? `${activeColor}80` : "rgba(255,255,255,0.1)",
      }}
    >
      <div style={cardImageWrapStyle}>
        <img
          src={`https://robohash.org/${imageSeed}.png?set=set2`}
          alt={group.name}
          style={cardImageStyle}
        />
        <span style={sectionBadgeStyle}>{group.sectionTitle}</span>
      </div>

      <div style={collectionCardBodyStyle}>
        <div style={collectionCardTopStyle}>
          <h3 style={collectionCardTitleStyle}>{group.name}</h3>
          <span style={cardCountPillStyle}>
            {group.ownedCount}/{group.variantCount}
          </span>
        </div>

        {group.section === "special" && missingVariantCount > 0 && (
          <button
            type="button"
            style={addMissingVariantsButtonStyle}
            onClick={() => onAddMissingVariants(group)}
            disabled={groupBusy}
          >
            {groupBusy ? "Aggiunta..." : `Aggiungi mancanti (${missingVariantCount})`}
          </button>
        )}

        <div style={rarityPipGridStyle}>
          {group.variants.map((variant) => {
            const rarity = getRarityMeta(variant.rarity);
            const active = ownershipMap.has(variant.card_id);
            const busy = groupBusy || variantBusy === variant.card_id;
            const dupes = dupesMap?.get(variant.card_id) || 0;

            return (
              <div
                key={variant.card_id}
                style={getRarityPipStyle(rarity.color, active, busy)}
              >
                <span style={{ ...rarityCodeStyle, color: active ? rarity.color : "var(--text-secondary)" }}>
                  <span style={getRarityDotStyle(rarity.color, active)} />
                  <span>{rarity.short}</span>
                </span>
                <span style={dupeCountStyle} title={active ? "Doppioni posseduti" : "Variante mancante"}>
                  {active ? `x${dupes}` : "--"}
                </span>
                <div style={dupeRowStyle}>
                  {active && (
                    <button
                      type="button"
                      style={{ ...dupeSmallBtnStyle, opacity: dupes === 0 ? 0.45 : 1 }}
                      onClick={() => onDecrementDupe(variant)}
                      disabled={busy || dupes === 0}
                      aria-label={`Rimuovi un doppione ${group.name} ${variant.rarity}`}
                      title="Rimuovi una doppia"
                    >
                      -
                    </button>
                  )}
                <button
                  type="button"
                  title={active ? `${variant.rarity}: aggiungi una doppia` : `${variant.rarity}: aggiungi carta`}
                  aria-label={active ? `${group.name} ${variant.rarity}, aggiungi doppia` : `${group.name} ${variant.rarity}, aggiungi`}
                  onClick={() => onAddCopy(variant)}
                  disabled={busy}
                    style={{ ...dupeSmallBtnStyle, ...addCompactVariantButtonStyle, borderColor: `${rarity.color}80` }}
                >
                    +
                </button>
                {active && (
                      <button
                        type="button"
                        style={removeVariantButtonStyle}
                        onClick={() => onRemoveVariant(variant)}
                        disabled={busy}
                        aria-label={`Rimuovi ${group.name} ${variant.rarity} dalla collezione`}
                        title="Rimuovi la carta e le sue doppie"
                      >
                        x
                      </button>
                )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ text }) {
  return <div style={emptyStyle}>{text}</div>;
}

function NotificationCenter({
  t,
  requests,
  messages,
  duplicateAlerts,
  seenIds,
  cardCatalog,
  isMobile,
  busy,
  message,
  onRespond,
  onDismiss,
  onClear,
  onRefresh,
  onOpenFriend,
  onOpenFriends,
  onClose,
}) {
  const hasNotifications =
    requests.length > 0 || messages.length > 0 || duplicateAlerts.length > 0;
  const hasClearableNotifications = messages.length > 0 || duplicateAlerts.length > 0;

  return (
    <section
      style={{
        ...notificationCenterStyle,
        ...(isMobile ? mobileNotificationCenterStyle : {}),
      }}
      aria-label={t.notifications}
    >
      <div style={notificationHeaderStyle}>
        <h2 style={{ ...sectionTitleStyle, fontSize: 17 }}>{t.notifications}</h2>
        <button type="button" onClick={onClose} style={modalCloseButtonStyle}>X</button>
      </div>
      <div style={notificationBodyStyle}>
        {message && <div style={{ ...messageStyle, marginBottom: 0 }}>{message}</div>}
        {!hasNotifications ? (
          <div style={notificationEmptyStyle}>{busy ? t.loading : t.noNotifications}</div>
        ) : null}

        {requests.length > 0 && (
          <section style={notificationGroupStyle}>
            <h3 style={notificationGroupTitleStyle}>{t.friendRequestsLabel}</h3>
            {requests.map((request) => {
              const username =
                request.requesterProfile?.username || request.requester_id.slice(0, 8);
              return (
                <div key={request.id} style={notificationItemStyle}>
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--text-heading)" }}>{username}</div>
                    <div style={notificationMetaStyle}>{t.pendingRequests}</div>
                  </div>
                  <div style={notificationActionStyle}>
                    <button type="button" onClick={() => onRespond(request.id, true)} style={compactConfirmButtonStyle}>
                      {t.accept}
                    </button>
                    <button type="button" onClick={() => onRespond(request.id, false)} style={compactDismissButtonStyle}>
                      {t.decline}
                    </button>
                  </div>
                </div>
              );
            })}
            <div style={notificationHintStyle}>{t.requestsNeedAction}</div>
          </section>
        )}

        {messages.length > 0 && (
          <section style={notificationGroupStyle}>
            <h3 style={notificationGroupTitleStyle}>{t.messages}</h3>
            {messages.map((notification) => {
              const username =
                notification.friendProfile?.username || notification.sender_id.slice(0, 8);
              const isUnread = !seenIds.has(notification.notificationId);

              return (
                <div key={notification.notificationId} style={notificationItemStyle}>
                  <div style={notificationContentStyle}>
                    <div style={notificationTitleRowStyle}>
                      <strong style={{ color: "var(--text-heading)" }}>{username}</strong>
                      <span style={notificationKindPillStyle}>
                        {notification.message_code === "trade_offer" ? t.tradeProposal : t.messages}
                      </span>
                      {isUnread && <span style={newNotificationPillStyle}>Nuovo</span>}
                    </div>
                    <div style={notificationTextStyle}>
                      {quickMessageText(notification, cardCatalog)}
                    </div>
                  </div>
                  <div style={notificationActionStyle}>
                    <button
                      type="button"
                      onClick={() => onOpenFriend(notification.friendId)}
                      style={compactConfirmButtonStyle}
                    >
                      {t.openChat}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismiss(notification.notificationId)}
                      style={compactDismissButtonStyle}
                    >
                      {t.dismiss}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {duplicateAlerts.length > 0 && (
          <section style={notificationGroupStyle}>
            <h3 style={notificationGroupTitleStyle}>{t.usefulDupes}</h3>
            {duplicateAlerts.map((notification) => {
              const username =
                notification.friendProfile?.username || notification.friendId.slice(0, 8);
              const isUnread = !seenIds.has(notification.notificationId);

              return (
                <div key={notification.notificationId} style={notificationItemStyle}>
                  <div style={notificationContentStyle}>
                    <div style={notificationTitleRowStyle}>
                      <strong style={{ color: "var(--text-heading)" }}>{username}</strong>
                      <span style={notificationKindPillStyle}>{t.usefulDupes}</span>
                      {isUnread && <span style={newNotificationPillStyle}>Nuovo</span>}
                    </div>
                    <div style={notificationTextStyle}>
                      Ti serve {notification.name} - {notification.rarity}; ne ha {notification.dupes} in piu.
                    </div>
                  </div>
                  <div style={notificationActionStyle}>
                    <button
                      type="button"
                      onClick={() => onOpenFriend(notification.friendId)}
                      style={compactConfirmButtonStyle}
                    >
                      {t.openChat}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDismiss(notification.notificationId)}
                      style={compactDismissButtonStyle}
                    >
                      {t.dismiss}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        <div style={notificationFooterStyle}>
          {hasClearableNotifications && (
            <button type="button" onClick={onClear} style={compactDismissButtonStyle}>
              {t.clearNotices}
            </button>
          )}
          <button type="button" onClick={onRefresh} style={compactNoticeButtonStyle}>
            {busy ? t.loading : t.refresh}
          </button>
          <button type="button" onClick={onOpenFriends} style={compactConfirmButtonStyle}>
            {t.friends}
          </button>
        </div>
      </div>
    </section>
  );
}

// Componente dedicato per il Modale Impostazioni
function SettingsModal({ user, logout, currentTheme, setCurrentTheme, rarityStats, isMobile, onClose, onUsernameSaved, lang, setLang, accessibilityMode, setAccessibilityMode, t, onExportCSV }) {
  const [newPassword, setNewPassword] = useState("");
  const [passwordNonce, setPasswordNonce] = useState("");
  const [needsPasswordNonce, setNeedsPasswordNonce] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [username, setUsername] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteAccountBusy, setDeleteAccountBusy] = useState(false);
  const [deleteAccountMessage, setDeleteAccountMessage] = useState("");

  // Carica il profilo esistente all'apertura
  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (data?.username) setUsername(data.username);
      setProfileLoaded(true);
    }
    loadProfile();
  }, [user.id]);

  async function handleProfileSave(e) {
    e.preventDefault();
    const cleanUsername = username.trim();
    if (cleanUsername.length < 3) {
      setProfileMessage("Errore: il nickname deve avere almeno 3 caratteri.");
      return;
    }
    setProfileBusy(true);
    setProfileMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({ username: cleanUsername, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (error?.code === "23505") {
      setProfileMessage("Errore: questo nickname e gia utilizzato.");
    } else if (error) {
      setProfileMessage(`Errore: ${error.message}`);
    } else {
      setUsername(cleanUsername);
      setProfileMessage("Nickname aggiornato!");
      if (onUsernameSaved) onUsernameSaved(cleanUsername);
    }
    setProfileBusy(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "ELIMINA") return;
    setDeleteAccountBusy(true);
    setDeleteAccountMessage("");

    const { error } = await supabase.functions.invoke("delete-account", {
      body: { confirm: true },
    });

    if (error) {
      setDeleteAccountMessage("Errore: non e stato possibile eliminare l'account.");
      setDeleteAccountBusy(false);
      return;
    }

    await logout("local");
    onClose();
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordMessage("");

    const passwordUpdate = { password: newPassword };
    if (needsPasswordNonce) {
      passwordUpdate.nonce = passwordNonce.trim();
    }
    const { error } = await supabase.auth.updateUser(passwordUpdate);

    if (error?.code === "reauthentication_needed") {
      const { error: reauthenticateError } = await supabase.auth.reauthenticate();
      if (reauthenticateError) {
        setPasswordMessage(`Errore: ${reauthenticateError.message}`);
      } else {
        setNeedsPasswordNonce(true);
        setPasswordMessage("Controlla la tua email: inserisci il codice ricevuto per confermare il cambio password.");
      }
    } else if (error) {
      setPasswordMessage(`Errore: ${error.message}`);
    } else {
      setPasswordMessage("Password aggiornata correttamente.");
      setNewPassword("");
      setPasswordNonce("");
      setNeedsPasswordNonce(false);
    }
    setPasswordBusy(false);
  }

  function handleThemeToggle() {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setCurrentTheme(nextTheme);
    localStorage.setItem("rtc_theme", nextTheme);
  }

  return (
    <div style={modalOverlayStyle}>
      <div style={{
        ...modalContainerStyle,
        borderRadius: isMobile ? "16px 16px 0 0" : 12,
        width: isMobile ? "100%" : "min(460px, 100%)",
      }}>
        <div style={modalHeaderStyle}>
          <h2 style={{ ...sectionTitleStyle, fontSize: 22 }}>Impostazioni</h2>
          <button type="button" onClick={onClose} style={modalCloseButtonStyle}>✕</button>
        </div>

        <div style={modalBodyStyle}>
          {/* Sottosezione Profilo */}
          <div style={settingsSectionBoxStyle}>
            <h3 style={settingsSectionTitleStyle}>Profilo personale</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6 }}>
              <div style={{ ...avatarStyle, width: 48, height: 48, fontSize: 18 }}>
                {(username || user.email).slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                {username && (
                  <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 2 }}>{username}</div>
                )}
                <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)", fontSize: username ? 12 : 15 }}>{user.email}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>ID: {user.id.slice(0, 8)}...</div>
              </div>
            </div>

            {profileLoaded && (
              <form onSubmit={handleProfileSave} style={{ display: "grid", gap: 8, marginTop: 6 }}>
                <input
                  type="text"
                  placeholder="Nickname univoco"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={32}
                  required
                  style={{ ...inputStyle, padding: "10px 12px", minHeight: 44, fontSize: 15 }}
                />
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  Gli amici useranno questo nickname per trovarti.
                </div>
                <button type="submit" disabled={profileBusy} style={inlineFormSubmitStyle}>
                  {profileBusy ? "Salvataggio..." : "Salva nickname"}
                </button>
                {profileMessage && (
                  <div style={{
                    ...messageStyle,
                    marginBottom: 0,
                    padding: 8,
                    fontSize: 13,
                    background: profileMessage.startsWith("Errore") ? "rgba(248,113,113,0.12)" : "rgba(125,223,143,0.12)",
                    borderColor: profileMessage.startsWith("Errore") ? "rgba(248,113,113,0.35)" : "rgba(125,223,143,0.35)",
                    color: profileMessage.startsWith("Errore") ? "var(--danger-text)" : "var(--success-text)"
                  }}>
                    {profileMessage}
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Sottosezione Interfaccia / Preferenze */}
          <div style={settingsSectionBoxStyle}>
            <h3 style={settingsSectionTitleStyle}>{t.customization}</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-primary)" }}>{t.theme}</span>
              <button type="button" onClick={handleThemeToggle} style={inlineThemeToggleStyle}>
                {currentTheme === "dark" ? t.dark : t.light}
              </button>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-primary)" }}>{t.language}</span>
              <div style={{ display: "flex", gap: 6 }}>
                {["it","en"].map(l => (
                  <button key={l} type="button" onClick={() => { setLang(l); localStorage.setItem("rtc_lang", l); }}
                    style={{ ...inlineThemeToggleStyle, fontWeight: lang === l ? 900 : 600, opacity: lang === l ? 1 : 0.5 }}>
                    {l === "it" ? "🇮🇹 IT" : "🇬🇧 EN"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-primary)" }}>{t.accessibility}</span>
              <button type="button" onClick={() => { const next = !accessibilityMode; setAccessibilityMode(next); localStorage.setItem("rtc_a11y", next ? "1" : "0"); }}
                style={{ ...inlineThemeToggleStyle, background: accessibilityMode ? "var(--accent-green)" : "var(--surface-1)", color: accessibilityMode ? "#080a0f" : "var(--text-primary)" }}>
                {accessibilityMode ? "✓ ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Sottosezione Cambia Password */}
          <div style={settingsSectionBoxStyle}>
            <h3 style={settingsSectionTitleStyle}>Sicurezza account</h3>
            <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: 10, marginTop: 6 }}>
              <input
                type="password"
                placeholder="Nuova password sicura"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={PASSWORD_MIN_LENGTH}
                pattern={PASSWORD_PATTERN}
                title={PASSWORD_REQUIREMENTS}
                required
                style={{ ...inputStyle, padding: "10px 12px", minHeight: 44, fontSize: 15 }}
              />
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {PASSWORD_REQUIREMENTS}
              </div>
              {needsPasswordNonce && (
                <input
                  type="text"
                  placeholder="Codice ricevuto via email"
                  value={passwordNonce}
                  onChange={(e) => setPasswordNonce(e.target.value)}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                  style={{ ...inputStyle, padding: "10px 12px", minHeight: 44, fontSize: 15 }}
                />
              )}
              <button type="submit" disabled={passwordBusy} style={inlineFormSubmitStyle}>
                {passwordBusy ? "Aggiornamento..." : needsPasswordNonce ? "Conferma cambio password" : "Cambia password"}
              </button>
              {passwordMessage && (
                <div style={{ 
                  ...messageStyle, 
                  marginBottom: 0, 
                  padding: 8, 
                  fontSize: 13,
                  background: passwordMessage.startsWith("Errore") ? "rgba(248,113,113,0.12)" : "rgba(125,223,143,0.12)",
                  borderColor: passwordMessage.startsWith("Errore") ? "rgba(248,113,113,0.35)" : "rgba(125,223,143,0.35)",
                  color: passwordMessage.startsWith("Errore") ? "var(--danger-text)" : "var(--success-text)"
                }}>
                  {passwordMessage}
                </div>
              )}
            </form>
          </div>

          {/* Sottosezione Statistiche Personali */}
          <div style={settingsSectionBoxStyle}>
            <h3 style={settingsSectionTitleStyle}>Riepilogo statistiche</h3>
            <div style={inlineStatsContainerStyle}>
              {Object.entries(rarityStats).map(([rarityName, stat]) => {
                const meta = getRarityMeta(rarityName);
                return (
                  <div key={rarityName} style={inlineStatRowStyle}>
                    <span style={{ color: meta.color, fontWeight: 700 }}>{rarityName}</span>
                    <span style={{ fontWeight: 800 }}>{stat.owned} <span style={{ color: "#5d6b7d", fontWeight: 500 }}>/</span> {stat.total}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export CSV */}
          <button type="button" onClick={onExportCSV} style={{ ...inlineFormSubmitStyle, width: "100%", textAlign: "center" }}>
            💾 {t.exportCSV}
          </button>

          {/* Bottone Logout */}
          <button 
            type="button" 
            onClick={() => { logout(); onClose(); }} 
            style={{ ...bulkDeleteButtonStyle, width: "100%", marginTop: 4 }}
          >
            {t.disconnect}
          </button>

          <div style={{ ...settingsSectionBoxStyle, borderColor: "var(--danger-border)" }}>
            <h3 style={{ ...settingsSectionTitleStyle, color: "var(--danger-text)" }}>Elimina account</h3>
            {!deleteAccountOpen ? (
              <button type="button" onClick={() => setDeleteAccountOpen(true)} style={{ ...bulkDeleteButtonStyle, width: "100%" }}>
                Elimina il mio account
              </button>
            ) : (
              <>
                <div style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.45 }}>
                  L'eliminazione e definitiva: saranno rimossi profilo, collezione, amicizie e messaggi.
                </div>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder="Scrivi ELIMINA per confermare"
                  autoComplete="off"
                  style={{ ...inputStyle, padding: "10px 12px", minHeight: 44, fontSize: 15 }}
                />
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteAccountBusy || deleteConfirmation !== "ELIMINA"}
                  style={{
                    ...bulkDeleteButtonStyle,
                    width: "100%",
                    opacity: deleteAccountBusy || deleteConfirmation !== "ELIMINA" ? 0.5 : 1,
                  }}
                >
                  {deleteAccountBusy ? "Eliminazione..." : "Elimina definitivamente"}
                </button>
                {deleteAccountMessage && <div style={{ ...messageStyle, color: "var(--danger-text)" }}>{deleteAccountMessage}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function createFallbackCatalog() {
  return COLLECTION_SECTIONS.flatMap((section, sectionIndex) =>
    Array.from({ length: section.count }, (_, cardIndex) => {
      const cardNumber = cardIndex + 1;
      const name = section.getName(cardNumber);

      return section.rarities.map((rarity, rarityPosition) => ({
        card_id: buildVariantId(section.key, cardNumber, rarity),
        name,
        rarity,
        section: section.key,
        sectionTitle: section.title,
        group_id: `${section.key}-${padCardNumber(cardNumber)}`,
        sort_order: sectionIndex * 10000 + cardNumber * 100 + rarityPosition,
      }));
    }).flat()
  );
}

function enrichCatalogRow(row, index) {
  const rarity = normalizeRarity(row.rarity);
  const section = row.section || inferSectionFromRarity(rarity);
  const name = row.name || deriveNameFromCardId(row.card_id, rarity);

  return {
    ...row,
    name,
    rarity,
    section,
    sectionTitle: getSectionTitle(section),
    group_id: row.group_id || `${section}-${slugify(name)}`,
    sort_order:
      typeof row.sort_order === "number"
        ? row.sort_order
        : makeSortOrder(section, name, rarity, index),
  };
}

function createManualCatalogRow(name, rarity, cardId) {
  const cleanName = sanitizeManualName(name);
  const normalizedRarity = normalizeRarity(rarity);

  return {
    card_id: cardId || makeCustomVariantId(cleanName, normalizedRarity),
    name: cleanName,
    rarity: normalizedRarity,
    section: "custom",
    sectionTitle: "Carte manuali",
    group_id: `custom-${slugify(cleanName)}`,
    sort_order: 900000 + rarityIndex(normalizedRarity),
  };
}

function buildVariantId(sectionKey, index, rarity) {
  return `${sectionKey}-${padCardNumber(index)}-${slugify(rarity)}`;
}

function makeCustomVariantId(name, rarity) {
  return `${CUSTOM_CARD_PREFIX}${sanitizeManualName(name)}::${rarity}`;
}

function deriveNameFromCardId(cardId, rarity) {
  const rawCardId = String(cardId || "Carta manuale");

  if (rawCardId.startsWith(CUSTOM_CARD_PREFIX)) {
    const payload = rawCardId.slice(CUSTOM_CARD_PREFIX.length);
    const separatorIndex = payload.lastIndexOf("::");

    if (separatorIndex > 0) {
      return payload.slice(0, separatorIndex);
    }
  }

  const legacyPrefix = Object.entries(LEGACY_RARITY_MAP).find(
    ([legacyRarity, mappedRarity]) =>
      mappedRarity === rarity && rawCardId.startsWith(`${legacyRarity} `)
  );

  if (legacyPrefix) {
    return rawCardId.slice(legacyPrefix[0].length + 1);
  }

  const suffix = RARITY_LABELS.find((label) => rawCardId.endsWith(` - ${label}`));

  if (suffix) {
    return rawCardId.slice(0, -` - ${suffix}`.length);
  }

  return rawCardId;
}

function mapOwnedCardToCatalog(card, catalog) {
  const rarity = normalizeRarity(card.rarity);
  const fallbackName = deriveNameFromCardId(card.card_id, rarity);
  const catalogCard =
    catalog.find((entry) => entry.card_id === card.card_id) ||
    catalog.find((entry) => entry.rarity === rarity && entry.name === fallbackName);

  return {
    ...card,
    name: catalogCard?.name || fallbackName,
    rarity,
    catalogCardId: catalogCard?.card_id || card.card_id,
    section: catalogCard?.section || inferSectionFromRarity(rarity),
    sectionTitle: catalogCard?.sectionTitle || getSectionTitle(inferSectionFromRarity(rarity)),
    group_id: catalogCard?.group_id || `${inferSectionFromRarity(rarity)}-${slugify(fallbackName)}`,
    sort_order: catalogCard?.sort_order || 900000 + rarityIndex(rarity),
  };
}

function buildDuplicateSections(cards) {
  const sections = new Map();

  for (const card of cards) {
    const descriptor = duplicateSectionDescriptor(card);
    if (!sections.has(descriptor.key)) {
      sections.set(descriptor.key, { ...descriptor, groups: new Map(), dupes: 0 });
    }

    const section = sections.get(descriptor.key);
    const groupKey = card.group_id || `${card.section}-${card.name}`;
    if (!section.groups.has(groupKey)) {
      section.groups.set(groupKey, {
        id: groupKey,
        name: card.name,
        sort_order: card.sort_order,
        variants: [],
        dupes: 0,
      });
    }

    const group = section.groups.get(groupKey);
    group.variants.push(card);
    group.dupes += card.dupes || 0;
    section.dupes += card.dupes || 0;
  }

  return Array.from(sections.values())
    .map((section) => ({
      ...section,
      groups: Array.from(section.groups.values())
        .map((group) => ({
          ...group,
          variants: group.variants.sort(
            (first, second) => rarityIndex(first.rarity) - rarityIndex(second.rarity)
          ),
        }))
        .sort(
          (first, second) =>
            first.sort_order - second.sort_order || first.name.localeCompare(second.name)
        ),
    }))
    .sort((first, second) => first.order - second.order);
}

function duplicateSectionDescriptor(card) {
  if (card.section === "main") {
    return { key: "main", title: "Collezione base", order: 0 };
  }
  if (card.section === "time-shifted") {
    return { key: "time-shifted", title: "Time Shifted", order: 1 };
  }
  if (card.section === "special") {
    return { key: `special-${slugify(card.rarity)}`, title: `Special Card - ${card.rarity}`, order: 2 + rarityIndex(card.rarity) };
  }
  if (card.section === "pre-order") {
    return { key: `pre-order-${slugify(card.rarity)}`, title: `Pre Order - ${card.rarity}`, order: 20 + rarityIndex(card.rarity) };
  }
  return { key: "custom", title: card.sectionTitle || "Carte manuali", order: 99 };
}

function quickMessageText(message, catalog) {
  if (message.message_code === "need_card") {
    const cardName = messageCardName(message.card_id, catalog);
    return `Mi serve ${cardName}. Possiamo scambiarla?`;
  }

  if (message.message_code === "trade_offer") {
    const requestedCard = messageCardName(message.card_id, catalog);
    const offeredCard = messageCardName(message.offered_card_id, catalog);
    return `Proposta: ti offro ${offeredCard} per ${requestedCard}.`;
  }

  return (
    QUICK_MESSAGE_TEMPLATES.find((template) => template.code === message.message_code)?.text ||
    "Messaggio rapido"
  );
}

function messageCardName(cardId, catalog) {
  const card = catalog.find((catalogCard) => catalogCard.card_id === cardId);
  return card
    ? `${card.name} (${card.rarity})`
    : deriveNameFromCardId(cardId, "");
}

function sanitizeManualName(name) {
  return String(name || "Carta manuale").replace(/::/g, " ").trim() || "Carta manuale";
}

function inferSectionFromRarity(rarity) {
  return (
    COLLECTION_SECTIONS.find((section) => section.rarities.includes(rarity))?.key ||
    "custom"
  );
}

function getSectionTitle(sectionKey) {
  return COLLECTION_SECTION_MAP[sectionKey]?.title || "Carte manuali";
}

function normalizeRarity(rarity) {
  return LEGACY_RARITY_MAP[rarity] || rarity || "Tear C";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function makeNameRarityKey(name, rarity) {
  return `${normalizeText(name)}::${normalizeRarity(rarity)}`;
}

function getRarityMeta(rarity) {
  return (
    RARITY_META[rarity] || {
      label: rarity,
      short: String(rarity || "?").slice(0, 2).toUpperCase(),
      color: "#d8dee9",
    }
  );
}

function rarityIndex(rarity) {
  const index = RARITY_LABELS.indexOf(rarity);
  return index === -1 ? RARITY_LABELS.length : index;
}

function makeSortOrder(sectionKey, name, rarity, fallbackIndex) {
  const sectionIndex = COLLECTION_SECTIONS.findIndex((section) => section.key === sectionKey);
  const sequenceMatch = String(name).match(/(\d+)/);
  const sequence = sequenceMatch ? Number(sequenceMatch[1]) : fallbackIndex + 1;
  const safeSectionIndex = sectionIndex === -1 ? 99 : sectionIndex;

  return safeSectionIndex * 10000 + sequence * 100 + rarityIndex(rarity);
}

function padCardNumber(number) {
  return String(number).padStart(3, "0");
}

function slugify(value) {
  return (
    String(value || "card")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "card"
  );
}

function getRarityPipStyle(color, active, busy) {
  return {
    width: "100%",
    minHeight: 32,
    borderRadius: 6,
    border: active ? `1px solid ${color}66` : "1px solid var(--border)",
    background: active ? `${color}12` : "var(--surface-2)",
    display: "grid",
    gridTemplateColumns: "28px 26px minmax(0, 1fr)",
    alignItems: "center",
    gap: 3,
    fontWeight: 900,
    fontSize: 11,
    padding: 3,
    opacity: busy ? 0.6 : 1,
    transition: "background 0.18s ease, border-color 0.18s ease, opacity 0.18s ease",
  };
}

function getRarityDotStyle(color, active) {
  return {
    width: 8,
    height: 8,
    borderRadius: 2,
    background: active ? color : "transparent",
    border: `1px solid ${color}`,
    opacity: active ? 1 : 0.7,
  };
}


// ============================================================
// CONFETTI
// ============================================================
function ConfettiOverlay() {
  const colors = ["#7ddf8f","#69b7ff","#f7c948","#e879f9","#ff7aa8","#ffb86b"];
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: (i * 37) % 100,
    delay: ((i * 11) % 15) / 10,
    size: 8 + ((i * 7) % 8),
    duration: 2 + ((i * 13) % 15) / 10,
    round: i % 2 === 0,
  }));

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          left: `${p.left}%`,
          top: 0,
          width: p.size,
          height: p.size,
          background: p.color,
          borderRadius: p.round ? "50%" : 2,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
        }} />
      ))}
    </div>
  );
}

// ============================================================
// FRIENDS PANEL
// ============================================================
function FriendsPanel({ user, t, friends, friendRequests, sentFriendRequests, friendDataBusy,
  friendDataMessage, friendSearchEmail, setFriendSearchEmail,
  friendSearchResult, friendSearchBusy, friendSearchMsg, onSearch, onSendRequest, onRespond,
  onRefresh, onRemove, onViewFriend, viewingFriend, friendStats, onBackToMine, collectionCards,
  ownershipMap, friendMessages, friendMessagesBusy, friendMessageSending, friendMessageStatus,
  onSendMessage, onRefreshMessages, cardCatalog, isMobile }) {
  const [tradeListOpen, setTradeListOpen] = useState(false);
  const panelStyle = {
    ...trackingPanelStyle,
    ...(isMobile ? mobilePanelStyle : {}),
  };
  const rowStyle = {
    ...socialRowStyle,
    ...(isMobile ? mobileSocialRowStyle : {}),
  };
  const actionsStyle = {
    display: "flex",
    gap: 8,
    ...(isMobile ? { width: "100%" } : {}),
  };
  const actionButtonStyle = isMobile ? { flex: 1 } : {};
  const myTradeSections = buildDuplicateSections(
    collectionCards.filter((card) => (card.dupes || 0) > 0)
  );

  if (viewingFriend && friendStats) {
    const usefulTrades = (friendStats.cards || []).filter(
      (card) => (card.dupes || 0) > 0 && !ownershipMap.has(card.catalogCardId)
    );
    const usefulTradeSections = buildDuplicateSections(usefulTrades);
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <button type="button" onClick={onBackToMine} style={{ ...inlineSettingButtonStyle, width: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
          {t.backToMine}
        </button>
        <div style={{ ...panelStyle, marginBottom: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ ...avatarStyle, width: 48, height: 48, fontSize: 20 }}>
              {(friendStats.username || "?").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "var(--text-heading)" }}>{friendStats.username}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                {friendStats.owned} varianti possedute · {friendStats.dupes} doppioni totali
              </div>
            </div>
          </div>
          <div style={statsGridStyle}>
            {RARITY_DEFINITIONS.map(r => (
              <div key={r.label} style={{ ...statCardStyle, borderColor: `${r.color}55` }}>
                <div style={statLabelStyle}>{r.label}</div>
                <div style={{ ...statValueStyle, color: r.color, fontSize: 22 }}>{friendStats.byRarity[r.label] || 0}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <h3 style={sectionTitleStyle}>Doppie che ti mancano</h3>
          <p style={sectionTextStyle}>Carte che {friendStats.username} ha in copia extra. Apri solo il set che ti interessa per richiedere una carta.</p>
          {usefulTrades.length === 0 ? (
            <div style={emptyStyle}>Nessun doppione utile per completare la tua collezione.</div>
          ) : (
            <TradeOfferSections
              sections={usefulTradeSections}
              friendId={viewingFriend}
              sending={friendMessageSending}
              onRequest={onSendMessage}
            />
          )}
        </div>

        <FriendQuickChat
          t={t}
          friendId={viewingFriend}
          friendName={friendStats.username}
          userId={user.id}
          messages={friendMessages}
          loading={friendMessagesBusy}
          sending={friendMessageSending}
          status={friendMessageStatus}
          cardCatalog={cardCatalog}
          myDuplicateCards={collectionCards.filter((card) => (card.dupes || 0) > 0)}
          friendDuplicateCards={(friendStats.cards || []).filter((card) => (card.dupes || 0) > 0)}
          isMobile={isMobile}
          onSend={onSendMessage}
          onRefresh={onRefreshMessages}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Cerca amico */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>{t.friendsTitle}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder={t.friendSearch}
            value={friendSearchEmail}
            onChange={e => setFriendSearchEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch()}
            style={{ ...inputStyle, flex: 1, minWidth: isMobile ? "100%" : 180, fontSize: 15 }}
          />
          <button type="button" onClick={onSearch} disabled={friendSearchBusy} style={{ ...buttonStyle, ...(isMobile ? { width: "100%" } : {}) }}>
            {friendSearchBusy ? "..." : "🔍"}
          </button>
        </div>

        {friendSearchMsg && <div style={messageStyle}>{friendSearchMsg}</div>}

        {friendSearchResult && (
          <div style={rowStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ ...avatarStyle, width: 36, height: 36 }}>{(friendSearchResult.username || "?").slice(0,2).toUpperCase()}</div>
              <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>{friendSearchResult.username || friendSearchResult.id.slice(0,8)}</span>
            </div>
            <button type="button" onClick={() => onSendRequest(friendSearchResult.id)} style={{ ...inlineFormSubmitStyle, ...actionButtonStyle }}>
              {t.sendRequest}
            </button>
          </div>
        )}
      </div>

      {/* Richieste in arrivo */}
      <div style={panelStyle}>
        <div style={panelHeaderRowStyle}>
          <h3 style={sectionTitleStyle}>
            {t.pendingRequests}
            {friendRequests.length > 0 && (
              <span style={{ ...tabBadgeStyle, marginLeft: 8 }}>{friendRequests.length}</span>
            )}
          </h3>
          <button type="button" onClick={onRefresh} disabled={friendDataBusy} style={{ ...inlineSettingButtonStyle, width: "auto", marginTop: 0 }}>
            {friendDataBusy ? t.loading : t.refresh}
          </button>
        </div>
        {friendDataMessage && <div style={messageStyle}>{friendDataMessage}</div>}
        {friendRequests.length === 0 ? (
          <div style={compactEmptyStyle}>{t.noPendingRequests}</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
          {friendRequests.map(req => (
            <div key={req.id} style={rowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ ...avatarStyle, width: 34, height: 34, fontSize: 13 }}>{(req.requesterProfile?.username || "?").slice(0,2).toUpperCase()}</div>
                <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>{req.requesterProfile?.username || req.requester_id.slice(0,8)}</span>
              </div>
              <div style={actionsStyle}>
                <button type="button" onClick={() => onRespond(req.id, true)} style={{ ...inlineFormSubmitStyle, ...actionButtonStyle }}>{t.accept}</button>
                <button type="button" onClick={() => onRespond(req.id, false)} style={{ ...bulkDeleteButtonStyle, ...actionButtonStyle }}>{t.decline}</button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>{t.sentRequests}</h3>
        {sentFriendRequests.length === 0 ? (
          <div style={compactEmptyStyle}>{t.noSentRequests}</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sentFriendRequests.map((request) => (
              <div key={request.id} style={requestSummaryStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ ...avatarStyle, width: 34, height: 34, fontSize: 13 }}>
                    {(request.addresseeProfile?.username || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>
                    {request.addresseeProfile?.username || request.addressee_id.slice(0, 8)}
                  </span>
                </div>
                <span style={pendingPillStyle}>{t.pendingReply}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista amici */}
      <div style={panelStyle}>
        <h3 style={sectionTitleStyle}>{t.yourFriends}</h3>
        {friends.length === 0 ? (
          <div style={emptyStyle}>{t.noFriends}</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {friends.map(f => {
              const isRequester = f.requester_id === user.id;
              const friendId = isRequester ? f.addressee_id : f.requester_id;
              const friendUsername = f.friendProfile?.username;
              return (
                <div key={f.id} style={rowStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ ...avatarStyle, width: 36, height: 36 }}>{(friendUsername || "?").slice(0,2).toUpperCase()}</div>
                    <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>{friendUsername || friendId.slice(0,8)}</span>
                  </div>
                  <div style={actionsStyle}>
                    <button type="button" onClick={() => onViewFriend(friendId)} style={{ ...inlineFormSubmitStyle, ...actionButtonStyle }}>{t.viewCollection}</button>
                    <button type="button" onClick={() => onRemove(f.id)} style={{ ...bulkDeleteButtonStyle, ...actionButtonStyle }}>{t.removeFriend}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <section style={panelStyle}>
        <button
          type="button"
          style={collapsibleHeaderStyle}
          onClick={() => setTradeListOpen((open) => !open)}
        >
          <span>
            <strong style={{ color: "var(--text-heading)" }}>{t.tradeList}</strong>
            <span style={collapsedSummaryStyle}>
              {myTradeSections.reduce((total, section) => total + section.dupes, 0)} doppioni disponibili
            </span>
          </span>
          <span style={expandIndicatorStyle}>{tradeListOpen ? "−" : "+"}</span>
        </button>
        {tradeListOpen && (
          <div style={collapsedBodyStyle}>
            {myTradeSections.length === 0 ? (
              <div style={duplicateEmptyStyle}>{t.noTrades}</div>
            ) : (
              <ReadOnlyTradeSections sections={myTradeSections} />
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function normalizeNickname(value) {
  return String(value || "").trim().toLowerCase();
}

function ReadOnlyTradeSections({ sections }) {
  return (
    <div style={duplicateSectionListStyle}>
      {sections.map((section) => (
        <div key={section.key} style={duplicateSectionStyle}>
          <div style={duplicateSectionHeaderStyle}>
            <span style={duplicateSectionTitleStyle}>{section.title}</span>
            <span style={duplicateSectionCountStyle}>{section.dupes} doppioni</span>
          </div>
          <div style={duplicateListStyle}>
            {section.groups.map((group) => (
              <div key={group.id} style={tradeRowStyle}>
                <span style={duplicateNameStyle}>{group.name}</span>
                <div style={variantBadgeListStyle}>
                  {group.variants.map((variant) => {
                    const meta = getRarityMeta(variant.rarity);
                    return (
                      <span key={variant.card_id} style={{ ...variantDupeBadgeStyle, borderColor: `${meta.color}66`, color: meta.color }}>
                        {meta.label}: {variant.dupes}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TradeOfferSections({ sections, friendId, sending, onRequest }) {
  const [expandedSections, setExpandedSections] = useState({});

  function toggleSection(sectionKey) {
    setExpandedSections((currentSections) => ({
      ...currentSections,
      [sectionKey]: !currentSections[sectionKey],
    }));
  }

  return (
    <div style={compactTradeSectionListStyle}>
      {sections.map((section) => {
        const sectionIsOpen = Boolean(expandedSections[section.key]);
        return (
          <section key={section.key} style={compactTradeSectionStyle}>
            <button
              type="button"
              style={compactTradeSectionButtonStyle}
              onClick={() => toggleSection(section.key)}
              aria-expanded={sectionIsOpen}
            >
              <span style={compactTradeSectionInfoStyle}>
                <strong style={duplicateSectionTitleStyle}>{section.title}</strong>
                <span style={compactTradeSummaryStyle}>
                  {section.groups.length} carte · {section.dupes} doppioni utili
                </span>
              </span>
              <span style={expandIndicatorStyle}>{sectionIsOpen ? "−" : "+"}</span>
            </button>

            {sectionIsOpen && (
              <div style={compactTradeGridStyle}>
                {section.groups.map((group) => (
                  <article key={group.id} style={compactTradeCardStyle}>
                    <div style={compactTradeCardHeaderStyle}>
                      <span style={duplicateNameStyle}>{group.name}</span>
                      <span style={compactTradeCardCountStyle}>
                        {group.variants.reduce((total, variant) => total + variant.dupes, 0)} disponibili
                      </span>
                    </div>
                    <div style={compactTradeVariantListStyle}>
                      {group.variants.map((variant) => {
                        const meta = getRarityMeta(variant.rarity);
                        const pendingKey = `need_card:${variant.card_id}:`;
                        return (
                          <div key={variant.card_id} style={compactTradeVariantStyle}>
                            <span style={{ ...compactVariantBadgeStyle, borderColor: `${meta.color}66`, color: meta.color }}>
                              {meta.label} · {variant.dupes}
                            </span>
                            <button
                              type="button"
                              style={compactTradeRequestButtonStyle}
                              onClick={() => onRequest(friendId, "need_card", variant.card_id)}
                              disabled={sending === pendingKey}
                            >
                              {sending === pendingKey ? "Invio..." : "Richiedi"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function FriendQuickChat({ t, friendId, friendName, userId, messages, loading, sending, status, cardCatalog, myDuplicateCards, friendDuplicateCards, isMobile, onSend, onRefresh }) {
  const [requestedCardId, setRequestedCardId] = useState("");
  const [offeredCardId, setOfferedCardId] = useState("");
  const tradePendingKey = `trade_offer:${requestedCardId}:${offeredCardId}`;
  const canSendTrade =
    requestedCardId && offeredCardId && requestedCardId !== offeredCardId;

  async function sendTradeProposal() {
    if (!canSendTrade) return;
    const sent = await onSend(friendId, "trade_offer", requestedCardId, offeredCardId);
    if (sent) {
      setRequestedCardId("");
      setOfferedCardId("");
    }
  }

  return (
    <section style={{ ...trackingPanelStyle, ...(isMobile ? mobilePanelStyle : {}) }}>
      <div style={chatHeaderStyle}>
        <div>
          <h3 style={sectionTitleStyle}>Messaggi rapidi</h3>
          <p style={sectionTextStyle}>Chat con {friendName}: scegli un messaggio preimpostato.</p>
        </div>
        <button type="button" onClick={() => onRefresh(friendId)} style={{ ...inlineSettingButtonStyle, width: "auto", marginTop: 0 }}>
          Aggiorna
        </button>
      </div>

      <div style={quickMessageButtonsStyle}>
        {QUICK_MESSAGE_TEMPLATES.map((template) => {
          const pendingKey = `${template.code}::`;
          return (
            <button
              key={template.code}
              type="button"
              style={quickMessageButtonStyle}
              onClick={() => onSend(friendId, template.code)}
              disabled={sending === pendingKey}
            >
              {sending === pendingKey ? "Invio..." : template.text}
            </button>
          );
        })}
      </div>

      <section style={tradeComposerStyle}>
        <div>
          <h4 style={tradeComposerTitleStyle}>{t.tradeProposal}</h4>
          <p style={tradeComposerDescriptionStyle}>
            Seleziona un suo doppione e una carta doppia che vuoi offrire.
          </p>
        </div>
        {myDuplicateCards.length === 0 || friendDuplicateCards.length === 0 ? (
          <div style={notificationHintStyle}>{t.noTradeCards}</div>
        ) : (
          <>
            <div style={tradeSelectGridStyle}>
              <label style={tradeSelectLabelStyle}>
                {t.requestedCard}
                <select
                  value={requestedCardId}
                  onChange={(event) => setRequestedCardId(event.target.value)}
                  style={{ ...inputStyle, width: "100%", fontSize: 14 }}
                >
                  <option value="">Scegli il doppione dell'amico...</option>
                  {friendDuplicateCards.map((card) => (
                    <option key={card.card_id} value={card.card_id}>
                      {card.name} - {card.rarity} ({card.dupes})
                    </option>
                  ))}
                </select>
              </label>
              <label style={tradeSelectLabelStyle}>
                {t.offeredCard}
                <select
                  value={offeredCardId}
                  onChange={(event) => setOfferedCardId(event.target.value)}
                  style={{ ...inputStyle, width: "100%", fontSize: 14 }}
                >
                  <option value="">Scegli il tuo doppione...</option>
                  {myDuplicateCards.map((card) => (
                    <option key={card.card_id} value={card.card_id}>
                      {card.name} - {card.rarity} ({card.dupes})
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              style={{ ...inlineFormSubmitStyle, width: "fit-content" }}
              onClick={sendTradeProposal}
              disabled={!canSendTrade || sending === tradePendingKey}
            >
              {sending === tradePendingKey ? "Invio..." : t.sendTradeProposal}
            </button>
          </>
        )}
      </section>

      {status && <div style={messageStyle}>{status}</div>}

      <div style={chatThreadStyle}>
        {loading ? (
          <div style={duplicateEmptyStyle}>Caricamento messaggi...</div>
        ) : messages.length === 0 ? (
          <div style={duplicateEmptyStyle}>Nessun messaggio ancora.</div>
        ) : (
          messages.map((message) => {
            const mine = message.sender_id === userId;
            return (
              <div
                key={message.id}
                style={{
                  ...chatBubbleStyle,
                  ...(mine ? myChatBubbleStyle : friendChatBubbleStyle),
                }}
              >
                <span style={chatAuthorStyle}>{mine ? "Tu" : friendName}</span>
                <span>{quickMessageText(message, cardCatalog)}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

// ============================================================
// DUPLICATES PANEL
// ============================================================
function DuplicatesPanel({ duplicateCards, totalDupes, variantBusy, onIncrementDupe, onDecrementDupe, isMobile }) {
  const sections = buildDuplicateSections(duplicateCards);
  const uniqueRepeatedCards = sections.reduce((total, section) => total + section.groups.length, 0);
  const panelStyle = {
    ...trackingPanelStyle,
    ...(isMobile ? mobilePanelStyle : {}),
  };

  return (
    <div style={duplicatesLayoutStyle}>
      <section style={panelStyle}>
        <div style={duplicatesHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Doppioni</h2>
            <p style={sectionTextStyle}>Copie extra disponibili nella tua collezione.</p>
          </div>
          <div style={duplicatesTotalStyle}>
            <span style={duplicatesTotalLabelStyle}>Totale doppioni</span>
            <span style={duplicatesTotalNumberStyle}>{totalDupes}</span>
          </div>
        </div>

        <div style={duplicateStatsGridStyle}>
          {sections.length === 0 ? (
            <div style={emptyStyle}>Nessun doppione presente.</div>
          ) : (
            sections.map((section) => (
              <div key={section.key} style={statCardStyle}>
                <div style={statLabelStyle}>{section.title}</div>
                <div style={{ ...statValueStyle, color: "var(--accent-gold)", fontSize: 25 }}>{section.dupes}</div>
                <div style={statTotalStyle}>{section.groups.length} carte ripetute</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={panelStyle}>
        <div style={cardBrowserHeaderStyle}>
          <h2 style={sectionTitleStyle}>Carte doppie</h2>
          <span style={gridCountStyle}>{uniqueRepeatedCards} carte</span>
        </div>

        {duplicateCards.length === 0 ? (
          <div style={duplicateEmptyStyle}>Non hai ancora copie extra.</div>
        ) : (
          <div style={duplicateSectionListStyle}>
            {sections.map((section) => (
              <div key={section.key} style={duplicateSectionStyle}>
                <div style={duplicateSectionHeaderStyle}>
                  <span style={duplicateSectionTitleStyle}>{section.title}</span>
                  <span style={duplicateSectionCountStyle}>{section.dupes} doppioni</span>
                </div>
                <div style={duplicateListStyle}>
                  {section.groups.map((group) => (
                    <article
                      key={group.id}
                      style={{
                        ...duplicateGroupedItemStyle,
                        ...(isMobile ? duplicateGroupedItemMobileStyle : {}),
                      }}
                    >
                      <div style={duplicateInfoStyle}>
                        <span style={duplicateNameStyle}>{group.name}</span>
                        <span style={duplicateOwnedStyle}>Doppioni totali: {group.dupes}</span>
                      </div>
                      <div style={duplicateVariantListStyle}>
                        {group.variants.map((variant) => {
                          const rarity = getRarityMeta(variant.rarity);
                          const busy = variantBusy === variant.card_id;
                          return (
                            <div key={variant.card_id} style={duplicateVariantRowStyle}>
                              <span style={{ ...variantDupeBadgeStyle, borderColor: `${rarity.color}66`, color: rarity.color }}>
                                {rarity.label}: {variant.dupes}
                              </span>
                              <div style={duplicateButtonsStyle}>
                                <button
                                  type="button"
                                  style={duplicateAdjustButtonStyle}
                                  onClick={() => onDecrementDupe(variant)}
                                  disabled={busy}
                                  aria-label={`Rimuovi una doppia ${variant.rarity} di ${group.name}`}
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  style={duplicateAddButtonStyle}
                                  onClick={() => onIncrementDupe(variant)}
                                  disabled={busy}
                                  aria-label={`Aggiungi una doppia ${variant.rarity} di ${group.name}`}
                                >
                                  + Doppia
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================
// PROGRESS PANEL
// ============================================================
function ProgressPanel({ t, snapshots, onExportCSV, ownedCount, totalCount }) {
  const chartW = 700, chartH = 210, padL = 48, padB = 30, padR = 16, padT = 18;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const chartTotal = Math.max(totalCount, 1);
  const completion = Math.round((ownedCount / chartTotal) * 100);
  const remaining = Math.max(totalCount - ownedCount, 0);
  const firstOwned = snapshots[0]?.owned_count ?? ownedCount;
  const lastOwned = snapshots[snapshots.length - 1]?.owned_count ?? ownedCount;
  const gained = Math.max(lastOwned - firstOwned, 0);

  const points = snapshots.map((s, i) => {
    const x = padL + (snapshots.length > 1 ? (i / (snapshots.length - 1)) * innerW : innerW / 2);
    const y = padT + innerH - (s.owned_count / chartTotal) * innerH;
    return { x, y, ...s };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
  const area = points.length > 0
    ? `M${points[0].x},${padT + innerH} ` + points.map(p => `L${p.x},${p.y}`).join(" ") + ` L${points[points.length-1].x},${padT+innerH} Z`
    : "";

  return (
    <div style={duplicatesLayoutStyle}>
      <section style={trackingPanelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={sectionTitleStyle}>{t.progressTitle}</h3>
            <p style={sectionTextStyle}>Avanzamento delle varianti possedute nel tempo.</p>
          </div>
          <button type="button" onClick={onExportCSV} style={inlineFormSubmitStyle}>💾 {t.exportCSV}</button>
        </div>

        <div style={progressSummaryGridStyle}>
          <div style={progressMetricStyle}>
            <span style={progressMetricLabelStyle}>Completamento</span>
            <span style={progressMetricValueStyle}>{completion}%</span>
          </div>
          <div style={progressMetricStyle}>
            <span style={progressMetricLabelStyle}>Varianti possedute</span>
            <span style={progressMetricValueStyle}>{ownedCount}</span>
          </div>
          <div style={progressMetricStyle}>
            <span style={progressMetricLabelStyle}>Mancanti</span>
            <span style={progressMetricValueStyle}>{remaining}</span>
          </div>
          <div style={progressMetricStyle}>
            <span style={progressMetricLabelStyle}>Guadagnate nello storico</span>
            <span style={progressMetricValueStyle}>+{gained}</span>
          </div>
        </div>

        <div style={progressChartStyle}>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", minWidth: 280, display: "block" }}>
            {/* grid lines */}
            {[0,0.25,0.5,0.75,1].map(v => {
              const y = padT + innerH - v * innerH;
              return <g key={v}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="var(--border)" strokeWidth={1} />
                <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">{Math.round(v * 100)}%</text>
              </g>;
            })}
            {/* area fill */}
            {area && <path d={area} fill="url(#chartGrad)" opacity={0.3} />}
            {/* line */}
            {points.length > 1 && <polyline points={polyline} fill="none" stroke="var(--accent-green)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
            {/* dots */}
            {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--accent-green)" />)}
            {/* date labels */}
            {points.filter((_, i) => i === 0 || i === points.length - 1 || (points.length > 4 && i % Math.ceil(points.length / 4) === 0)).map((p, i) => (
              <text key={i} x={p.x} y={chartH - 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)">{p.snapshot_date?.slice(5)}</text>
            ))}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-green)" />
                <stop offset="100%" stopColor="var(--accent-green)" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {snapshots.length < 2 && <div style={duplicateEmptyStyle}>La progressione apparira dopo piu rilevazioni giornaliere.</div>}
      </section>

    </div>
  );
}

// ============================================================
// STILI — tutti usano variabili CSS per supporto tema completo
// ============================================================

const pageStyle = {
  minHeight: "100vh",
  background: "var(--page-bg)",
  color: "var(--page-color)",
  padding: "16px 20px",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  WebkitFontSmoothing: "antialiased",
  letterSpacing: 0,
  overflowX: "hidden",
  boxSizing: "border-box",
};

const shellStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  width: "100%",
};

const centerShellStyle = {
  ...shellStyle,
  minHeight: "calc(100vh - 40px)",
  display: "grid",
  placeItems: "center",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 24,
  flexWrap: "wrap",
};

const mobileHeaderStyle = {
  alignItems: "start",
  gap: 14,
  marginBottom: 18,
};

const titleStyle = {
  color: "var(--text-heading)",
  fontSize: "clamp(26px, 5vw, 42px)",
  lineHeight: 1.05,
  margin: 0,
  fontWeight: 900,
  letterSpacing: "-0.5px",
};

const mobileTitleStyle = {
  fontSize: "clamp(25px, 8.2vw, 34px)",
};

const subtitleStyle = {
  color: "var(--text-secondary)",
  marginTop: 8,
  fontSize: 14,
};

const emailStyle = {
  color: "var(--text-secondary)",
  fontSize: 13,
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 180,
};

const headerActionsStyle = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const mobileHeaderActionsStyle = {
  width: "100%",
  justifyContent: "flex-start",
};

const notificationTriggerStyle = {
  minHeight: 48,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 12px",
  borderRadius: 50,
  border: "1px solid var(--border)",
  background: "var(--surface-1)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "var(--card-shadow)",
};

const notificationBadgeStyle = {
  display: "inline-grid",
  placeItems: "center",
  minWidth: 20,
  height: 20,
  padding: "0 5px",
  borderRadius: 99,
  background: "var(--danger-text)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 900,
};

const notificationCenterStyle = {
  position: "absolute",
  top: "calc(100% + 10px)",
  right: 0,
  zIndex: 1200,
  width: "min(360px, calc(100vw - 24px))",
  background: "var(--surface-3)",
  border: "1px solid var(--border-strong)",
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "var(--modal-shadow)",
};

const mobileNotificationCenterStyle = {
  position: "fixed",
  top: "auto",
  left: 12,
  right: 12,
  bottom: "calc(66px + env(safe-area-inset-bottom))",
  width: "auto",
  maxHeight: "calc(100dvh - 92px - env(safe-area-inset-bottom))",
  borderRadius: 14,
};

const notificationHeaderStyle = {
  padding: "11px 12px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const notificationBodyStyle = {
  display: "grid",
  gap: 8,
  padding: 9,
  maxHeight: "min(62vh, 560px)",
  overflowY: "auto",
};

const notificationEmptyStyle = {
  color: "var(--text-secondary)",
  background: "var(--surface-2)",
  borderRadius: 8,
  padding: 14,
  textAlign: "center",
  fontSize: 13,
};

const notificationItemStyle = {
  display: "grid",
  gap: 6,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 9,
  padding: "8px 9px",
};

const notificationGroupStyle = {
  display: "grid",
  gap: 8,
};

const notificationGroupTitleStyle = {
  margin: "2px 0 0",
  color: "var(--text-secondary)",
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  fontWeight: 900,
};

const notificationMetaStyle = {
  color: "var(--text-secondary)",
  fontSize: 11,
};

const notificationActionStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const notificationContentStyle = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const notificationHintStyle = {
  color: "var(--text-secondary)",
  fontSize: 11,
  lineHeight: 1.35,
};

const compactNoticeButtonStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  padding: "6px 9px",
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const compactConfirmButtonStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  padding: "6px 9px",
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const compactDismissButtonStyle = {
  background: "var(--danger-bg)",
  border: "1px solid var(--danger-border)",
  color: "var(--danger-text)",
  padding: "6px 9px",
  borderRadius: 7,
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const notificationTitleRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  flexWrap: "wrap",
};

const notificationTextStyle = {
  color: "var(--text-primary)",
  fontSize: 13,
  overflowWrap: "anywhere",
};

const notificationKindPillStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  borderRadius: 99,
  padding: "2px 6px",
  fontSize: 10,
  fontWeight: 800,
};

const newNotificationPillStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  borderRadius: 99,
  padding: "2px 6px",
  fontSize: 10,
  fontWeight: 900,
};

const notificationFooterStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const authPanelStyle = {
  width: "min(440px, 100%)",
  background: "var(--surface-1)",
  padding: 28,
  borderRadius: 16,
  border: "1px solid var(--border)",
  display: "grid",
  gap: 14,
  boxSizing: "border-box",
  boxShadow: "var(--modal-shadow)",
};

const authSwitchStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 6,
  background: "var(--surface-2)",
  padding: 5,
  borderRadius: 10,
};

const switchButtonStyle = {
  border: "none",
  background: "transparent",
  color: "var(--text-secondary)",
  padding: "10px 12px",
  borderRadius: 7,
  cursor: "pointer",
  fontWeight: 700,
};

const switchActiveStyle = {
  ...switchButtonStyle,
  background: "var(--surface-1)",
  color: "var(--accent-green)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
};

const progressBoxStyle = {
  background: "var(--surface-1)",
  padding: 20,
  borderRadius: 12,
  marginBottom: 16,
  border: "1px solid var(--border)",
  boxShadow: "var(--card-shadow)",
};

const progressHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  marginBottom: 12,
  fontWeight: 800,
  color: "var(--text-primary)",
};

const progressTrackStyle = {
  height: 12,
  background: "var(--track-bg)",
  borderRadius: 999,
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg, var(--accent-green), var(--accent-blue), var(--accent-gold))",
  transition: "width 0.4s ease",
  borderRadius: 999,
};

const progressTextStyle = {
  marginTop: 10,
  color: "var(--text-secondary)",
  textAlign: "center",
  fontSize: 13,
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
  gap: 10,
  marginBottom: 16,
};

const statCardStyle = {
  background: "var(--surface-1)",
  padding: 16,
  borderRadius: 12,
  border: "1px solid var(--border)",
  boxShadow: "var(--card-shadow)",
};

const statLabelStyle = {
  color: "var(--text-secondary)",
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 600,
};

const statValueStyle = {
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 900,
};

const statTotalStyle = {
  marginTop: 8,
  color: "var(--text-muted)",
  fontSize: 12,
};

const trackingPanelStyle = {
  background: "var(--surface-1)",
  padding: 20,
  borderRadius: 12,
  border: "1px solid var(--border)",
  marginBottom: 16,
  display: "grid",
  gap: 16,
  boxShadow: "var(--card-shadow)",
};

const mobilePanelStyle = {
  padding: 14,
  marginBottom: 12,
  gap: 12,
};

const progressSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 150px),1fr))",
  gap: 10,
};

const progressMetricStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "12px 13px",
  display: "grid",
  gap: 6,
};

const progressMetricLabelStyle = {
  color: "var(--text-secondary)",
  fontSize: 12,
  fontWeight: 700,
};

const progressMetricValueStyle = {
  color: "var(--text-heading)",
  fontSize: 26,
  lineHeight: 1,
  fontWeight: 900,
};

const progressChartStyle = {
  overflowX: "auto",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "12px 8px 5px",
};

const trackingGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 200px),1fr))",
  gap: 10,
};

const trackingCardStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 14,
  display: "grid",
  gap: 12,
};

const trackingCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const trackingNameStyle = {
  color: "var(--text-primary)",
  fontWeight: 900,
  fontSize: 14,
};

const trackingPercentStyle = {
  color: "var(--accent-gold)",
  fontSize: 22,
  fontWeight: 900,
};

const trackingBarStyle = {
  height: 8,
  background: "var(--track-bg)",
  borderRadius: 999,
  overflow: "hidden",
};

const trackingBarFillStyle = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, var(--accent-green), var(--accent-blue))",
  transition: "width 0.4s ease",
};

const trackingNumbersStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 8,
  color: "var(--text-secondary)",
  fontSize: 12,
};

const bulkPanelStyle = {
  background: "var(--surface-1)",
  padding: 12,
  borderRadius: 12,
  border: "1px solid var(--border)",
  marginBottom: 16,
  display: "grid",
  gap: 10,
  boxShadow: "var(--card-shadow)",
};

const bulkPanelHeaderButtonStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "var(--text-primary)",
  cursor: "pointer",
  textAlign: "left",
};

const bulkPanelSummaryStyle = {
  display: "block",
  marginTop: 4,
  color: "var(--text-secondary)",
  fontSize: 12,
  fontWeight: 600,
};

const sectionTitleStyle = {
  color: "var(--text-heading)",
  fontSize: 19,
  margin: 0,
  fontWeight: 900,
  letterSpacing: "-0.2px",
};

const sectionTextStyle = {
  marginTop: 5,
  color: "var(--text-secondary)",
  fontSize: 13,
};

const bulkGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 150px),1fr))",
  gap: 7,
};

const bulkActionCardStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 8,
  display: "grid",
  gap: 7,
};

const bulkActionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const bulkActionButtonsStyle = {
  display: "flex",
  gap: 5,
};

const bulkButtonStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  padding: "6px 7px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 11,
  flex: 1,
};

const bulkDeleteButtonStyle = {
  background: "var(--danger-bg)",
  border: "1px solid var(--danger-border)",
  color: "var(--danger-text)",
  padding: "6px 7px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 11,
  flex: 1,
};

const bulkCountStyle = {
  color: "var(--text-secondary)",
  fontSize: 11,
  fontWeight: 700,
};

const toolbarStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 14,
  alignItems: "stretch",
};

const inputStyle = {
  padding: "13px 16px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: "var(--surface-input)",
  color: "var(--text-primary)",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  WebkitAppearance: "none",
  appearance: "none",
  touchAction: "manipulation",
  minHeight: 50,
};

const compactFilterInputStyle = {
  padding: "9px 11px",
  minHeight: 40,
  fontSize: 14,
};

const buttonStyle = {
  background: "linear-gradient(135deg, var(--accent-green), var(--accent-gold))",
  border: "none",
  color: "#080a0f",
  fontWeight: 900,
  padding: "13px 22px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 16,
  minHeight: 50,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
};

const messageStyle = {
  background: "rgba(247,201,72,0.10)",
  border: "1px solid rgba(247,201,72,0.30)",
  color: "var(--accent-gold)",
  padding: 12,
  borderRadius: 10,
  marginBottom: 14,
  fontSize: 14,
};

const cardBrowserStyle = {
  marginTop: 18,
};

const cardBrowserHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  marginBottom: 12,
};

const compactCardLegendStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 14px",
  color: "var(--text-secondary)",
  fontSize: 11,
  margin: "-5px 0 10px",
};

const gridCountStyle = {
  color: "var(--text-secondary)",
  fontWeight: 800,
  fontSize: 13,
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(min(100%, 176px),1fr))",
  gap: 9,
};

const collectionCardStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  overflow: "hidden",
  minWidth: 0,
  display: "grid",
  boxShadow: "var(--card-shadow)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const cardImageWrapStyle = {
  position: "relative",
  aspectRatio: "2 / 1",
  background: "var(--surface-2)",
  overflow: "hidden",
};

const cardImageStyle = {
  width: "100%",
  height: "100%",
  display: "block",
  objectFit: "cover",
};

const sectionBadgeStyle = {
  position: "absolute",
  left: 8,
  bottom: 8,
  maxWidth: "calc(100% - 16px)",
  background: "rgba(5,8,14,0.80)",
  color: "#e8edf5",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 6,
  padding: "4px 8px",
  fontSize: 11,
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  backdropFilter: "blur(4px)",
};

const collectionCardBodyStyle = {
  padding: 7,
  display: "grid",
  gap: 7,
};

const collectionCardTopStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 10,
};

const collectionCardTitleStyle = {
  color: "var(--text-heading)",
  margin: 0,
  fontSize: 14,
  lineHeight: 1.2,
  fontWeight: 800,
  letterSpacing: 0,
  overflowWrap: "anywhere",
};

const cardCountPillStyle = {
  flex: "0 0 auto",
  color: "var(--text-secondary)",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "3px 7px",
  fontSize: 11,
  fontWeight: 900,
};

const rarityPipGridStyle = {
  display: "grid",
  gap: 4,
};

const sectionFolderHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "15px 18px",
  cursor: "pointer",
  color: "var(--text-heading)",
  textAlign: "left",
  boxSizing: "border-box",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  minHeight: 54,
  boxShadow: "var(--card-shadow)",
};

const emptyStyle = {
  textAlign: "center",
  color: "var(--text-secondary)",
  marginTop: 34,
  fontSize: 15,
};

// === STILI INTERFACCIA UTENTE E IMPOSTAZIONI RESPONSIVE ===

const desktopProfileTriggerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  background: "var(--surface-1)",
  padding: "6px 14px 6px 8px",
  borderRadius: 50,
  border: "1px solid var(--border)",
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.2s, border-color 0.2s, box-shadow 0.2s",
  outline: "none",
  boxShadow: "var(--card-shadow)",
};

const avatarStyle = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  background: "linear-gradient(135deg, var(--accent-green), var(--accent-blue))",
  color: "#080a0f",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 13,
  flexShrink: 0,
};

const bottomNavigationStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: "calc(58px + env(safe-area-inset-bottom))",
  background: "var(--nav-bg)",
  borderTop: "1px solid var(--border)",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  zIndex: 900,
  paddingBottom: "env(safe-area-inset-bottom)",
  backdropFilter: "blur(12px)",
};

const bottomNavTabStyle = {
  background: "transparent",
  border: "none",
  color: "var(--text-primary)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 2,
  minWidth: 0,
  padding: "0 3px env(safe-area-inset-bottom)",
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const bottomNavLabelStyle = {
  fontSize: 10,
  color: "var(--text-secondary)",
  fontWeight: 700,
  whiteSpace: "nowrap",
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(5, 7, 10, 0.75)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 2000,
};

// Fallback dinamico desktop/mobile
if (typeof window !== "undefined" && window.innerWidth >= 640) {
  modalOverlayStyle.alignItems = "center";
}

const modalContainerStyle = {
  background: "var(--surface-3)",
  border: "1px solid var(--border-strong)",
  maxHeight: "88vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "var(--modal-shadow)",
  boxSizing: "border-box",
};

const modalHeaderStyle = {
  padding: "18px 22px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const modalCloseButtonStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text-secondary)",
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
  padding: "4px 8px",
  borderRadius: 8,
  outline: "none",
  lineHeight: 1,
};

const modalBodyStyle = {
  padding: 20,
  overflowY: "auto",
  display: "grid",
  gap: 16,
};

const settingsSectionBoxStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 16,
  display: "grid",
  gap: 10,
};

const settingsSectionTitleStyle = {
  margin: 0,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "var(--accent-gold)",
  fontWeight: 900,
};

const inlineSettingButtonStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  padding: "9px 12px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 4,
  width: "100%",
  textAlign: "center",
};

const inlineThemeToggleStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  padding: "7px 14px",
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const inlineFormSubmitStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const inlineStatsContainerStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "8px 16px",
  marginTop: 4,
};

const inlineStatRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: 13,
  borderBottom: "1px solid var(--border)",
  paddingBottom: 5,
  color: "var(--text-primary)",
};
// Tab navigation styles
const tabNavStyle = {
  display: "flex",
  gap: 6,
  marginBottom: 20,
  background: "var(--surface-2)",
  padding: 5,
  borderRadius: 12,
  border: "1px solid var(--border)",
};

const tabBtnStyle = {
  flex: 1,
  padding: "10px 8px",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  color: "var(--text-secondary)",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
  transition: "all 0.18s ease",
};

const tabBtnActiveStyle = {
  background: "var(--surface-1)",
  color: "var(--text-heading)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
  fontWeight: 900,
};

const tabLabelStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
};

const tabBadgeStyle = {
  display: "inline-grid",
  placeItems: "center",
  minWidth: 18,
  height: 18,
  padding: "0 5px",
  borderRadius: 99,
  background: "var(--danger-text)",
  color: "#fff",
  fontSize: 11,
  fontWeight: 900,
  verticalAlign: "middle",
};

const panelHeaderRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 10,
};

const compactEmptyStyle = {
  color: "var(--text-secondary)",
  background: "var(--surface-2)",
  border: "1px dashed var(--border)",
  borderRadius: 9,
  padding: 14,
  fontSize: 13,
};

const socialRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  padding: "10px 14px",
  background: "var(--surface-2)",
  borderRadius: 10,
  border: "1px solid var(--border)",
};

const mobileSocialRowStyle = {
  alignItems: "stretch",
  flexDirection: "column",
  padding: 10,
};

const requestSummaryStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 10,
  padding: "10px 14px",
  background: "var(--surface-2)",
  borderRadius: 10,
  border: "1px solid var(--border)",
};

const pendingPillStyle = {
  background: "rgba(247,201,72,0.10)",
  border: "1px solid rgba(247,201,72,0.30)",
  color: "var(--accent-gold)",
  padding: "5px 8px",
  borderRadius: 99,
  fontSize: 12,
  fontWeight: 800,
};

const addMissingVariantsButtonStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  borderRadius: 7,
  padding: "7px 8px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const rarityCodeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  fontSize: 11,
  fontWeight: 800,
};

const dupeRowStyle = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 3,
};

const dupeSmallBtnStyle = {
  width: 22,
  height: 24,
  borderRadius: 4,
  border: "1px solid var(--border-strong)",
  background: "var(--surface-1)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  padding: 0,
};

const dupeCountStyle = {
  fontSize: 10,
  fontWeight: 900,
  color: "var(--accent-gold)",
  textAlign: "center",
};

const addCompactVariantButtonStyle = {
  background: "var(--success-bg)",
  color: "var(--success-text)",
};

const removeVariantButtonStyle = {
  width: 22,
  height: 24,
  borderRadius: 4,
  border: "1px solid var(--danger-border)",
  background: "var(--danger-bg)",
  color: "var(--danger-text)",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  padding: 0,
};

const duplicatesLayoutStyle = {
  display: "grid",
  gap: 16,
};

const duplicatesHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
};

const duplicatesTotalStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 14px",
  display: "grid",
  gap: 4,
  minWidth: 132,
};

const duplicatesTotalLabelStyle = {
  color: "var(--text-secondary)",
  fontSize: 12,
  fontWeight: 700,
};

const duplicatesTotalNumberStyle = {
  color: "var(--accent-gold)",
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 900,
};

const duplicateStatsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 128px),1fr))",
  gap: 10,
};

const duplicateEmptyStyle = {
  background: "var(--surface-2)",
  border: "1px dashed var(--border-strong)",
  borderRadius: 10,
  padding: 22,
  textAlign: "center",
  color: "var(--text-secondary)",
};

const duplicateListStyle = {
  display: "grid",
  gap: 8,
};

const duplicateSectionListStyle = {
  display: "grid",
  gap: 16,
};

const duplicateSectionStyle = {
  display: "grid",
  gap: 9,
};

const duplicateSectionHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  paddingBottom: 8,
  borderBottom: "1px solid var(--border)",
};

const duplicateSectionTitleStyle = {
  color: "var(--text-heading)",
  fontSize: 14,
  fontWeight: 900,
};

const duplicateSectionCountStyle = {
  color: "var(--accent-gold)",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const duplicateGroupedItemStyle = {
  display: "grid",
  gridTemplateColumns: "minmax(140px, 1fr) minmax(240px, 2fr)",
  alignItems: "start",
  gap: 12,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "10px 12px",
};

const duplicateGroupedItemMobileStyle = {
  gridTemplateColumns: "1fr",
  alignItems: "start",
};

const duplicateVariantListStyle = {
  display: "grid",
  gap: 8,
};

const duplicateVariantRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  flexWrap: "wrap",
};

const duplicateInfoStyle = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const duplicateNameStyle = {
  color: "var(--text-heading)",
  fontSize: 14,
  fontWeight: 800,
  overflowWrap: "anywhere",
};

const variantDupeBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  background: "var(--surface-1)",
  border: "1px solid var(--border-strong)",
  borderRadius: 7,
  padding: "6px 8px",
  color: "var(--text-primary)",
  fontSize: 13,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const variantBadgeListStyle = {
  display: "flex",
  justifyContent: "flex-end",
  flexWrap: "wrap",
  gap: 6,
};

const duplicateOwnedStyle = {
  color: "var(--text-muted)",
  fontSize: 11,
  whiteSpace: "nowrap",
};

const duplicateButtonsStyle = {
  display: "flex",
  gap: 6,
};

const duplicateAdjustButtonStyle = {
  background: "var(--surface-1)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  borderRadius: 7,
  minHeight: 38,
  minWidth: 42,
  fontWeight: 900,
  cursor: "pointer",
};

const duplicateAddButtonStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  borderRadius: 7,
  minHeight: 38,
  padding: "6px 12px",
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const collapsibleHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: "none",
  background: "transparent",
  color: "var(--text-heading)",
  cursor: "pointer",
  fontSize: 17,
  textAlign: "left",
  padding: 0,
  width: "100%",
};

const collapsedSummaryStyle = {
  marginLeft: "auto",
  color: "var(--text-secondary)",
  fontSize: 12,
  fontWeight: 700,
};

const expandIndicatorStyle = {
  width: 26,
  height: 26,
  borderRadius: 7,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  color: "var(--text-heading)",
  display: "grid",
  placeItems: "center",
  flexShrink: 0,
};

const collapsedBodyStyle = {
  paddingTop: 4,
};

const compactTradeSectionListStyle = {
  display: "grid",
  gap: 10,
};

const compactTradeSectionStyle = {
  display: "grid",
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  overflow: "hidden",
};

const compactTradeSectionButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "12px 13px",
  color: "var(--text-heading)",
  cursor: "pointer",
  textAlign: "left",
};

const compactTradeSectionInfoStyle = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const compactTradeSummaryStyle = {
  color: "var(--text-secondary)",
  fontSize: 12,
  fontWeight: 700,
};

const compactTradeGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
  gap: 8,
  padding: "0 10px 10px",
};

const compactTradeCardStyle = {
  display: "grid",
  gap: 7,
  minWidth: 0,
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "9px 10px",
};

const compactTradeCardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
};

const compactTradeCardCountStyle = {
  color: "var(--text-muted)",
  fontSize: 11,
  fontWeight: 700,
};

const compactTradeVariantListStyle = {
  display: "grid",
  gap: 6,
};

const compactTradeVariantStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 7,
};

const compactVariantBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  background: "var(--surface-2)",
  border: "1px solid var(--border-strong)",
  borderRadius: 7,
  padding: "5px 7px",
  fontSize: 12,
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const compactTradeRequestButtonStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  borderRadius: 7,
  minHeight: 32,
  padding: "4px 10px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const tradeRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 12,
  padding: "10px 12px",
  background: "var(--surface-2)",
  borderRadius: 8,
  border: "1px solid var(--border)",
};

const chatHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 12,
  flexWrap: "wrap",
};

const quickMessageButtonsStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const quickMessageButtonStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border-strong)",
  color: "var(--text-primary)",
  padding: "9px 12px",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
};

const chatThreadStyle = {
  display: "grid",
  gap: 8,
  paddingTop: 4,
};

const tradeComposerStyle = {
  display: "grid",
  gap: 10,
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 12,
};

const tradeComposerTitleStyle = {
  margin: 0,
  color: "var(--text-heading)",
  fontSize: 15,
  fontWeight: 900,
};

const tradeComposerDescriptionStyle = {
  margin: "4px 0 0",
  color: "var(--text-secondary)",
  fontSize: 12,
};

const tradeSelectGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: 8,
};

const tradeSelectLabelStyle = {
  display: "grid",
  gap: 5,
  color: "var(--text-secondary)",
  fontSize: 12,
  fontWeight: 800,
};

const chatBubbleStyle = {
  maxWidth: "min(80%, 540px)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "9px 12px",
  display: "grid",
  gap: 3,
  color: "var(--text-primary)",
  fontSize: 14,
};

const myChatBubbleStyle = {
  justifySelf: "end",
  background: "var(--success-bg)",
  borderColor: "var(--success-border)",
};

const friendChatBubbleStyle = {
  justifySelf: "start",
  background: "var(--surface-2)",
};

const chatAuthorStyle = {
  fontSize: 11,
  fontWeight: 900,
  color: "var(--text-secondary)",
};
