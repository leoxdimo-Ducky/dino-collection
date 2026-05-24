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
    friends: "Amici",
    progress: "Progressione",
    settings: "Impostazioni",
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
    friendSearch: "Cerca utente per email...",
    sendRequest: "Invia richiesta",
    accept: "Accetta",
    decline: "Rifiuta",
    removeFriend: "Rimuovi",
    noFriends: "Nessun amico ancora. Cerca un utente per email per iniziare!",
    pendingRequests: "Richieste in arrivo",
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
    friends: "Friends",
    progress: "Progress",
    settings: "Settings",
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
    friendSearch: "Search user by email...",
    sendRequest: "Send request",
    accept: "Accept",
    decline: "Decline",
    removeFriend: "Remove",
    noFriends: "No friends yet. Search a user by email to start!",
    pendingRequests: "Incoming requests",
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [variantBusy, setVariantBusy] = useState("");
  const [bulkBusy, setBulkBusy] = useState("");
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState("");

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
  const [friendSearchEmail, setFriendSearchEmail] = useState("");
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [friendSearchBusy, setFriendSearchBusy] = useState(false);
  const [friendSearchMsg, setFriendSearchMsg] = useState("");
  const [viewingFriend, setViewingFriend] = useState(null);
  const [friendStats, setFriendStats] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const prevOwnedRef = React.useRef({});

  const user = session?.user;

  // Monitoraggio della larghezza dello schermo per la responsività dei menù
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
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
  
  const loadCards = useCallback(async (currentUser = user) => {
    if (!currentUser) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("card_id");

    if (error) {
      setMessage("Non riesco a caricare la collezione.");
      setCards([]);
    } else {
      setMessage("");
      setCards(data || []);
    }

    setLoading(false);
if (currentUser && data) {
  saveSnapshot(currentUser, (data || []).length);
}  }, [user, saveSnapshot]);

  // --- DOPPIONI ---
  async function incrementDupe(variant) {
    if (!user) return;
    const existing = cards.find(c => c.card_id === variant.card_id);
    if (!existing) { await addVariant(variant); return; }
    const newDupes = (existing.dupes || 0) + 1;
    await supabase.from("collections").update({ dupes: newDupes }).eq("user_id", user.id).eq("card_id", variant.card_id);
    await loadCards();
  }

  async function decrementDupe(variant) {
    if (!user) return;
    const existing = cards.find(c => c.card_id === variant.card_id);
    if (!existing) return;
    const newDupes = Math.max(0, (existing.dupes || 0) - 1);
    await supabase.from("collections").update({ dupes: newDupes }).eq("user_id", user.id).eq("card_id", variant.card_id);
    await loadCards();
  }

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
  const loadFriends = useCallback(async (currentUser) => {
    if (!currentUser) return;
    const { data } = await supabase.from("friendships")
      .select("id,requester_id,addressee_id,status,profiles!friendships_requester_id_fkey(username),profiles!friendships_addressee_id_fkey(username)")
      .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`)
      .eq("status", "accepted");
    setFriends(data || []);

    const { data: reqs } = await supabase.from("friendships")
      .select("id,requester_id,profiles!friendships_requester_id_fkey(username,id)")
      .eq("addressee_id", currentUser.id)
      .eq("status", "pending");
    setFriendRequests(reqs || []);
  }, []);

  async function searchFriendByEmail() {
    setFriendSearchBusy(true);
    setFriendSearchMsg("");
    setFriendSearchResult(null);
    // search by username
    const { data: byUsername } = await supabase.from("profiles").select("id,username").ilike("username", `%${friendSearchEmail.trim()}%`);
    if (byUsername && byUsername.length > 0 && byUsername[0].id !== user.id) {
      setFriendSearchResult(byUsername[0]);
    } else {
      setFriendSearchMsg("Nessun utente trovato con quel nome.");
    }
    setFriendSearchBusy(false);
  }

  async function sendFriendRequest(addresseeId) {
    const { error } = await supabase.from("friendships").insert({ requester_id: user.id, addressee_id: addresseeId, status: "pending" });
    if (error) setFriendSearchMsg("Richiesta già inviata o amici.");
    else { setFriendSearchMsg("Richiesta inviata!"); setFriendSearchResult(null); setFriendSearchEmail(""); }
  }

  async function respondToRequest(id, accept) {
    await supabase.from("friendships").update({ status: accept ? "accepted" : "declined" }).eq("id", id);
    await loadFriends(user);
  }

  async function removeFriend(id) {
    await supabase.from("friendships").delete().eq("id", id);
    await loadFriends(user);
  }

  async function loadFriendStats(friendId) {
    const { data: cols } = await supabase.from("collections").select("card_id,rarity,dupes").eq("user_id", friendId);
    const { data: prof } = await supabase.from("profiles").select("username").eq("id", friendId).single();
    const owned = (cols || []).length;
    const dupes = (cols || []).reduce((a, c) => a + (c.dupes || 0), 0);
    const byRarity = RARITY_LABELS.reduce((acc, r) => {
      acc[r] = (cols || []).filter(c => c.rarity === r).length;
      return acc;
    }, {});
    setFriendStats({ id: friendId, username: prof?.username || "Amico", owned, dupes, byRarity, cards: cols || [] });
    setViewingFriend(friendId);
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

  async function logout() {
    await supabase.auth.signOut();
    setCards([]);
    setSearch("");
  }

  const collectionCards = cards.map((card) => {
    const rarity = normalizeRarity(card.rarity);

    return {
      ...card,
      card_id: card.card_id,
      name: deriveNameFromCardId(card.card_id, rarity),
      rarity,
    };
  });

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

      return matchesSearch && matchesSection && matchesRarity;
    });
  }, [cardGroups, filterRarity, filterSection, ownershipMap, search]);

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
    await loadCards();
    setVariantBusy("");
    return true;
  }

  async function toggleVariant(variant) {
    if (!user) return;

    const ownedSourceId = ownershipMap.get(variant.card_id);
    setVariantBusy(variant.card_id);

    if (ownedSourceId) {
      const { error } = await supabase
        .from("collections")
        .delete()
        .eq("user_id", user.id)
        .eq("card_id", ownedSourceId);

      if (error) {
        setMessage(`Non riesco a rimuovere ${variant.name}.`);
      } else {
        setMessage("");
        await loadCards();
      }

      setVariantBusy("");
      return;
    }

    await addVariant(variant);
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
      await loadCards();
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
      await loadCards();
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

    const relatedDataTimer = window.setTimeout(() => {
      loadFriends(user);
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
          loadCards(user);
        }
      )
      .subscribe();

    return () => {
      window.clearTimeout(loadTimer);
      window.clearTimeout(relatedDataTimer);
      supabase.removeChannel(channel);
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
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Release The Creature</h1>
          <p style={subtitleStyle}>
            {t.appSubtitle(TOTAL_DISPLAY_CARDS, TOTAL_CARD_VARIANTS)}
          </p>
        </div>

        {/* Desktop Top-Right Profile Dropdown/Trigger */}
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
      </header>

      {/* CONFETTI */}
      {confettiActive && <ConfettiOverlay />}

      {/* TAB NAVIGATION */}
      <div style={tabNavStyle}>
        {["collection","friends","progress"].map(tab => (
          <button key={tab} type="button"
            onClick={() => setActiveTab(tab)}
            style={{ ...tabBtnStyle, ...(activeTab === tab ? tabBtnActiveStyle : {}) }}
          >
            {tab === "collection" ? `🃏 ${t.collection}` : tab === "friends" ? `🤝 ${t.friends}` : `📈 ${t.progress}`}
          </button>
        ))}
      </div>

      {activeTab === "friends" && (
        <FriendsPanel
          user={user}
          t={t}
          friends={friends}
          friendRequests={friendRequests}
          friendSearchEmail={friendSearchEmail}
          setFriendSearchEmail={setFriendSearchEmail}
          friendSearchResult={friendSearchResult}
          friendSearchBusy={friendSearchBusy}
          friendSearchMsg={friendSearchMsg}
          onSearch={searchFriendByEmail}
          onSendRequest={sendFriendRequest}
          onRespond={respondToRequest}
          onRemove={removeFriend}
          onViewFriend={loadFriendStats}
          viewingFriend={viewingFriend}
          friendStats={friendStats}
          onBackToMine={() => { setViewingFriend(null); setFriendStats(null); }}
          collectionCards={collectionCards}
          dupesMap={dupesMap}
        />
      )}

      {activeTab === "progress" && (
        <ProgressPanel t={t} snapshots={snapshots} onExportCSV={exportCSV} collectionCards={collectionCards} dupesMap={dupesMap} totalDupes={totalDupes} />
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
        <div>
          <h2 style={sectionTitleStyle}>Divisione rarita</h2>
          <p style={sectionTextStyle}>Ordine base: Tear C, Tear B, Tear A, Tear S.</p>
        </div>

        <div style={bulkGridStyle}>
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
                  >
                    {bulkBusy === rarity.label ? "Aggiunta..." : "Aggiungi mancanti"}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAllByRarity(rarity.label)}
                    disabled={deleteDisabled}
                    style={{
                      ...bulkDeleteButtonStyle,
                      opacity: deleteDisabled ? 0.55 : 1,
                    }}
                  >
                    {bulkDeleteBusy === rarity.label
                      ? "Elimino..."
                      : "Elimina possedute"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={toolbarStyle}>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cerca carta..."
          style={{ ...inputStyle, flex: 1, minWidth: 220, fontSize: 18 }}
        />

        <select
          value={filterSection}
          onChange={(event) => {
            setFilterSection(event.target.value);
            setFilterRarity("All");
          }}
          style={{ ...inputStyle, fontSize: 18 }}
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
          style={{ ...inputStyle, fontSize: 18 }}
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
      </section>

      {message ? <div style={messageStyle}>{message}</div> : null}

      <section style={cardBrowserStyle}>
        <div style={cardBrowserHeaderStyle}>
          <h2 style={sectionTitleStyle}>Griglia carte</h2>
          <span style={gridCountStyle}>
            {filteredGroups.length}/{cardGroups.length}
          </span>
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
            onToggle={toggleVariant}
            dupesMap={dupesMap}
            onIncrementDupe={incrementDupe}
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
        <nav style={{ ...bottomNavigationStyle, gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          {["collection","friends","progress"].map(tab => (
            <button key={tab} type="button" style={{ ...bottomNavTabStyle, borderTop: activeTab === tab ? "2px solid var(--accent-green)" : "2px solid transparent" }} onClick={() => setActiveTab(tab)}>
              <span style={{ fontSize: 18 }}>{tab === "collection" ? "🃏" : tab === "friends" ? "🤝" : "📈"}</span>
              <span style={bottomNavLabelStyle}>{tab === "collection" ? t.collection : tab === "friends" ? t.friends : t.progress}</span>
            </button>
          ))}
          <button type="button" style={bottomNavTabStyle} onClick={() => setIsSettingsOpen(true)}>
            <span style={{ fontSize: 18 }}>⚙️</span>
            <span style={bottomNavLabelStyle}>{t.settings}</span>
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
        placeholder="Password"
        autoComplete={isLogin ? "current-password" : "off"}
        minLength={6}
        required
        style={{ ...inputStyle, width: "100%" }}
      />

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
      paddingBottom: isMobile ? 84 : 12 // Spazio extra in basso per non far coprire i contenuti dalla bottom bar mobile
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

function SectionedCardGrid({ groups, ownershipMap, variantBusy, onToggle, dupesMap, onIncrementDupe, onDecrementDupe, t }) {
  const [collapsed, setCollapsed] = useState({});

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
                    onToggle={onToggle}
                    dupesMap={dupesMap}
                    onIncrementDupe={onIncrementDupe}
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

function CollectionCard({ group, ownershipMap, variantBusy, onToggle, dupesMap, onIncrementDupe, onDecrementDupe }) {
  const activeVariant =
    group.variants.find((variant) => ownershipMap.has(variant.card_id)) ||
    group.variants[0];
  const activeColor = getRarityMeta(activeVariant.rarity).color;
  const imageSeed = encodeURIComponent(`${group.section}-${group.name}`);
  const isOwned = group.ownedCount > 0;

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

        <div style={rarityPipGridStyle}>
          {group.variants.map((variant) => {
            const rarity = getRarityMeta(variant.rarity);
            const active = ownershipMap.has(variant.card_id);
            const busy = variantBusy === variant.card_id;
            const dupes = dupesMap?.get(variant.card_id) || 0;

            return (
              <div key={variant.card_id} style={{ display: "grid", gap: 3 }}>
                <button
                  type="button"
                  title={`${variant.rarity}${active ? " posseduta" : " mancante"}`}
                  aria-label={`${group.name} ${variant.rarity}`}
                  onClick={() => onToggle(variant)}
                  disabled={busy}
                  style={getRarityPipStyle(rarity.color, active, busy)}
                >
                  <span style={getRarityDotStyle(rarity.color, active)} />
                  <span>{rarity.short}</span>
                </button>
                {active && (
                  <div style={dupeRowStyle}>
                    <button type="button" style={dupeSmallBtnStyle} onClick={() => onDecrementDupe(variant)} title="-1">−</button>
                    <span style={dupeCountStyle}>{dupes > 0 ? `×${dupes}` : "0"}</span>
                    <button type="button" style={dupeSmallBtnStyle} onClick={() => onIncrementDupe(variant)} title="+1">+</button>
                  </div>
                )}
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

// Componente dedicato per il Modale Impostazioni
function SettingsModal({ user, logout, currentTheme, setCurrentTheme, rarityStats, isMobile, onClose, onUsernameSaved, lang, setLang, accessibilityMode, setAccessibilityMode, t, onExportCSV }) {
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [username, setUsername] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

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
    setProfileBusy(true);
    setProfileMessage("");

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username: username.trim(), updated_at: new Date().toISOString() }, { onConflict: "id" });

    if (error) {
      setProfileMessage(`Errore: ${error.message}`);
    } else {
      setProfileMessage("Profilo aggiornato!");
      if (onUsernameSaved) onUsernameSaved(username.trim());
    }
    setProfileBusy(false);
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordMessage("");

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordMessage(`Errore: ${error.message}`);
    } else {
      setPasswordMessage("Password aggiornata correttamente.");
      setNewPassword("");
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
                  placeholder="Nome utente (es. Lorenzo)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={32}
                  style={{ ...inputStyle, padding: "10px 12px", minHeight: 44, fontSize: 15 }}
                />
                <button type="submit" disabled={profileBusy} style={inlineFormSubmitStyle}>
                  {profileBusy ? "Salvataggio..." : "Salva nome utente"}
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
                placeholder="Nuova password (min. 6 caratteri)" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                style={{ ...inputStyle, padding: "10px 12px", minHeight: 44, fontSize: 15 }}
              />
              <button type="submit" disabled={passwordBusy} style={inlineFormSubmitStyle}>
                {passwordBusy ? "Aggiornamento..." : "Cambia password"}
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
    minHeight: 34,
    borderRadius: 8,
    border: active ? `2px solid ${color}` : "1px solid var(--border-strong)",
    background: active ? color : "var(--surface-2)",
    color: active ? "#080a0f" : "var(--text-primary)",
    cursor: busy ? "wait" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    fontWeight: 900,
    fontSize: 12,
    opacity: busy ? 0.6 : 1,
    transition: "background 0.18s ease, border-color 0.18s ease, opacity 0.18s ease",
  };
}

function getRarityDotStyle(color, active) {
  return {
    width: 8,
    height: 8,
    borderRadius: 2,
    background: active ? "#080a0f" : color,
    opacity: active ? 0.9 : 0.7,
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
function FriendsPanel({ user, t, friends, friendRequests, friendSearchEmail, setFriendSearchEmail,
  friendSearchResult, friendSearchBusy, friendSearchMsg, onSearch, onSendRequest, onRespond,
  onRemove, onViewFriend, viewingFriend, friendStats, onBackToMine, collectionCards, dupesMap }) {

  if (viewingFriend && friendStats) {
    const tradeCards = (friendStats.cards || []).filter(c => (c.dupes || 0) > 0);
    return (
      <div style={{ display: "grid", gap: 16 }}>
        <button type="button" onClick={onBackToMine} style={{ ...inlineSettingButtonStyle, width: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
          {t.backToMine}
        </button>
        <div style={{ ...trackingPanelStyle, marginBottom: 0 }}>
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

        <div style={trackingPanelStyle}>
          <h3 style={sectionTitleStyle}>{t.tradeList}</h3>
          <p style={sectionTextStyle}>{t.tradeDesc}</p>
          {tradeCards.length === 0 ? (
            <div style={emptyStyle}>{t.noTrades}</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {tradeCards.map(c => {
                const meta = getRarityMeta(c.rarity);
                return (
                  <div key={c.card_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{c.card_id.replace(/-/g," ")}</span>
                    <span style={{ color: meta.color, fontWeight: 900, fontSize: 13 }}>{meta.label} ×{c.dupes}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* La mia lista scambio */}
      <div style={trackingPanelStyle}>
        <h3 style={sectionTitleStyle}>{t.tradeList}</h3>
        <p style={sectionTextStyle}>{t.tradeDesc}</p>
        {(() => {
          const myTrades = collectionCards.filter(c => (dupesMap.get(c.card_id) || 0) > 0);
          if (myTrades.length === 0) return <div style={emptyStyle}>{t.noTrades}</div>;
          return (
            <div style={{ display: "grid", gap: 6 }}>
              {myTrades.map(c => {
                const meta = getRarityMeta(c.rarity);
                return (
                  <div key={c.card_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{c.name} — {c.rarity}</span>
                    <span style={{ color: meta.color, fontWeight: 900, fontSize: 13 }}>×{dupesMap.get(c.card_id)}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Cerca amico */}
      <div style={trackingPanelStyle}>
        <h3 style={sectionTitleStyle}>{t.friendsTitle}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder={t.friendSearch}
            value={friendSearchEmail}
            onChange={e => setFriendSearchEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSearch()}
            style={{ ...inputStyle, flex: 1, minWidth: 180, fontSize: 15 }}
          />
          <button type="button" onClick={onSearch} disabled={friendSearchBusy} style={buttonStyle}>
            {friendSearchBusy ? "..." : "🔍"}
          </button>
        </div>

        {friendSearchMsg && <div style={messageStyle}>{friendSearchMsg}</div>}

        {friendSearchResult && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ ...avatarStyle, width: 36, height: 36 }}>{(friendSearchResult.username || "?").slice(0,2).toUpperCase()}</div>
              <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>{friendSearchResult.username || friendSearchResult.id.slice(0,8)}</span>
            </div>
            <button type="button" onClick={() => onSendRequest(friendSearchResult.id)} style={inlineFormSubmitStyle}>
              {t.sendRequest}
            </button>
          </div>
        )}
      </div>

      {/* Richieste in arrivo */}
      {friendRequests.length > 0 && (
        <div style={trackingPanelStyle}>
          <h3 style={sectionTitleStyle}>{t.pendingRequests}</h3>
          {friendRequests.map(req => (
            <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ ...avatarStyle, width: 34, height: 34, fontSize: 13 }}>{(req.profiles?.username || "?").slice(0,2).toUpperCase()}</div>
                <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>{req.profiles?.username || req.requester_id.slice(0,8)}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => onRespond(req.id, true)} style={inlineFormSubmitStyle}>{t.accept}</button>
                <button type="button" onClick={() => onRespond(req.id, false)} style={bulkDeleteButtonStyle}>{t.decline}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista amici */}
      <div style={trackingPanelStyle}>
        <h3 style={sectionTitleStyle}>{t.yourFriends}</h3>
        {friends.length === 0 ? (
          <div style={emptyStyle}>{t.noFriends}</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {friends.map(f => {
              const isRequester = f.requester_id === user.id;
              const friendId = isRequester ? f.addressee_id : f.requester_id;
              const friendUsername = isRequester ? f["profiles!friendships_addressee_id_fkey"]?.username : f["profiles!friendships_requester_id_fkey"]?.username;
              return (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ ...avatarStyle, width: 36, height: 36 }}>{(friendUsername || "?").slice(0,2).toUpperCase()}</div>
                    <span style={{ fontWeight: 800, color: "var(--text-heading)" }}>{friendUsername || friendId.slice(0,8)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => onViewFriend(friendId)} style={inlineFormSubmitStyle}>{t.viewCollection}</button>
                    <button type="button" onClick={() => onRemove(f.id)} style={bulkDeleteButtonStyle}>{t.removeFriend}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// PROGRESS PANEL
// ============================================================
function ProgressPanel({ t, snapshots, onExportCSV, collectionCards, dupesMap, totalDupes }) {
  const maxOwned = snapshots.length > 0 ? Math.max(...snapshots.map(s => s.owned_count), 1) : 1;
  const chartW = 600, chartH = 180, padL = 40, padB = 30, padR = 16, padT = 16;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  const points = snapshots.map((s, i) => {
    const x = padL + (snapshots.length > 1 ? (i / (snapshots.length - 1)) * innerW : innerW / 2);
    const y = padT + innerH - (s.owned_count / maxOwned) * innerH;
    return { x, y, ...s };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(" ");
  const area = points.length > 0
    ? `M${points[0].x},${padT + innerH} ` + points.map(p => `L${p.x},${p.y}`).join(" ") + ` L${points[points.length-1].x},${padT+innerH} Z`
    : "";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={trackingPanelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={sectionTitleStyle}>{t.progressTitle}</h3>
            <p style={sectionTextStyle}>{t.progressDesc}</p>
          </div>
          <button type="button" onClick={onExportCSV} style={inlineFormSubmitStyle}>💾 {t.exportCSV}</button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <svg viewBox={`0 0 ${chartW} ${chartH}`} style={{ width: "100%", minWidth: 280, display: "block" }}>
            {/* grid lines */}
            {[0,0.25,0.5,0.75,1].map(v => {
              const y = padT + innerH - v * innerH;
              return <g key={v}>
                <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="var(--border)" strokeWidth={1} />
                <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-muted)">{Math.round(v * maxOwned)}</text>
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

        {snapshots.length === 0 && <div style={emptyStyle}>Nessun dato ancora. Torna domani per vedere la progressione!</div>}
      </div>

      {/* Riepilogo doppioni per rarità */}
      <div style={trackingPanelStyle}>
        <h3 style={sectionTitleStyle}>{t.dupesLabel} — riepilogo</h3>
        <div style={{ ...statsGridStyle, marginBottom: 0 }}>
          {RARITY_DEFINITIONS.map(r => {
            const count = collectionCards.filter(c => c.rarity === r.label).reduce((a, c) => a + (dupesMap.get(c.card_id) || 0), 0);
            return (
              <div key={r.label} style={{ ...statCardStyle, borderColor: `${r.color}55` }}>
                <div style={statLabelStyle}>{r.label}</div>
                <div style={{ ...statValueStyle, color: r.color, fontSize: 22 }}>{count}</div>
                <div style={statTotalStyle}>{t.dupesLabel}</div>
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: "center", marginTop: 8, color: "var(--text-secondary)", fontWeight: 700 }}>
          Totale doppioni: <span style={{ color: "var(--accent-gold)", fontWeight: 900 }}>{totalDupes}</span>
        </div>
      </div>
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

const titleStyle = {
  color: "var(--text-heading)",
  fontSize: "clamp(26px, 5vw, 42px)",
  lineHeight: 1.05,
  margin: 0,
  fontWeight: 900,
  letterSpacing: "-0.5px",
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
  padding: 20,
  borderRadius: 12,
  border: "1px solid var(--border)",
  marginBottom: 16,
  display: "grid",
  gap: 16,
  boxShadow: "var(--card-shadow)",
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
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 190px),1fr))",
  gap: 10,
};

const bulkActionCardStyle = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: 12,
  display: "grid",
  gap: 10,
};

const bulkActionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const bulkActionButtonsStyle = {
  display: "grid",
  gap: 8,
};

const bulkButtonStyle = {
  background: "var(--success-bg)",
  border: "1px solid var(--success-border)",
  color: "var(--success-text)",
  padding: 11,
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
};

const bulkDeleteButtonStyle = {
  background: "var(--danger-bg)",
  border: "1px solid var(--danger-border)",
  color: "var(--danger-text)",
  padding: 11,
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 13,
};

const bulkCountStyle = {
  color: "var(--text-secondary)",
  fontSize: 13,
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

const gridCountStyle = {
  color: "var(--text-secondary)",
  fontWeight: 800,
  fontSize: 13,
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(min(100%, 200px),1fr))",
  gap: 12,
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
  aspectRatio: "4 / 3",
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
  padding: 12,
  display: "grid",
  gap: 10,
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
  fontSize: 15,
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
  gridTemplateColumns: "repeat(auto-fit,minmax(48px,1fr))",
  gap: 5,
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
  height: 64,
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
  gap: 4,
  cursor: "pointer",
  outline: "none",
  WebkitTapHighlightColor: "transparent",
};

const bottomNavLabelStyle = {
  fontSize: 11,
  color: "var(--text-secondary)",
  fontWeight: 700,
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

// Dupe counter styles inside CollectionCard
const dupeRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
};

const dupeSmallBtnStyle = {
  width: 20,
  height: 20,
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
  fontSize: 11,
  fontWeight: 900,
  color: "var(--accent-gold)",
  minWidth: 18,
  textAlign: "center",
};
