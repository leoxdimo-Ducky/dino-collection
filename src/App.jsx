import { useCallback, useEffect, useMemo, useState } from "react";
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
  }, [user]);

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

  const collectionCards = useMemo(
    () =>
      cards.map((card) => {
        const rarity = normalizeRarity(card.rarity);

        return {
          ...card,
          card_id: card.card_id,
          name: deriveNameFromCardId(card.card_id, rarity),
          rarity,
        };
      }),
    [cards]
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
    setFilterRarity("All");
  }, [filterSection]);

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
      supabase.removeChannel(channel);
    };
  }, [loadCards, user]);

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
            {TOTAL_DISPLAY_CARDS} carte uniche, {TOTAL_CARD_VARIANTS} varianti da
            completare.
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
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <span style={emailStyle}>{user.email}</span>
          </button>
        )}
      </header>

      <section style={progressBoxStyle}>
        <div style={progressHeaderStyle}>
          <span>Progressione varianti</span>
          <span>
            {ownedCatalogVariantCount}/{TOTAL_CARD_VARIANTS}
          </span>
        </div>

        <div style={progressTrackStyle}>
          <div style={{ ...progressFillStyle, width: `${progress}%` }} />
        </div>

        <div style={progressTextStyle}>
          {progress}% completato, {ownedDisplayCards}/{TOTAL_DISPLAY_CARDS} carte
          accese
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
          onChange={(event) => setFilterSection(event.target.value)}
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
          />
        )}
      </section>

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
        />
      )}

      {/* Bottom Bar Mobile Style Navigation */}
      {isMobile && (
        <nav style={bottomNavigationStyle}>
          <button 
            type="button" 
            style={bottomNavTabStyle} 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <span style={{ fontSize: 20 }}>🃏</span>
            <span style={bottomNavLabelStyle}>Collezione</span>
          </button>
          <button 
            type="button" 
            style={bottomNavTabStyle} 
            onClick={() => setIsSettingsOpen(true)}
          >
            <span style={{ fontSize: 20 }}>⚙️</span>
            <span style={bottomNavLabelStyle}>Impostazioni</span>
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

function SectionedCardGrid({ groups, ownershipMap, variantBusy, onToggle }) {
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
                <span style={{ fontWeight: 900, fontSize: 17, color: "white" }}>{section.title}</span>
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

function CollectionCard({ group, ownershipMap, variantBusy, onToggle }) {
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

            return (
              <button
                key={variant.card_id}
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
function SettingsModal({ user, logout, currentTheme, setCurrentTheme, rarityStats, isMobile, onClose }) {
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

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
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
                <div style={{ fontSize: 12, color: "#8996a8", marginTop: 2 }}>ID: {user.id.slice(0, 8)}...</div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => alert("Tabella profili non rilevata nel database. Configura un trigger di Supabase per abilitare la modifica del nickname o dell'avatar!")}
              style={inlineSettingButtonStyle}
            >
              Modifica nome utente o avatar
            </button>
          </div>

          {/* Sottosezione Interfaccia / Preferenze */}
          <div style={settingsSectionBoxStyle}>
            <h3 style={settingsSectionTitleStyle}>Personalizzazione</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <span style={{ color: "#d8dee9" }}>Tema applicazione</span>
              <button type="button" onClick={handleThemeToggle} style={inlineThemeToggleStyle}>
                {currentTheme === "dark" ? "🌙 Scuro" : "☀️ Chiaro"}
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
                  color: passwordMessage.startsWith("Errore") ? "#fecaca" : "#a9f7ba"
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

          {/* Bottone Logout Spostato nel Menù */}
          <button 
            type="button" 
            onClick={() => { logout(); onClose(); }} 
            style={{ ...bulkDeleteButtonStyle, width: "100%", marginTop: 8 }}
          >
            Disconnetti account
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
    border: `1px solid ${active ? color : "rgba(255,255,255,0.12)"}`,
    background: active ? color : "rgba(255,255,255,0.045)",
    color: active ? "#080a0f" : "#d8dee9",
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
    opacity: active ? 0.85 : 0.55,
  };
}

// Stili Globali e di Componente
const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#080b10,#10161f 48%,#10131a)",
  color: "white",
  padding: "12px 16px",
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
  marginBottom: 20,
  flexWrap: "wrap",
};

const titleStyle = {
  color: "white",
  fontSize: "clamp(28px, 6vw, 46px)",
  lineHeight: 1,
  margin: 0,
  fontWeight: 900,
  letterSpacing: 0,
};

const subtitleStyle = {
  color: "#a9b4c4",
  marginTop: 10,
};

const emailStyle = {
  color: "#d8dee9",
  fontSize: 14,
  fontWeight: 600,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  maxWidth: 180,
};

const authPanelStyle = {
  width: "min(440px, 100%)",
  background: "#161c25",
  padding: 24,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  display: "grid",
  gap: 14,
  boxSizing: "border-box",
};

const authSwitchStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  background: "#0d1118",
  padding: 6,
  borderRadius: 8,
};

const switchButtonStyle = {
  border: "none",
  background: "transparent",
  color: "#d8dee9",
  padding: "10px 12px",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
};

const switchActiveStyle = {
  ...switchButtonStyle,
  background: "#1e3b2a",
  color: "#a9f7ba",
};

const progressBoxStyle = {
  background: "#151b24",
  padding: 18,
  borderRadius: 8,
  marginBottom: 18,
  border: "1px solid rgba(255,255,255,0.12)",
};

const progressHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  marginBottom: 10,
  fontWeight: 800,
};

const progressTrackStyle = {
  height: 16,
  background: "#2a303b",
  borderRadius: 999,
  overflow: "hidden",
};

const progressFillStyle = {
  height: "100%",
  background: "linear-gradient(90deg,#7ddf8f,#69b7ff,#f7c948)",
  transition: "width 0.35s ease",
};

const progressTextStyle = {
  marginTop: 10,
  color: "#a9b4c4",
  textAlign: "center",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
  gap: 10,
  marginBottom: 16,
};

const statCardStyle = {
  background: "#151b24",
  padding: 16,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
};

const statLabelStyle = {
  color: "#a9b4c4",
  marginBottom: 8,
};

const statValueStyle = {
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 900,
};

const statTotalStyle = {
  marginTop: 8,
  color: "#8996a8",
  fontSize: 13,
};

const trackingPanelStyle = {
  background: "#151b24",
  padding: 18,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  marginBottom: 18,
  display: "grid",
  gap: 16,
};

const trackingGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 200px),1fr))",
  gap: 10,
};

const trackingCardStyle = {
  background: "#0f141c",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
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
  color: "#f5f7fb",
  fontWeight: 900,
};

const trackingPercentStyle = {
  color: "#f7c948",
  fontSize: 24,
  fontWeight: 900,
};

const trackingBarStyle = {
  height: 10,
  background: "#2a303b",
  borderRadius: 999,
  overflow: "hidden",
};

const trackingBarFillStyle = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg,#7ddf8f,#69b7ff)",
  transition: "width 0.35s ease",
};

const trackingNumbersStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3,1fr)",
  gap: 8,
  color: "#a9b4c4",
  fontSize: 13,
};

const bulkPanelStyle = {
  background: "#151b24",
  padding: 18,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  marginBottom: 18,
  display: "grid",
  gap: 16,
};

const sectionTitleStyle = {
  color: "white",
  fontSize: 20,
  margin: 0,
  fontWeight: 900,
  letterSpacing: 0,
};

const sectionTextStyle = {
  marginTop: 6,
  color: "#a9b4c4",
};

const bulkGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 190px),1fr))",
  gap: 10,
};

const bulkActionCardStyle = {
  background: "#0f141c",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
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
  background: "#16231b",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "white",
  padding: 11,
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
};

const bulkDeleteButtonStyle = {
  background: "#2a1111",
  border: "1px solid rgba(248,113,113,0.45)",
  color: "#fecaca",
  padding: 11,
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 800,
};

const bulkCountStyle = {
  color: "#d8dee9",
  fontSize: 14,
};

const toolbarStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 14,
  alignItems: "stretch",
};

const inputStyle = {
  padding: "14px 16px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "#111721",
  color: "white",
  fontSize: 18,
  outline: "none",
  boxSizing: "border-box",
  WebkitAppearance: "none",
  appearance: "none",
  touchAction: "manipulation",
  minHeight: 52,
};

const buttonStyle = {
  background: "linear-gradient(135deg,#7ddf8f,#f7c948)",
  border: "none",
  color: "#080a0f",
  fontWeight: 900,
  padding: "14px 22px",
  borderRadius: 10,
  cursor: "pointer",
  fontSize: 18,
  minHeight: 52,
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
};

const messageStyle = {
  background: "rgba(247,201,72,0.12)",
  border: "1px solid rgba(247,201,72,0.35)",
  color: "#ffeaa0",
  padding: 12,
  borderRadius: 8,
  marginBottom: 14,
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
  color: "#a9b4c4",
  fontWeight: 800,
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(min(100%, 200px),1fr))",
  gap: 12,
};

const collectionCardStyle = {
  background: "#151b24",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  overflow: "hidden",
  minWidth: 0,
  display: "grid",
};

const cardImageWrapStyle = {
  position: "relative",
  aspectRatio: "4 / 3",
  background: "#0b1018",
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
  left: 10,
  bottom: 10,
  maxWidth: "calc(100% - 20px)",
  background: "rgba(8,10,15,0.78)",
  color: "white",
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 12,
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const collectionCardBodyStyle = {
  padding: 12,
  display: "grid",
  gap: 12,
};

const collectionCardTopStyle = {
  display: "flex",
  alignItems: "start",
  justifyContent: "space-between",
  gap: 10,
};

const collectionCardTitleStyle = {
  color: "white",
  margin: 0,
  fontSize: 18,
  lineHeight: 1.2,
  fontWeight: 900,
  letterSpacing: 0,
  overflowWrap: "anywhere",
};

const cardCountPillStyle = {
  flex: "0 0 auto",
  color: "#d8dee9",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "3px 7px",
  fontSize: 12,
  fontWeight: 900,
};

const rarityPipGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(52px,1fr))",
  gap: 6,
};

const sectionFolderHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  background: "#151b24",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "16px 18px",
  cursor: "pointer",
  color: "white",
  textAlign: "left",
  boxSizing: "border-box",
  touchAction: "manipulation",
  WebkitTapHighlightColor: "transparent",
  minHeight: 56,
};

const emptyStyle = {
  textAlign: "center",
  color: "#a9b4c4",
  marginTop: 34,
};

// === NUOVI STILI PER INTERFACCIA UTENTE E IMPOSTAZIONI RESPONSIVE ===

const desktopProfileTriggerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#151b24",
  padding: "6px 14px",
  borderRadius: 50,
  border: "1px solid rgba(255,255,255,0.12)",
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.2s, border-color 0.2s",
  outline: "none",
};

const avatarStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  background: "linear-gradient(135deg,#7ddf8f,#69b7ff)",
  color: "#080a0f",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 14,
  flexShrink: 0,
};

const bottomNavigationStyle = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  height: 64,
  background: "#0d1118",
  borderTop: "1px solid rgba(255,255,255,0.14)",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  zIndex: 900,
  paddingBottom: "env(safe-area-inset-bottom)", // Gestione safe area dei dispositivi mobile moderni
};

const bottomNavTabStyle = {
  background: "transparent",
  border: "none",
  color: "white",
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
  color: "#a9b4c4",
  fontWeight: 700,
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(5, 7, 10, 0.8)",
  backdropFilter: "blur(5px)",
  display: "flex",
  alignItems: "flex-end", // Su mobile spunta dal basso
  justifyContent: "center",
  zIndex: 2000,
  // Rilevamento tramite foglio di stile per centrarlo su desktop
  "@media (min-width: 640px)": {
    alignItems: "center",
  }
};

// Fallback dinamico gestito via JS per supportare il comportamento desktop/mobile dell'overlay
if (typeof window !== "undefined" && window.innerWidth >= 640) {
  modalOverlayStyle.alignItems = "center";
}

const modalContainerStyle = {
  background: "#161c25",
  border: "1px solid rgba(255,255,255,0.12)",
  maxHeight: "85vh",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  boxShadow: "0 -10px 25px -5px rgba(0,0,0,0.5), 0 20px 25px -5px rgba(0,0,0,0.5)",
  boxSizing: "border-box",
};

const modalHeaderStyle = {
  padding: "16px 20px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const modalCloseButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#a9b4c4",
  fontSize: 20,
  fontWeight: "bold",
  cursor: "pointer",
  padding: 4,
  outline: "none",
};

const modalBodyStyle = {
  padding: 20,
  overflowY: "auto",
  display: "grid",
  gap: 18,
};

const settingsSectionBoxStyle = {
  background: "#0f141c",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: 8,
  padding: 14,
  display: "grid",
  gap: 8,
};

const settingsSectionTitleStyle = {
  margin: 0,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#f7c948",
  fontWeight: 900,
};

const inlineSettingButtonStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  padding: "8px 12px",
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 6,
  width: "100%",
  textAlign: "center",
};

const inlineThemeToggleStyle = {
  background: "#1b2330",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "white",
  padding: "6px 14px",
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const inlineFormSubmitStyle = {
  background: "#1c3224",
  border: "1px solid #7ddf8f",
  color: "#a9f7ba",
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
  fontSize: 14,
  borderBottom: "1px solid rgba(255,255,255,0.04)",
  paddingBottom: 4,
};