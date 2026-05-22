import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase";

const TOTAL_CARDS = 150;

export default function App() {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedRarity, setSelectedRarity] =
    useState("Common");

  const [filterRarity, setFilterRarity] =
    useState("All");

  async function loadCards() {
    setLoading(true);

    const { data } = await supabase
      .from("collections")
      .select("*")
      .order("card_id");

    setCards(data || []);
    setLoading(false);
  }

  async function addCard() {
    if (!newCard.trim()) return;

    await supabase.from("collections").upsert({
      card_id: newCard,
      found: true,
      dupes: 0,
      rarity: selectedRarity,
    });

    setNewCard("");
    loadCards();
  }

  async function removeCard(card_id) {
    await supabase
      .from("collections")
      .delete()
      .eq("card_id", card_id);

    loadCards();
  }

  useEffect(() => {
    loadCards();

    const channel = supabase
      .channel("cards-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "collections",
        },
        () => {
          loadCards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch = card.card_id
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesRarity =
        filterRarity === "All"
          ? true
          : card.rarity === filterRarity;

      return matchesSearch && matchesRarity;
    });
  }, [cards, search, filterRarity]);

  const progress = Math.round(
    (cards.length / TOTAL_CARDS) * 100
  );

  const stats = {
    legendary: cards.filter(
      (c) => c.rarity === "Legendary"
    ).length,

    epic: cards.filter(
      (c) => c.rarity === "Epic"
    ).length,

    rare: cards.filter(
      (c) => c.rarity === "Rare"
    ).length,

    common: cards.filter(
      (c) => c.rarity === "Common"
    ).length,
  };

  function getCardStyle(rarity) {
    switch (rarity) {
      case "Legendary":
        return {
          background:
            "linear-gradient(135deg,#581c87,#c026d3)",
          boxShadow:
            "0 0 30px rgba(217,70,239,0.45)",
        };

      case "Epic":
        return {
          background:
            "linear-gradient(135deg,#7c2d12,#ea580c)",
          boxShadow:
            "0 0 25px rgba(249,115,22,0.35)",
        };

      case "Rare":
        return {
          background:
            "linear-gradient(135deg,#082f49,#0284c7)",
          boxShadow:
            "0 0 25px rgba(56,189,248,0.35)",
        };

      default:
        return {
          background:
            "linear-gradient(135deg,#222,#2f2f2f)",
          boxShadow:
            "0 0 10px rgba(255,255,255,0.05)",
        };
    }
  }

  function rarityColor(rarity) {
    switch (rarity) {
      case "Legendary":
        return "#f0abfc";

      case "Epic":
        return "#fdba74";

      case "Rare":
        return "#7dd3fc";

      default:
        return "#d4d4d4";
    }
  }

  function rarityEmoji(rarity) {
    switch (rarity) {
      case "Legendary":
        return "👑";

      case "Epic":
        return "🔥";

      case "Rare":
        return "💎";

      default:
        return "🦴";
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#050505,#101522)",
        color: "white",
        padding: 20,
        fontFamily:
          "Inter, Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 950,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: 50,
            marginBottom: 10,
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          🦖 Dino Collection
        </h1>

        <p
          style={{
            textAlign: "center",
            opacity: 0.7,
            marginBottom: 30,
          }}
        >
          Colleziona dinosauri rari e completa
          la tua collezione.
        </p>

        <div
          style={{
            background: "#181818",
            padding: 20,
            borderRadius: 20,
            marginBottom: 25,
            border: "1px solid #2f2f2f",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              fontWeight: "bold",
            }}
          >
            <span>Progressione</span>
            <span>
              {cards.length}/{TOTAL_CARDS}
            </span>
          </div>

          <div
            style={{
              height: 18,
              background: "#333",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg,#00ff88,#00c46a)",
                transition: "0.4s",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 10,
              textAlign: "center",
              opacity: 0.8,
            }}
          >
            {progress}% completato
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(150px,1fr))",
            gap: 15,
            marginBottom: 25,
          }}
        >
          <StatCard
            title="Legendary"
            value={stats.legendary}
            color="#f0abfc"
          />

          <StatCard
            title="Epic"
            value={stats.epic}
            color="#fdba74"
          />

          <StatCard
            title="Rare"
            value={stats.rare}
            color="#7dd3fc"
          />

          <StatCard
            title="Common"
            value={stats.common}
            color="#d4d4d4"
          />
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 15,
          }}
        >
          <select
            value={selectedRarity}
            onChange={(e) =>
              setSelectedRarity(e.target.value)
            }
            style={inputStyle}
          >
            <option>Common</option>
            <option>Rare</option>
            <option>Epic</option>
            <option>Legendary</option>
          </select>

          <input
            value={newCard}
            onChange={(e) =>
              setNewCard(e.target.value)
            }
            placeholder="Nuovo dinosauro..."
            style={{
              ...inputStyle,
              flex: 1,
              minWidth: 200,
            }}
          />

          <button
            onClick={addCard}
            style={buttonStyle}
          >
            Aggiungi
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 25,
          }}
        >
          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="🔎 Cerca dinosauro..."
            style={{
              ...inputStyle,
              flex: 1,
              minWidth: 220,
            }}
          />

          <select
            value={filterRarity}
            onChange={(e) =>
              setFilterRarity(e.target.value)
            }
            style={inputStyle}
          >
            <option value="All">
              Tutte le rarità
            </option>

            <option value="Legendary">
              Legendary
            </option>

            <option value="Epic">
              Epic
            </option>

            <option value="Rare">
              Rare
            </option>

            <option value="Common">
              Common
            </option>
          </select>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              opacity: 0.7,
              marginTop: 50,
            }}
          >
            Caricamento...
          </div>
        ) : filteredCards.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              opacity: 0.5,
              marginTop: 50,
            }}
          >
            Nessuna carta trovata.
          </div>
        ) : (
          filteredCards.map((card) => (
            <div
              key={card.id}
              style={{
                ...getCardStyle(card.rarity),
                marginBottom: 18,
                padding: 18,
                borderRadius: 24,
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                border:
                  "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                <img
                  src={`https://robohash.org/${card.card_id}.png?set=set2`}
                  alt={card.card_id}
                  style={{
                    width: 95,
                    height: 95,
                    objectFit: "cover",
                    borderRadius: 20,
                    border:
                      "2px solid rgba(255,255,255,0.12)",
                  }}
                />

                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    {card.card_id}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      opacity: 0.75,
                    }}
                  >
                    Doppie: {card.dupes}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      color: rarityColor(
                        card.rarity
                      ),
                      fontWeight: "bold",
                    }}
                  >
                    {rarityEmoji(card.rarity)}{" "}
                    {card.rarity}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  removeCard(card.card_id)
                }
                style={{
                  background:
                    "linear-gradient(135deg,#ff4d4d,#dc2626)",
                  border: "none",
                  color: "white",
                  padding: "12px 18px",
                  borderRadius: 14,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Elimina
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#181818",
        padding: 18,
        borderRadius: 20,
        border: `1px solid ${color}40`,
      }}
    >
      <div
        style={{
          opacity: 0.7,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 30,
          fontWeight: "bold",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const inputStyle = {
  padding: 16,
  borderRadius: 14,
  border: "1px solid #333",
  background: "#1d1d1d",
  color: "white",
  fontSize: 16,
  outline: "none",
};

const buttonStyle = {
  background:
    "linear-gradient(135deg,#00ff88,#00c46a)",
  border: "none",
  color: "black",
  fontWeight: "bold",
  padding: "0 24px",
  borderRadius: 14,
  cursor: "pointer",
  fontSize: 16,
};