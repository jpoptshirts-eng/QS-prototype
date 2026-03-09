import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./supabaseClient";
import productsJsonFallback from "./products.json";
import mdHeroRoast from "../Images/md-hero-roast.png";
import mdAllMothersDay from "../Images/md-all-mothers-day.png";
import mdOffersMothersDay from "../Images/md-offers-mothers-day.png";
import mdHealthBeauty from "../Images/md-health-beauty.png";
import mdGoodies from "../Images/md-goodies.png";

const green = "#5b8226";
const successGreen = "#78be20";
const squidInk = "#333333";
const waitroseGrey = "#53565a";
const oysterGrey = "#dddddd";
const scallopGrey = "#f3f3f3";

function parsePrice(raw) {
  if (typeof raw === "number") return raw;
  if (!raw) return 0;
  const s = String(raw).trim();
  if (s.endsWith("p")) return parseFloat(s) / 100 || 0;
  return parseFloat(s.replace("£", "")) || 0;
}

const SCORE_THRESHOLD = 0.6;
const HOUSEHOLD_CATEGORIES = ["non food", "health & beauty"];

const EVENT_ITEMS = [
  {
    id: "EVT-841909",
    name: "Ferrero Rocher gift box of chocolates 24 pieces",
    price: 7.0, // ~£7.00 for 300g at Waitrose [Ferrero Rocher Gift Box 24 Pieces 300g](https://www.waitrose.com/ecom/products/ferrero-rocher-gift-box-of-chocolates-24-pieces/841909-804994-804995)
    weight: "300g",
    ppu: "£2.33 per 100g",
    quantity: 0,
    image: "https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_841909_BP_11.jpg",
    category: "Events",
    offers: "",
    order: 10001,
    score: 0,
    type: "standard",
    grouping: null,
    model: "EVT",
    productType: "Events",
  },
  {
    id: "EVT-969767",
    name: "Waitrose 4 flower crumpets",
    price: 1.5, // £1.50 per 4-pack, matching decorative crumpet pricing [Waitrose 4 Heart Crumpets 4s](https://www.waitrose.com/ecom/products/waitrose-4-heart-crumpets/969767-836523-836524)
    weight: "4 pack",
    ppu: "37.5p each",
    quantity: 0,
    image: "https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_969767_BP_11.jpg",
    category: "Events",
    offers: "",
    order: 10002,
    score: 0,
    type: "standard",
    grouping: null,
    model: "EVT",
    productType: "Events",
  },
  {
    id: "EVT-899512",
    name: "La Vieille Ferme rosé",
    price: 7.75, // Offer price at Waitrose: £7.75 for 75cl [La Vieille Ferme Rosé 75cl](https://www.waitrose.com/ecom/products/la-vieille-ferme-rose/899512-580400-580401)
    weight: "75cl",
    ppu: "£10.33 per litre",
    quantity: 0,
    image: "https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_899512_BP_11.jpg",
    category: "Events",
    offers: "",
    order: 10003,
    score: 0,
    type: "standard",
    grouping: null,
    model: "EVT",
    productType: "Events",
  },
  {
    id: "EVT-089115",
    name: "Waitrose Foundation spray carnations",
    price: 4.0, // £4.00 per bouquet at Waitrose [Waitrose Foundation Spray Carnations](https://www.waitrose.com/ecom/products/waitrose-foundation-spray-carnations/089115-45828-45829)
    weight: "1 each",
    ppu: "",
    quantity: 0,
    image: "https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_089115_BP_11.jpg",
    category: "Events",
    offers: "",
    order: 10004,
    score: 0,
    type: "standard",
    grouping: null,
    model: "EVT",
    productType: "Events",
  },
  {
    id: "EVT-932288",
    name: "Waitrose 8 heart waffles",
    price: 3.5, // £3.50 per pack of 8 [Waitrose 8 Heart Waffles 8s](https://www.waitrose.com/ecom/products/waitrose-8-heart-waffles/932288-1-2)
    weight: "8 pack",
    ppu: "43.8p per waffle",
    quantity: 0,
    image: "https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_932288_BP_11.jpg",
    category: "Events",
    offers: "",
    order: 10005,
    score: 0,
    type: "standard",
    grouping: null,
    model: "EVT",
    productType: "Events",
  },
  {
    id: "EVT-063005",
    name: "Baileys Original Irish Cream Liqueur",
    price: 13.0, // Typical 70cl price ~£12–£13; using £13.00 as a mid-point [Baileys Original Irish Cream Liqueur 700ml](https://www.waitrose.com/ecom/products/baileys-original-irish-cream-liqueur/063005-31987-31988)
    weight: "70cl",
    ppu: "£18.57 per litre",
    quantity: 0,
    image: "https://ecom-su-static-prod.wtrecom.com/images/products/11/LN_063005_BP_11.jpg",
    category: "Events",
    offers: "",
    order: 10006,
    score: 0,
    type: "standard",
    grouping: null,
    model: "EVT",
    productType: "Events",
  },
];

function mapRow(row) {
  const rawType = (row.Type || "").toString().toLowerCase();
  const type =
    rawType === "single" || rawType === "double" || rawType === "standard"
      ? rawType
      : "standard";

  return {
    id: row.item_id || row.Order,
    name: row.Name,
    price: parsePrice(row.Price),
    weight: row.Size || "",
    ppu: row["Formatted PPU"] || "",
    quantity: Number(row["Recommended Quantity"]) || 1,
    image: row.imageUrl || "",
    category: row.Category || "",
    offers: row.Offers || "",
    order: row.Order,
    score: Number(row.score) || 0,
    type,
    grouping: row.Grouping != null ? String(row.Grouping) : null,
    model: (row.Model || "BBM").toString().toUpperCase(),
    productType: row["Product Type"] || "",
  };
}

export default function App() {
  const [page, setPage] = useState("groceries");
  const [view, setView] = useState("grid");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollToId, setScrollToId] = useState(null);
  const [trolley, setTrolley] = useState({});
  const [ctaState, setCtaState] = useState("idle");
  const [offersOnlyFood, setOffersOnlyFood] = useState(false);
  const [offersOnlyHousehold, setOffersOnlyHousehold] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState("trolley");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [snackbar, setSnackbar] = useState("");
  const scrollAttemptRef = useRef(null);
  const carouselRef = useRef(null);
  const ctaTimerRef = useRef(null);
  const [carouselCanScrollLeft, setCarouselCanScrollLeft] = useState(false);
  const [carouselCanScrollRight, setCarouselCanScrollRight] = useState(true);
  const [isNarrowMobile, setIsNarrowMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 360 : false
  );

  const updateCarouselArrows = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCarouselCanScrollLeft(el.scrollLeft > 2);
    setCarouselCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    requestAnimationFrame(updateCarouselArrows);
  }, [items, page]);

  useEffect(() => {
    const onResize = () => setIsNarrowMobile(window.innerWidth < 360);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("POP038")
        .select("*")
        .order("Order", { ascending: true });

      if (error || !data || data.length === 0) {
        if (error) console.error("Supabase error:", error.message);
        const baseItems = productsJsonFallback.map((p) => ({
          ...p,
          model: (p.model || "BBM").toString().toUpperCase(),
          productType: p.productType || "",
          type: (p.type || "standard").toString().toLowerCase(),
          grouping: p.grouping != null ? String(p.grouping) : null,
        }));
        setItems([...baseItems, ...EVENT_ITEMS]);
      } else {
        const baseItems = data.map(mapRow).map((item) => ({
          ...item,
          quantity: item.score >= SCORE_THRESHOLD ? (item.quantity || 1) : 0,
        }));
        setItems([...baseItems, ...EVENT_ITEMS]);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const updateQty = (id, next) =>
    setItems((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, quantity: Math.max(0, next) } : p))
    );

  const isInTrolley = (item) => {
    const key = String(item.id);
    return trolley[key] !== undefined && trolley[key] >= item.quantity && item.quantity > 0;
  };

  const quickShopItems = items.filter(
    (i) => i.model === "BBM" && i.score >= SCORE_THRESHOLD
  );
  const belowThreshold = items.filter(
    (i) => i.model === "BBM" && i.score < SCORE_THRESHOLD
  );
  const foodDrinkItemsAll = belowThreshold.filter(
    (i) => !HOUSEHOLD_CATEGORIES.includes((i.category || "").toLowerCase())
  );
  const householdItemsAll = belowThreshold.filter(
    (i) => HOUSEHOLD_CATEGORIES.includes((i.category || "").toLowerCase())
  );

  const foodDrinkFiltered = offersOnlyFood
    ? foodDrinkItemsAll.filter((i) => i.offers)
    : foodDrinkItemsAll;
  const householdFiltered = offersOnlyHousehold
    ? householdItemsAll.filter((i) => i.offers)
    : householdItemsAll;

  const foodDrinkVisible = foodDrinkFiltered;
  const householdVisible = householdFiltered;

  const csmItems = items.filter((i) => i.model === "CSM");
  const eventItems = items.filter((i) => i.model === "EVT");
  const csmOffersNonAlcohol = csmItems.filter(
    (item) =>
      (item.offers || "").toString().trim() !== "" &&
      (item.productType || "").toLowerCase() !== "alcohol"
  );
  const csmAlcohol = csmItems.filter(
    (item) => (item.productType || "").toLowerCase() === "alcohol"
  );
  const csmNo1 = csmItems.filter((item) => {
    const name = (item.name || "").toLowerCase();
    return (
      name.includes("no.1") ||
      name.includes("no1") ||
      name.includes("no 1")
    );
  });
  const csmOrganic = csmItems.filter((item) => {
    const name = (item.name || "").toLowerCase();
    return name.includes("organic") || name.includes("duchy");
  });

  const buildGroupMeta = (arr) => {
    const groups = {};

    arr.forEach((item) => {
      const key = item.grouping;
      if (!key) return;

      const itemType = (item.type || "standard").toLowerCase();
      if (!groups[key]) {
        groups[key] = {
          // default; will be updated if we see a single/double item
          type: "standard",
          items: [],
        };
      }

      // Always include the item in the group so no grouped rows are lost
      groups[key].items.push(item);

      // If this row explicitly defines a grouping variant, use it
      if (itemType === "single" || itemType === "double") {
        groups[key].type = itemType;
      }
    });

    // Keep groups with 2+ items (standard groups stay; single/double already set)
    Object.keys(groups).forEach((key) => {
      if (groups[key].items.length < 2) {
        delete groups[key];
      }
    });

    Object.values(groups).forEach((g) => {
      g.items.sort((a, b) => (a.order || 0) - (b.order || 0));
      g.primaryId = g.items[0].id;
    });

    return groups;
  };

  const foodDrinkGroups = buildGroupMeta(foodDrinkVisible);
  const householdGroups = buildGroupMeta(householdVisible);

  const currentJourneyStep =
    page === "quickshop"
      ? 1
      : page === "fooddrink"
      ? 2
      : page === "household"
      ? 3
      : page === "inspiration"
      ? 4
      : 0;

  const visibleItems = quickShopItems.filter((i) => !isInTrolley(i));

  const trolleyCount = Object.values(trolley).reduce((sum, qty) => sum + qty, 0);

  const total = visibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = visibleItems.reduce((sum, item) => sum + item.quantity, 0);
  const qsAllInTrolley =
    quickShopItems.length > 0 &&
    quickShopItems.filter((i) => i.quantity > 0).every((i) => isInTrolley(i));

  const addToTrolley = () => {
    const itemsToAdd = visibleItems.filter((i) => i.quantity > 0);
    if (itemsToAdd.length === 0) return;

    setTrolley((prev) => {
      const next = { ...prev };
      itemsToAdd.forEach((item) => {
        next[String(item.id)] = item.quantity;
      });
      return next;
    });

    setCtaState("success");
    clearTimeout(ctaTimerRef.current);
    ctaTimerRef.current = setTimeout(() => setCtaState("idle"), 2500);
  };

  const addSingleToTrolley = (id) => {
    if (id === undefined || id === null) return;
    setItems((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, quantity: Math.max(p.quantity, 1) } : p))
    );
    setTrolley((prev) => ({ ...prev, [String(id)]: Math.max(prev[String(id)] || 0, 1) }));
  };

  const addCsmToTrolleyFromCard = (item) => {
    if (!item || item.id === undefined || item.id === null) return;
    const key = String(item.id);
    setTrolley((prevTrolley) => {
      const nextQty = (prevTrolley[key] || 0) + 1;
      setItems((prevItems) =>
        prevItems.map((p) =>
          String(p.id) === key ? { ...p, quantity: nextQty } : p
        )
      );
      return { ...prevTrolley, [key]: nextQty };
    });
  };

  const updateBelowQty = (id, next) => {
    const newQty = Math.max(0, next);
    const key = String(id);
    setItems((prev) =>
      prev.map((p) => (String(p.id) === key ? { ...p, quantity: newQty } : p))
    );
    if (newQty === 0) {
      setTrolley((prev) => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    } else {
      setTrolley((prev) => ({ ...prev, [key]: newQty }));
    }
  };

  const DELIVERY_FEE = 0;
  const MIN_SPEND = 40;

  const trolleyItems = Object.entries(trolley)
    .map(([id, qty]) => {
      const item = items.find((i) => String(i.id) === String(id));
      return item ? { ...item, quantity: qty } : null;
    })
    .filter(Boolean);

  const trolleySubtotal = trolleyItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const trolleyItemCount = trolleyItems.reduce((sum, i) => sum + i.quantity, 0);
  const belowMinSpend = trolleySubtotal < MIN_SPEND;
  const amountToMinSpend = Math.max(0, MIN_SPEND - trolleySubtotal);

  const updateTrolleyQty = (id, newQty) => {
    const key = String(id);
    const qty = Math.max(0, newQty);
    if (qty === 0) {
      setTrolley((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setTrolley((prev) => ({ ...prev, [key]: qty }));
    }
  };

  const removeTrolleyItem = (id) => {
    const key = String(id);
    setTrolley((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const clearTrolley = () => setTrolley({});

  useEffect(() => {
    return () => clearTimeout(ctaTimerRef.current);
  }, []);

  useEffect(() => {
    if (!snackbar) return;
    // On step 2 (Food & Drink) keep snackbar visible; elsewhere auto-dismiss after 3s
    if (page === "fooddrink") return;
    const timer = setTimeout(() => setSnackbar(""), 3000);
    return () => clearTimeout(timer);
  }, [snackbar, page]);

  const navigateToItem = (id) => {
    setScrollToId(id);
    setView("list");
    setPage("quickshop");
    window.scrollTo(0, 0);
  };

  const toggleGroupExpanded = (groupKey) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const navigateToGridView = () => {
    setView("grid");
    setPage("quickshop");
    window.scrollTo(0, 0);
  };

  const navigateJourneyStep = (stepNumber) => {
    if (stepNumber === 1) {
      setPage("quickshop");
    } else if (stepNumber === 2) {
      setPage("fooddrink");
    } else if (stepNumber === 3) {
      setPage("household");
    } else if (stepNumber === 4) {
      setPage("inspiration");
    }
    window.scrollTo(0, 0);
  };

  const handleGridItemTap = (id) => {
    setScrollToId(id);
    setView("list");
  };

  useEffect(() => {
    if (page !== "quickshop" || view !== "list" || scrollToId == null) return;
    clearTimeout(scrollAttemptRef.current);
    scrollAttemptRef.current = setTimeout(() => {
      const el = document.getElementById(`product-${scrollToId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setScrollToId(null);
      }
    }, 80);
    return () => clearTimeout(scrollAttemptRef.current);
  }, [page, view, scrollToId]);

  const tabs = ["Favourites", "Previous orders", "Quick Shop"];

  const handleTabClick = (label) => {
    if (label === "Favourites") {
      setPage("favourites");
      window.scrollTo(0, 0);
    } else if (label === "Quick Shop") {
      setPage("quickshop");
      window.scrollTo(0, 0);
    }
  };

  return (
    <div
      style={{
        fontFamily: "'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif",
        backgroundColor: "#fff",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          maxWidth: 767,
          margin: "0 auto",
          backgroundColor: "#fff",
          position: "relative",
          paddingBottom: 80,
        }}
      >
        {/* ── Sticky brand bar ── */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            backgroundColor: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 16px",
              height: 50,
              borderBottom: `1px solid ${oysterGrey}`,
            }}
          >
            <div
              onClick={() => {
                // Reset prototype back to beginning (Groceries)
                setPage("groceries");
                setView("grid");
                setCheckoutStep("trolley");
                setOffersOnlyFood(false);
                setOffersOnlyHousehold(false);
                setScrollToId(null);
                setSnackbar("");
                setCtaState("idle");
                setExpandedGroups({});
                setTrolley({});
                window.scrollTo(0, 0);
              }}
              style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: squidInk,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  lineHeight: "18px",
                }}
              >
                Waitrose
              </span>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 500,
                  color: squidInk,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  lineHeight: "12px",
                }}
              >
                & Partners
              </span>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
              {[
                { icon: "🔍", label: "Search" },
                { icon: "📅", label: "Book a slot" },
                { icon: "🛒", label: `£${trolleySubtotal.toFixed(2)}`, badge: trolleyCount, action: "trolley" },
                { icon: "☰", label: "Menu" },
              ].map((navItem) => (
                <div
                  key={navItem.icon + navItem.label}
                  onClick={() => {
                    if (navItem.action === "trolley") {
                      setPage("trolley");
                      setCheckoutStep("trolley");
                      window.scrollTo(0, 0);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: navItem.action ? "pointer" : "default",
                    position: "relative",
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: "16px" }}>
                    {navItem.icon}
                  </span>
                  {navItem.badge > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -4,
                        minWidth: 16,
                        height: 16,
                        borderRadius: 8,
                        backgroundColor: green,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                        lineHeight: 1,
                      }}
                    >
                      {navItem.badge}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: squidInk,
                      lineHeight: "20px",
                    }}
                  >
                    {navItem.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab bar (not shown on Groceries entry page) ── */}
        {page !== "groceries" && (
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              backgroundColor: "#fff",
            }}
          >
            <div style={{ display: "flex", overflowX: "auto" }}>
              {tabs.map((label) => {
                const isQsPage = page === "quickshop" || page === "fooddrink" || page === "household";
                const active =
                  (label === "Favourites" && page === "favourites") ||
                  (label === "Quick Shop" && isQsPage);
                return (
                  <div
                    key={label}
                    onClick={() => handleTabClick(label)}
                    style={{
                      flex: "0 0 auto",
                      height: 52,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 20px",
                      whiteSpace: "nowrap",
                      fontSize: 16,
                      fontWeight: 500,
                      color: squidInk,
                      borderBottom: active
                        ? `2px solid ${squidInk}`
                        : `2px solid ${oysterGrey}`,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 48,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingRight: 16,
                background:
                  "linear-gradient(to right, rgba(255,255,255,0), #fff 60%)",
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: 12, color: squidInk }}>›</span>
            </div>
          </div>
        )}

        {/* ── Journey progress indicator (not on Groceries or Favourites) ── */}
        {page !== "favourites" && page !== "groceries" && currentJourneyStep > 0 && (
          <div
            style={{
              padding: "8px 16px 4px",
              backgroundColor: "#fff",
              borderBottom: `1px solid ${oysterGrey}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {[
                { label: "Top regulars" },
                { label: "Food & drink" },
                { label: "Household" },
                { label: "Inspiration & ideas" },
              ].map((step, index) => {
                const stepNumber = index + 1;
                const isComplete = stepNumber < currentJourneyStep;
                const isCurrent = stepNumber === currentJourneyStep;

                return (
                  <React.Fragment key={step.label}>
                    {index > 0 && (
                      <div
                        style={{
                          flex: 1,
                          height: 2,
                          backgroundColor: stepNumber <= currentJourneyStep ? green : oysterGrey,
                          margin: "0 4px",
                        }}
                      />
                    )}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        onClick={() => navigateJourneyStep(stepNumber)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: isComplete
                            ? successGreen
                            : isCurrent
                            ? squidInk
                            : "#fff",
                          border: `2px solid ${
                            isComplete ? successGreen : isCurrent ? squidInk : oysterGrey
                          }`,
                          color: isComplete || isCurrent ? "#fff" : squidInk,
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        {isComplete ? (
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M3 8.5L6.5 12L13 4"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          stepNumber
                        )}
                      </div>
                      <span
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          color: stepNumber <= currentJourneyStep ? squidInk : waitroseGrey,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════ GROCERIES PAGE (ENTRY) ═══════════════ */}
        {page === "groceries" && (
          <>
            {/* Promo strip */}
            <div
              style={{
                backgroundColor: green,
                color: "#fff",
                padding: "8px 16px",
                fontSize: 14,
                lineHeight: "20px",
                textAlign: "center",
              }}
            >
              3 for £12 BBQ mix &amp; match{" "}
              <span style={{ textDecoration: "underline", fontWeight: 500 }}>
                Shop now
              </span>
            </div>

            {/* Title section */}
            <div
              style={{
                padding: "24px 16px 20px",
                textAlign: "center",
                backgroundColor: "#fff",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: squidInk,
                }}
              >
                Shop for your groceries online
              </h1>
              <div
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: squidInk,
                  margin: "16px auto",
                }}
              />

              {/* Icon grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  rowGap: 24,
                  columnGap: 8,
                  marginTop: 24,
                }}
              >
                {[
                  { label: "Book a slot", icon: "📅" },
                  { label: "My orders", icon: "📄" },
                  { label: "Favourites", icon: "♥" },
                  { label: "Recipes", icon: "👨‍🍳" },
                  { label: "Offers", icon: "£" },
                  { label: "My Waitrose", icon: "💳" },
                ].map((item) => {
                  const isFavouritesIcon = item.label === "Favourites";
                  return (
                    <div
                      key={item.label}
                      onClick={
                        isFavouritesIcon
                          ? () => {
                              setPage("favourites");
                              window.scrollTo(0, 0);
                            }
                          : undefined
                      }
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        cursor: isFavouritesIcon ? "pointer" : "default",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          border: `1px solid ${oysterGrey}`,
                          backgroundColor: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 20,
                        }}
                      >
                        <span>{item.icon}</span>
                      </div>
                      <span
                        style={{
                          fontSize: 14,
                          color: squidInk,
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Quick Shop card ── */}
            <div style={{ padding: "16px 16px 24px", backgroundColor: "#fff" }}>
              {!qsAllInTrolley ? (
                <div
                  style={{
                    border: `1px solid ${oysterGrey}`,
                    backgroundColor: "#fff",
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "baseline",
                    fontSize: 16,
                    fontWeight: 500,
                    color: squidInk,
                    lineHeight: "24px",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    Quick Shop your regulars
                  </span>
                  <span
                    onClick={navigateToGridView}
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    View more
                  </span>
                </div>

                {/* Carousel */}
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <div
                    ref={carouselRef}
                    onScroll={updateCarouselArrows}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      overflowX: "auto",
                      scrollSnapType: "x mandatory",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {quickShopItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateToItem(item.id)}
                        style={{
                          flex: "0 0 auto",
                          width: 80,
                          height: 80,
                          position: "relative",
                          border: "none",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                          padding: 16,
                          scrollSnapAlign: "start",
                          overflow: "visible",
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                        {item.quantity > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: 20,
                              height: 20,
                              borderRadius: 32,
                              backgroundColor: green,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: "20px",
                              letterSpacing: "2.8px",
                              textTransform: "uppercase",
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {carouselCanScrollLeft && (
                    <div
                      onClick={() => {
                        if (carouselRef.current) {
                          carouselRef.current.scrollBy({ left: -200, behavior: "smooth" });
                        }
                      }}
                      style={{
                        position: "absolute",
                        left: 0, top: 0, bottom: 0,
                        paddingRight: 48, paddingLeft: 16,
                        display: "flex", alignItems: "center",
                        background: "linear-gradient(to left, rgba(255,255,255,0), #fff 27%)",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M7.5 2L3.5 6L7.5 10" stroke={squidInk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  {carouselCanScrollRight && (
                    <div
                      onClick={() => {
                        if (carouselRef.current) {
                          carouselRef.current.scrollBy({ left: 200, behavior: "smooth" });
                        }
                      }}
                      style={{
                        position: "absolute",
                        right: 0, top: 0, bottom: 0,
                        paddingLeft: 48, paddingRight: 16,
                        display: "flex", alignItems: "center",
                        background: "linear-gradient(to right, rgba(255,255,255,0), #fff 27%)",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M4.5 2L8.5 6L4.5 10" stroke={squidInk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Scrollbar track */}
                <div style={{ width: "100%", height: 8, backgroundColor: oysterGrey }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(Math.min((count / Math.max(quickShopItems.length, 1)) * 100, 100), 25)}%`,
                      backgroundColor: waitroseGrey,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* CTA button */}
                <button
                  type="button"
                  onClick={() => {
                    if (qsAllInTrolley && ctaState === "idle") {
                      setPage("fooddrink");
                      window.scrollTo(0, 0);
                    } else {
                      const addedCount = count;
                      addToTrolley();
                      if (addedCount > 0) {
                        setSnackbar(
                          `${addedCount} item${addedCount === 1 ? "" : "s"} added to trolley`
                        );
                      }
                      setTimeout(() => {
                        setPage("fooddrink");
                        window.scrollTo(0, 0);
                      }, 1200);
                    }
                  }}
                  style={{
                    width: "100%",
                    height: 40,
                    border: "none",
                    backgroundColor:
                      ctaState === "success" ? successGreen : waitroseGrey,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: "24px",
                    cursor: ctaState === "success" ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background-color 0.3s ease",
                  }}
                >
                  {ctaState === "success" ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M4 10.5L8 14.5L16 6.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Added to trolley
                    </>
                  ) : qsAllInTrolley ? (
                    "Continue to Top regulars"
                  ) : (
                    `Add ${count} items to trolley and continue`
                  )}
                </button>
                </div>
              ) : (
                <div
                  style={{
                    border: `1px solid ${oysterGrey}`,
                    backgroundColor: "#fff",
                    textAlign: "center",
                    padding: "40px 16px",
                    color: waitroseGrey,
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{ marginBottom: 16 }}
                  >
                    <path
                      d="M4 10.5L8 14.5L16 6.5"
                      stroke={green}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      color: squidInk,
                      marginBottom: 8,
                    }}
                  >
                    All top regulars are already in your trolley
                  </div>
                </div>
              )}
            </div>

            {/* Last order summary */}
            <div style={{ padding: "0 16px 24px", backgroundColor: "#fff" }}>
              <div
                style={{
                  border: `1px solid ${oysterGrey}`,
                  backgroundColor: "#fafafa",
                  padding: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: successGreen,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5L6.5 12L13 4"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: squidInk,
                        lineHeight: "20px",
                      }}
                    >
                      Your last order
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        color: waitroseGrey,
                        lineHeight: "20px",
                      }}
                    >
                      Saturday 13 December
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: squidInk,
                  }}
                >
                  £63.60
                </span>
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontSize: 14,
                  color: squidInk,
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                View all previous orders
              </div>
            </div>

            {/* Mother's Day banners */}
            <div
              style={{
                padding: "0 16px 32px",
                backgroundColor: "#ffffff",
              }}
            >
              {/* Hero banner */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 12,
                  backgroundColor: "#ffccbf",
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 500,
                      color: "#c4401e",
                      lineHeight: "26px",
                      marginBottom: 8,
                    }}
                  >
                    Say it with... a roast
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: squidInk,
                      lineHeight: "20px",
                      marginBottom: 8,
                    }}
                  >
                    Save on British beef and sides for Mother's Day.
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#c4401e",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Shop offer
                  </div>
                </div>
                <div
                  style={{
                    width: 120,
                    height: 100,
                    overflow: "hidden",
                    borderRadius: 4,
                  }}
                >
                  <img
                    src={mdHeroRoast}
                    alt="Mother's Day roast"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              {/* 2x2 banner grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {/* All Mother's Day */}
                <div
                  style={{
                    backgroundColor: "#ffccbf",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 80,
                      marginBottom: 10,
                      overflow: "hidden",
                      borderRadius: 4,
                    }}
                  >
                    <img
                      src={mdAllMothersDay}
                      alt="All Mother's Day"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#c4401e",
                      marginBottom: 4,
                    }}
                  >
                    All Mother's Day
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#c4401e",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Shop now
                  </div>
                </div>

                {/* Offers Mother's Day */}
                <div
                  style={{
                    backgroundColor: "#ffccbf",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 80,
                      marginBottom: 10,
                      overflow: "hidden",
                      borderRadius: 4,
                    }}
                  >
                    <img
                      src={mdOffersMothersDay}
                      alt="Offers for Mother's Day"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#c4401e",
                      marginBottom: 4,
                    }}
                  >
                    Offers<br />Mother's Day
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#c4401e",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Shop now
                  </div>
                </div>

                {/* Health & beauty */}
                <div
                  style={{
                    backgroundColor: "#ffccbf",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 80,
                      marginBottom: 10,
                      overflow: "hidden",
                      borderRadius: 4,
                    }}
                  >
                    <img
                      src={mdHealthBeauty}
                      alt="Health and beauty gifts"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: squidInk,
                      marginBottom: 2,
                    }}
                  >
                    Up to half price
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#c4401e",
                      marginBottom: 4,
                    }}
                  >
                    Health &amp; beauty
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#c4401e",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    Shop now
                  </div>
                </div>

                {/* Mother's Day goodies */}
                <div
                  style={{
                    backgroundColor: "#ffccbf",
                    padding: 12,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 80,
                      marginBottom: 10,
                      overflow: "hidden",
                      borderRadius: 4,
                    }}
                  >
                    <img
                      src={mdGoodies}
                      alt="Mother's Day goodies"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      color: "#c4401e",
                      marginBottom: 4,
                    }}
                  >
                    Mother's Day goodies
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#c4401e",
                      textDecoration: "underline",
                      cursor: "pointer",
                    }}
                  >
                    See recipes
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════ FAVOURITES PAGE ═══════════════ */}
        {page === "favourites" && (
          <>
            {/* Title section */}
            <div
              style={{
                padding: "24px 16px 28px",
                textAlign: "center",
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <svg width="24" height="22" viewBox="0 0 24 22" fill="none">
                  <path
                    d="M12 21.07L10.58 19.78C4.4 14.07 0 10.01 0 5.31C0 1.42 3.08 -0.58 6 0.81C7.88 1.72 9.34 3.38 10.58 5.1L12 7L13.42 5.1C14.66 3.38 16.12 1.72 18 0.81C20.92 -0.58 24 1.42 24 5.31C24 10.01 19.6 14.07 13.42 19.78L12 21.07Z"
                    fill={green}
                  />
                </svg>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 500,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: squidInk,
                  }}
                >
                  Favourites
                </h1>
              </div>
              <div
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: squidInk,
                  margin: "16px auto",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 400,
                  color: squidInk,
                  lineHeight: "24px",
                }}
              >
                Everything you buy is added to your Favourites.
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 400,
                  color: squidInk,
                  lineHeight: "24px",
                }}
              >
                Add or remove items by selecting the heart icon
              </p>
            </div>

            {/* ── Quick Shop card ── */}
            <div style={{ padding: "0 16px 24px" }}>
              <div
                style={{
                  border: `1px solid ${oysterGrey}`,
                  backgroundColor: "#fff",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "baseline",
                    fontSize: 16,
                    fontWeight: 500,
                    color: squidInk,
                    lineHeight: "24px",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    Quick Shop your regulars
                  </span>
                  <span
                    onClick={navigateToGridView}
                    style={{
                      textDecoration: "underline",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                    }}
                  >
                    View more
                  </span>
                </div>

                {/* Carousel */}
                <div style={{ position: "relative", overflow: "hidden" }}>
                  <div
                    ref={carouselRef}
                    onScroll={updateCarouselArrows}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      overflowX: "auto",
                      scrollSnapType: "x mandatory",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {quickShopItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => navigateToItem(item.id)}
                        style={{
                          flex: "0 0 auto",
                          width: 80,
                          height: 80,
                          position: "relative",
                          border: "none",
                          backgroundColor: "#fff",
                          cursor: "pointer",
                          padding: 16,
                          scrollSnapAlign: "start",
                          overflow: "visible",
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                        />
                        {item.quantity > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: 20,
                              height: 20,
                              borderRadius: 32,
                              backgroundColor: green,
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 500,
                              lineHeight: "20px",
                              letterSpacing: "2.8px",
                              textTransform: "uppercase",
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {carouselCanScrollLeft && (
                    <div
                      onClick={() => {
                        if (carouselRef.current) {
                          carouselRef.current.scrollBy({ left: -200, behavior: "smooth" });
                        }
                      }}
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        paddingRight: 48,
                        paddingLeft: 16,
                        display: "flex",
                        alignItems: "center",
                        background:
                          "linear-gradient(to left, rgba(255,255,255,0), #fff 27%)",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M7.5 2L3.5 6L7.5 10"
                          stroke={squidInk}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                  {carouselCanScrollRight && (
                    <div
                      onClick={() => {
                        if (carouselRef.current) {
                          carouselRef.current.scrollBy({ left: 200, behavior: "smooth" });
                        }
                      }}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        paddingLeft: 48,
                        paddingRight: 16,
                        display: "flex",
                        alignItems: "center",
                        background:
                          "linear-gradient(to right, rgba(255,255,255,0), #fff 27%)",
                        cursor: "pointer",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M4.5 2L8.5 6L4.5 10"
                          stroke={squidInk}
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Scrollbar track */}
                <div style={{ width: "100%", height: 8, backgroundColor: oysterGrey }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(
                        Math.min((count / Math.max(quickShopItems.length, 1)) * 100, 100),
                        25
                      )}%`,
                      backgroundColor: waitroseGrey,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                {/* CTA button */}
                <button
                  type="button"
                  onClick={() => {
                    if (qsAllInTrolley && ctaState === "idle") {
                      setPage("fooddrink");
                      window.scrollTo(0, 0);
                    } else {
                      const addedCount = count;
                      addToTrolley();
                      if (addedCount > 0) {
                        setSnackbar(
                          `${addedCount} item${addedCount === 1 ? "" : "s"} added to trolley`
                        );
                      }
                      setTimeout(() => {
                        setPage("fooddrink");
                        window.scrollTo(0, 0);
                      }, 1200);
                    }
                  }}
                  style={{
                    width: "100%",
                    height: 40,
                    border: "none",
                    backgroundColor:
                      ctaState === "success" ? successGreen : waitroseGrey,
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 400,
                    lineHeight: "24px",
                    cursor: ctaState === "success" ? "default" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    transition: "background-color 0.3s ease",
                  }}
                >
                  {ctaState === "success" ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M4 10.5L8 14.5L16 6.5"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Added to trolley
                    </>
                  ) : qsAllInTrolley ? (
                    "Continue to Food & drink"
                  ) : (
                    `Add ${count} items to trolley and continue`
                  )}
                </button>
              </div>
            </div>

            {/* ── ALL FAVOURITES section ── */}
            <div
              style={{
                borderTop: `1px solid ${oysterGrey}`,
                padding: "24px 16px 0",
              }}
            >
              <h2
                style={{
                  margin: "0 0 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: squidInk,
                }}
              >
                All favourites
              </h2>

              {/* Filter button */}
              <button
                type="button"
                style={{
                  width: "100%",
                  height: 48,
                  border: `1px solid ${oysterGrey}`,
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 16,
                  fontWeight: 500,
                  color: squidInk,
                  cursor: "pointer",
                  marginBottom: 16,
                }}
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M0 1h18M3 7h12M6 13h6" stroke={squidInk} strokeWidth="1.5" />
                </svg>
                Filter
              </button>

              {/* Sort chips */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 24,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: squidInk,
                    whiteSpace: "nowrap",
                  }}
                >
                  Sort by
                </span>
                <button
                  type="button"
                  style={{
                    height: 32,
                    padding: "0 16px",
                    borderRadius: 16,
                    border: `1px solid ${green}`,
                    backgroundColor: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    color: squidInk,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Category
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" stroke={green} />
                    <circle cx="7" cy="7" r="4" fill={green} />
                  </svg>
                </button>
                <button
                  type="button"
                  style={{
                    height: 32,
                    padding: "0 16px",
                    borderRadius: 16,
                    border: `1px solid ${oysterGrey}`,
                    backgroundColor: "#fff",
                    fontSize: 14,
                    fontWeight: 500,
                    color: squidInk,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Frequently bought
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="6.5" stroke={oysterGrey} />
                  </svg>
                </button>
              </div>

              {/* Category grouped products */}
              {Object.entries(
                items.reduce((acc, item) => {
                  const cat = item.category || "Other";
                  if (!acc[cat]) acc[cat] = [];
                  acc[cat].push(item);
                  return acc;
                }, {})
              ).map(([category, catItems]) => (
                <div key={category} style={{ marginBottom: 24 }}>
                  <h3
                    style={{
                      margin: "0 0 12px",
                      fontSize: 20,
                      fontWeight: 500,
                      color: squidInk,
                      lineHeight: "28px",
                    }}
                  >
                    {category}
                  </h3>
                  <div className="qs-fav-cards" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {catItems.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        border: `1px solid ${oysterGrey}`,
                        backgroundColor: "#fff",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          padding: 16,
                        }}
                      >
                        {/* Left column: image + price */}
                        <div
                          style={{
                            width: 85,
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            alignSelf: "stretch",
                          }}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: 85,
                              height: 85,
                              objectFit: "contain",
                              pointerEvents: "none",
                            }}
                          />
                          <div style={{ height: 12 }} />
                          <div>
                            <div
                              style={{
                                fontSize: 20,
                                fontWeight: 500,
                                color: squidInk,
                                lineHeight: "28px",
                              }}
                            >
                              £{item.price.toFixed(2)}
                            </div>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 300,
                                color: squidInk,
                                lineHeight: "24px",
                              }}
                            >
                              {item.ppu || item.weight}
                            </div>
                          </div>
                        </div>

                        {/* Right column: title, weight, rating, Add */}
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            alignSelf: "stretch",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <div style={{ paddingRight: 20 }}>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 500,
                                  color: squidInk,
                                  lineHeight: "24px",
                                  height: 72,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 300,
                                  color: squidInk,
                                  lineHeight: "24px",
                                }}
                              >
                                {item.weight}
                              </div>
                            </div>
                          </div>

                          {/* Add button */}
                          <div style={{ paddingTop: 12 }}>
                            <button
                              type="button"
                              onClick={() =>
                                updateQty(
                                  item.id,
                                  item.quantity === 0 ? 1 : item.quantity + 1
                                )
                              }
                              style={{
                                width: "100%",
                                height: 40,
                                border: `1px solid ${squidInk}`,
                                backgroundColor: "#fff",
                                fontSize: 16,
                                fontWeight: 500,
                                color: squidInk,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Heart icon */}
                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 40,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <svg
                          width="20"
                          height="18"
                          viewBox="0 0 20 18"
                          fill="none"
                        >
                          <path
                            d="M10 17.07L8.58 15.78C3.4 11.07 0 8.01 0 4.31C0 1.25 2.42 -0.09 5 0.81C6.54 1.34 7.67 2.38 8.58 3.6L10 5.5L11.42 3.6C12.33 2.38 13.46 1.34 15 0.81C17.58 -0.09 20 1.25 20 4.31C20 8.01 16.6 11.07 11.42 15.78L10 17.07Z"
                            stroke={squidInk}
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ═══════════════ QUICK SHOP PAGE ═══════════════ */}
        {page === "quickshop" && (
          <>
            {/* Title section */}
            <div
              style={{
                padding: "20px 16px 24px",
                textAlign: "center",
                backgroundColor: "#fff",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: squidInk,
                }}
              >
                Top regulars
              </h1>
              <div
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: squidInk,
                  margin: "16px auto",
                }}
              />
              <p
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 400,
                  color: squidInk,
                  lineHeight: "24px",
                }}
              >
                Add all your regular items with one tap
              </p>
            </div>

            {loading && (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: squidInk,
                  fontSize: 14,
                }}
              >
                Loading products…
              </div>
            )}

            {/* Sticky estimated total bar + CTA + view toggle */}
            <div
              style={{
                position: "sticky",
                top: 50,
                zIndex: 19,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "12px 16px",
                borderTop: `1px solid ${oysterGrey}`,
                borderBottom: `1px solid ${oysterGrey}`,
                backgroundColor: "#fff",
                fontSize: 16,
                color: squidInk,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontWeight: 500 }}>
                  Estimated total: £{total.toFixed(2)} ({count})
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    aria-label="Grid view"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      opacity: view === "grid" ? 1 : 0.35,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="8" height="8" rx="1" fill={squidInk} />
                      <rect x="13" y="3" width="8" height="8" rx="1" fill={squidInk} />
                      <rect x="3" y="13" width="8" height="8" rx="1" fill={squidInk} />
                      <rect x="13" y="13" width="8" height="8" rx="1" fill={squidInk} />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    aria-label="List view"
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      opacity: view === "list" ? 1 : 0.35,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="2.5" rx="0.5" fill={squidInk} />
                      <rect x="3" y="10.75" width="18" height="2.5" rx="0.5" fill={squidInk} />
                      <rect x="3" y="17.5" width="18" height="2.5" rx="0.5" fill={squidInk} />
                    </svg>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (qsAllInTrolley && ctaState === "idle") {
                    setPage("fooddrink");
                    window.scrollTo(0, 0);
                  } else {
                    addToTrolley();
                    setTimeout(() => {
                      setPage("fooddrink");
                      window.scrollTo(0, 0);
                    }, 1200);
                  }
                }}
                style={{
                  width: "100%",
                  height: 48,
                  border: "none",
                  backgroundColor:
                    ctaState === "success" ? successGreen : waitroseGrey,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  cursor: ctaState === "success" ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background-color 0.3s ease",
                }}
              >
                {ctaState === "success" ? (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M4 10.5L8 14.5L16 6.5"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Added to trolley
                  </>
                ) : qsAllInTrolley ? (
                  "Continue to Food & drink"
                ) : (
                  `Add ${count} ${isNarrowMobile ? "" : "selected "}items to trolley & continue`
                )}
              </button>
            </div>

            {/* Product feed */}
            <div style={{ padding: "16px" }}>
              {visibleItems.length === 0 && !loading ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "48px 16px",
                    color: waitroseGrey,
                  }}
                >
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 20 20"
                    fill="none"
                    style={{ marginBottom: 16 }}
                  >
                    <path
                      d="M4 10.5L8 14.5L16 6.5"
                      stroke={green}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 500,
                      color: squidInk,
                      marginBottom: 8,
                    }}
                  >
                    All top regulars are already in your trolley
                  </div>
                </div>
              ) : view === "grid" ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                    justifyItems: "center",
                    rowGap: 20,
                    columnGap: 12,
                  }}
                >
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleGridItemTap(item.id)}
                      style={{
                        position: "relative",
                        width: 80,
                        height: 80,
                        padding: 0,
                        border: "none",
                        borderRadius: 0,
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        overflow: "visible",
                      }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: item.quantity > 0 ? green : "#ccc",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {item.quantity}
                      </span>
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "#fff",
                          borderRadius: 16,
                          padding: "0 4px",
                          fontSize: 11,
                          fontWeight: 500,
                          color: squidInk,
                          lineHeight: "20px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.weight}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="qs-list-cards" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {visibleItems.map((item) => (
                    <div
                      key={item.id}
                      id={`product-${item.id}`}
                      style={{
                        border: `1px solid ${oysterGrey}`,
                        backgroundColor: "#fff",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 16,
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 85,
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            alignSelf: "stretch",
                            position: "relative",
                          }}
                        >
                          {item.offers && (
                            <div style={{
                              position: "absolute", top: 0, left: 0, zIndex: 1,
                              backgroundColor: "#c00", color: "#fff",
                              fontSize: 12, fontWeight: 600, lineHeight: "20px",
                              padding: "0 8px", borderRadius: 2,
                            }}>
                              Offer
                            </div>
                          )}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: 85,
                                height: 85,
                                objectFit: "contain",
                                pointerEvents: "none",
                              }}
                            />
                          </div>
                          <div style={{ height: 12 }} />
                          <div>
                            <div
                              style={{
                                fontSize: 20,
                                fontWeight: 500,
                                color: squidInk,
                                lineHeight: "28px",
                              }}
                            >
                              £{item.price.toFixed(2)}
                            </div>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 300,
                                color: squidInk,
                                lineHeight: "24px",
                              }}
                            >
                              {item.ppu || item.weight}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            alignSelf: "stretch",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                            }}
                          >
                            <div style={{ paddingRight: 20 }}>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 500,
                                  color: squidInk,
                                  lineHeight: "24px",
                                  height: 48,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {item.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 300,
                                  color: squidInk,
                                  lineHeight: "24px",
                                }}
                              >
                                Typical weight {item.weight}
                              </div>
                            </div>
                            {item.offers && (
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 500,
                                  color: "#a6192e",
                                  lineHeight: "24px",
                                  textDecoration: "underline",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  height: 24,
                                }}
                              >
                                {item.offers}
                              </div>
                            )}
                          </div>

                          <div style={{ paddingTop: 12 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "stretch",
                                width: "100%",
                              }}
                            >
                              <div
                                style={{
                                  flex: 1,
                                  height: 40,
                                  border: `1px solid ${squidInk}`,
                                  borderRight: "none",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 16,
                                  fontWeight: 500,
                                  color: squidInk,
                                }}
                              >
                                {item.quantity}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQty(item.id, item.quantity - 1)
                                }
                                style={{
                                  width: 40,
                                  height: 40,
                                  border: "none",
                                  backgroundColor: squidInk,
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  padding: 0,
                                  flexShrink: 0,
                                }}
                              >
                                <svg
                                  width="16"
                                  height="2"
                                  viewBox="0 0 16 2"
                                  fill="none"
                                >
                                  <rect
                                    width="16"
                                    height="2"
                                    rx="0.5"
                                    fill="white"
                                  />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateQty(item.id, item.quantity + 1)
                                }
                                style={{
                                  width: 40,
                                  height: 40,
                                  border: "none",
                                  borderLeft:
                                    "1px solid rgba(255,255,255,0.2)",
                                  backgroundColor: squidInk,
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  padding: 0,
                                  flexShrink: 0,
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                >
                                  <rect
                                    x="7"
                                    y="0"
                                    width="2"
                                    height="16"
                                    rx="0.5"
                                    fill="white"
                                  />
                                  <rect
                                    x="0"
                                    y="7"
                                    width="16"
                                    height="2"
                                    rx="0.5"
                                    fill="white"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          position: "absolute",
                          top: 2,
                          right: 2,
                          width: 40,
                          height: 40,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                        }}
                      >
                        <svg
                          width="20"
                          height="18"
                          viewBox="0 0 20 18"
                          fill="none"
                        >
                          <path
                            d="M10 17.07L8.58 15.78C3.4 11.07 0 8.01 0 4.31C0 1.25 2.42 -0.09 5 0.81C6.54 1.34 7.67 2.38 8.58 3.6L10 5.5L11.42 3.6C12.33 2.38 13.46 1.34 15 0.81C17.58 -0.09 20 1.25 20 4.31C20 8.01 16.6 11.07 11.42 15.78L10 17.07Z"
                            stroke={squidInk}
                            strokeWidth="1.5"
                            fill="none"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                  <div
                    style={{ borderBottom: `1px solid ${oysterGrey}` }}
                  />
                </div>
              )}
            </div>

          </>
        )}

        {/* ═══════════════ FOOD & DRINK PAGE ═══════════════ */}
        {page === "fooddrink" && (
          <>
            {snackbar && (
              <div
                style={{
                  margin: "8px 16px 0",
                  padding: "8px 12px",
                  borderRadius: 4,
                  backgroundColor: "#f1f8e8",
                  border: `1px solid ${successGreen}`,
                  color: squidInk,
                  fontSize: 14,
                  lineHeight: "20px",
                }}
              >
                {snackbar}
              </div>
            )}
            <div style={{ padding: "24px 16px 0", textAlign: "center", backgroundColor: "#fff" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: squidInk,
                }}
              >
                Food & Drink
              </h1>
              <div style={{ width: 40, height: 2, backgroundColor: squidInk, margin: "16px auto" }} />
            </div>

            <div style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 500, color: squidInk }}>
                  {foodDrinkFiltered.length} items
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                  onClick={() => setOffersOnlyFood((v) => !v)}
                >
                  <span style={{ fontSize: 16, fontWeight: 500, color: squidInk }}>
                    Offers only
                  </span>
                  <div
                    style={{
                      width: 52,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: offersOnlyFood ? green : oysterGrey,
                      position: "relative",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "#fff",
                        position: "absolute",
                        top: 2,
                        left: offersOnlyFood ? 26 : 2,
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="qs-list-cards" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {foodDrinkVisible.map((item) => {
                  const groupKey = item.grouping;
                  const group = groupKey ? foodDrinkGroups[groupKey] : null;

                  if (group && group.primaryId !== item.id) {
                    return null;
                  }

                  const groupedItems = group ? group.items : [item];
                  const type = group ? group.type : "standard";
                  const isExpanded = groupKey ? !!expandedGroups[groupKey] : false;

                  const collapsedVisibleCount = group
                    ? type === "standard"
                      ? groupedItems.length
                      : type === "double"
                        ? 2
                        : 1
                    : 0;
                  const itemsToRender = !group
                    ? [item]
                    : type === "standard"
                      ? groupedItems
                      : isExpanded
                        ? groupedItems
                        : groupedItems.slice(0, collapsedVisibleCount);
                  const totalCount = group ? groupedItems.length : 0;
                  const moreCount = group && type !== "standard" ? Math.max(totalCount - collapsedVisibleCount, 0) : 0;
                  const canToggle = group && type !== "standard" && moreCount > 0;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: "#fff",
                        position: "relative",
                        overflow: "hidden",
                        border: `1px solid ${oysterGrey}`,
                      }}
                    >
                      {itemsToRender.map((it) => {
                        const added = isInTrolley(it);
                        return (
                          <div
                            key={it.id}
                            style={{
                              position: "relative",
                              ...(added
                                ? {
                                    borderTop: `2px solid ${successGreen}`,
                                    borderLeft: `2px solid ${successGreen}`,
                                    borderRight: `2px solid ${successGreen}`,
                                    borderBottom: `4px solid ${successGreen}`,
                                  }
                                : {}),
                            }}
                          >
                            {added && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: -2,
                                  left: -2,
                                  right: -2,
                                  zIndex: 2,
                                  backgroundColor: "#f1f8e8",
                                  borderTop: `2px solid ${successGreen}`,
                                  padding: "7px 12px 7px 14px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: squidInk,
                                    lineHeight: "24px",
                                  }}
                                >
                                  {it.quantity} in trolley
                                </span>
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                gap: 16,
                                padding: "16px",
                                paddingTop: added ? 36 : 16,
                              }}
                            >
                              <div
                                style={{
                                  width: 85,
                                  flexShrink: 0,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  alignSelf: "stretch",
                                  position: "relative",
                                }}
                              >
                                {it.offers && !added && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      zIndex: 1,
                                      backgroundColor: "#c00",
                                      color: "#fff",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      lineHeight: "20px",
                                      padding: "0 8px",
                                      borderRadius: 2,
                                    }}
                                  >
                                    Offer
                                  </div>
                                )}
                                <img
                                  src={it.image}
                                  alt={it.name}
                                  style={{
                                    width: 85,
                                    height: 85,
                                    objectFit: "contain",
                                    pointerEvents: "none",
                                  }}
                                />
                                <div style={{ height: 12 }} />
                                <div>
                                  <div
                                    style={{
                                      fontSize: 20,
                                      fontWeight: 500,
                                      color: squidInk,
                                      lineHeight: "28px",
                                    }}
                                  >
                                    £{it.price.toFixed(2)}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 16,
                                      fontWeight: 300,
                                      color: squidInk,
                                      lineHeight: "24px",
                                    }}
                                  >
                                    {it.ppu || it.weight}
                                  </div>
                                </div>
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  alignSelf: "stretch",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  <div style={{ paddingRight: 20 }}>
                                    <div
                                      style={{
                                        fontSize: 16,
                                        fontWeight: 500,
                                        color: squidInk,
                                        lineHeight: "24px",
                                        height: 48,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                      }}
                                    >
                                      {it.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 16,
                                        fontWeight: 300,
                                        color: squidInk,
                                        lineHeight: "24px",
                                      }}
                                    >
                                      Typical weight {it.weight}
                                    </div>
                                  </div>
                                  {it.offers && (
                                    <div
                                      style={{
                                        fontSize: 16,
                                        fontWeight: 500,
                                        color: "#a6192e",
                                        lineHeight: "24px",
                                        textDecoration: "underline",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        height: 24,
                                      }}
                                    >
                                      {it.offers}
                                    </div>
                                  )}
                                </div>
                                <div style={{ paddingTop: 12 }}>
                                  {added ? (
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        alignItems: "stretch",
                                        width: "100%",
                                      }}
                                    >
                                      <div
                                        style={{
                                          flex: 1,
                                          height: 40,
                                          border: `1px solid ${squidInk}`,
                                          backgroundColor: "#fff",
                                          display: "flex",
                                          alignItems: "center",
                                          padding: "8px 12px",
                                          fontSize: 16,
                                          fontWeight: 500,
                                          color: squidInk,
                                        }}
                                      >
                                        {it.quantity}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateBelowQty(it.id, it.quantity - 1)
                                        }
                                        style={{
                                          height: 40,
                                          border: "none",
                                          backgroundColor: waitroseGrey,
                                          color: "#fff",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          cursor: "pointer",
                                          padding: "7px 20px",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <svg
                                          width="16"
                                          height="2"
                                          viewBox="0 0 16 2"
                                          fill="none"
                                        >
                                          <rect
                                            width="16"
                                            height="2"
                                            rx="0.5"
                                            fill="white"
                                          />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateBelowQty(it.id, it.quantity + 1)
                                        }
                                        style={{
                                          height: 40,
                                          border: "none",
                                          backgroundColor: waitroseGrey,
                                          color: "#fff",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          cursor: "pointer",
                                          padding: "7px 20px",
                                          flexShrink: 0,
                                        }}
                                      >
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                        >
                                          <rect
                                            x="7"
                                            y="0"
                                            width="2"
                                            height="16"
                                            rx="0.5"
                                            fill="white"
                                          />
                                          <rect
                                            x="0"
                                            y="7"
                                            width="16"
                                            height="2"
                                            rx="0.5"
                                            fill="white"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => addSingleToTrolley(it.id)}
                                      style={{
                                        width: "100%",
                                        height: 40,
                                        border: `1px solid ${squidInk}`,
                                        backgroundColor: "#fff",
                                        fontSize: 16,
                                        fontWeight: 500,
                                        color: squidInk,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      Add
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {canToggle && (
                        <button
                          type="button"
                          onClick={() => toggleGroupExpanded(groupKey)}
                          style={{
                            width: "100%",
                            border: "none",
                            backgroundColor: "#fff",
                            borderTop: `1px solid ${oysterGrey}`,
                            padding: "8px 0 8px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontSize: 14,
                            color: squidInk,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          >
                            ▾
                          </span>
                          {isExpanded
                            ? "View less"
                            : `Show ${moreCount} similar item${moreCount === 1 ? "" : "s"}`}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                position: "fixed",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 0,
                width: "100%",
                maxWidth: 767,
                padding: "12px 16px",
                backgroundColor: "#fff",
                borderTop: `1px solid ${oysterGrey}`,
                zIndex: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPage("household");
                  window.scrollTo(0, 0);
                }}
                style={{
                  width: "100%",
                  height: 48,
                  border: "none",
                  backgroundColor: waitroseGrey,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  cursor: "pointer",
                }}
              >
                Continue to Household
              </button>
            </div>
          </>
        )}

        {/* ═══════════════ HOUSEHOLD PAGE ═══════════════ */}
        {page === "household" && (
          <>
            <div style={{ padding: "24px 16px 0", textAlign: "center", backgroundColor: "#fff" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: squidInk,
                }}
              >
                Household
              </h1>
              <div style={{ width: 40, height: 2, backgroundColor: squidInk, margin: "16px auto" }} />
            </div>

            <div style={{ padding: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 500, color: squidInk }}>
                  {householdFiltered.length} items
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                  onClick={() => setOffersOnlyHousehold((v) => !v)}
                >
                  <span style={{ fontSize: 16, fontWeight: 500, color: squidInk }}>
                    Offers only
                  </span>
                  <div
                    style={{
                      width: 52,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: offersOnlyHousehold ? green : oysterGrey,
                      position: "relative",
                      transition: "background-color 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: "#fff",
                        position: "absolute",
                        top: 2,
                        left: offersOnlyHousehold ? 26 : 2,
                        transition: "left 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="qs-list-cards" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {householdVisible.map((item) => {
                  const added = isInTrolley(item);
                  return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#fff",
                      position: "relative",
                      overflow: "hidden",
                      ...(added
                        ? {
                            borderTop: `2px solid ${successGreen}`,
                            borderLeft: `2px solid ${successGreen}`,
                            borderRight: `2px solid ${successGreen}`,
                            borderBottom: `4px solid ${successGreen}`,
                          }
                        : { border: `1px solid ${oysterGrey}` }),
                    }}
                  >
                    {added && (
                      <div style={{
                        position: "absolute", top: -2, left: -2, right: -2, zIndex: 2,
                        backgroundColor: "#f1f8e8",
                        borderTop: `2px solid ${successGreen}`,
                        padding: "7px 12px 7px 14px",
                      }}>
                        <span style={{ fontSize: 16, fontWeight: 500, color: squidInk, lineHeight: "24px" }}>
                          {item.quantity} in trolley
                        </span>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 16, padding: "16px", paddingTop: added ? 36 : 16 }}>
                      <div
                        style={{
                          width: 85, flexShrink: 0,
                          display: "flex", flexDirection: "column",
                          justifyContent: "space-between", alignSelf: "stretch",
                          position: "relative",
                        }}
                      >
                        {item.offers && !added && (
                          <div style={{
                            position: "absolute", top: 0, left: 0, zIndex: 1,
                            backgroundColor: "#c00", color: "#fff",
                            fontSize: 12, fontWeight: 600, lineHeight: "20px",
                            padding: "0 8px", borderRadius: 2,
                          }}>
                            Offer
                          </div>
                        )}
                        <img
                          src={item.image} alt={item.name}
                          style={{ width: 85, height: 85, objectFit: "contain", pointerEvents: "none" }}
                        />
                        <div style={{ height: 12 }} />
                        <div>
                          <div style={{ fontSize: 20, fontWeight: 500, color: squidInk, lineHeight: "28px" }}>
                            £{item.price.toFixed(2)}
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 300, color: squidInk, lineHeight: "24px" }}>
                            {item.ppu || item.weight}
                          </div>
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", alignSelf: "stretch" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <div style={{ paddingRight: 20 }}>
                            <div style={{
                              fontSize: 16, fontWeight: 500, color: squidInk,
                              lineHeight: "24px", height: 48, overflow: "hidden",
                              textOverflow: "ellipsis", display: "-webkit-box",
                              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                            }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 300, color: squidInk, lineHeight: "24px" }}>
                              Typical weight {item.weight}
                            </div>
                          </div>
                          {item.offers && (
                            <div style={{
                              fontSize: 16, fontWeight: 500, color: "#a6192e", lineHeight: "24px",
                              textDecoration: "underline", whiteSpace: "nowrap",
                              overflow: "hidden", textOverflow: "ellipsis", height: 24,
                            }}>
                              {item.offers}
                            </div>
                          )}
                        </div>
                        <div style={{ paddingTop: 12 }}>
                          {added ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "stretch", width: "100%" }}>
                              <div style={{
                                flex: 1, height: 40,
                                border: `1px solid ${squidInk}`,
                                backgroundColor: "#fff",
                                display: "flex", alignItems: "center",
                                padding: "8px 12px",
                                fontSize: 16, fontWeight: 500, color: squidInk,
                              }}>
                                {item.quantity}
                              </div>
                              <button type="button" onClick={() => updateBelowQty(item.id, item.quantity - 1)}
                                style={{
                                  height: 40, border: "none", backgroundColor: waitroseGrey,
                                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                  cursor: "pointer", padding: "7px 20px", flexShrink: 0,
                                }}>
                                <svg width="16" height="2" viewBox="0 0 16 2" fill="none">
                                  <rect width="16" height="2" rx="0.5" fill="white" />
                                </svg>
                              </button>
                              <button type="button" onClick={() => updateBelowQty(item.id, item.quantity + 1)}
                                style={{
                                  height: 40, border: "none", backgroundColor: waitroseGrey,
                                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                  cursor: "pointer", padding: "7px 20px", flexShrink: 0,
                                }}>
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                  <rect x="7" y="0" width="2" height="16" rx="0.5" fill="white" />
                                  <rect x="0" y="7" width="16" height="2" rx="0.5" fill="white" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => addSingleToTrolley(item.id)}
                              style={{
                                width: "100%", height: 40, border: `1px solid ${squidInk}`,
                                backgroundColor: "#fff", fontSize: 16, fontWeight: 500,
                                color: squidInk, cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                position: "fixed",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 0,
                width: "100%",
                maxWidth: 767,
                padding: "12px 16px",
                backgroundColor: "#fff",
                borderTop: `1px solid ${oysterGrey}`,
                zIndex: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPage("inspiration");
                  window.scrollTo(0, 0);
                }}
                style={{
                  width: "100%",
                  height: 48,
                  border: "none",
                  backgroundColor: waitroseGrey,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  cursor: "pointer",
                }}
              >
                Continue to Inspiration & ideas
              </button>
            </div>
          </>
        )}

        {/* ═══════════════ MEALS & IDEAS (STEP 4) ═══════════════ */}
        {page === "inspiration" && (
          <>
            <div
              style={{
                padding: "24px 16px 0",
                textAlign: "center",
                backgroundColor: "#fff",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: squidInk,
                }}
              >
                Inspiration & ideas
              </h1>
              <div
                style={{
                  width: 40,
                  height: 2,
                  backgroundColor: squidInk,
                  margin: "16px auto",
                }}
              />
            </div>

            <div style={{ padding: "16px", backgroundColor: "#fff", paddingBottom: 80 }}>
              {/* Section 1: CSM offers (non alcohol) */}
              <div style={{ marginBottom: 24 }}>
                {csmOffersNonAlcohol.length > 0 && (
                  <>
                <h2
                  style={{
                    margin: "0 0 4px",
                    fontSize: 18,
                    fontWeight: 500,
                    color: "#A6192E",
                  }}
                >
                  Similar items you like on offer
                </h2>
                  <div style={{ position: "relative", marginTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      overflowX: "auto",
                      paddingBottom: 12,
                      scrollSnapType: "x mandatory",
                    }}
                  >
                    {csmOffersNonAlcohol.map((item) => {
                      const key = String(item.id);
                      const qty = trolley[key] || 0;
                      const added = qty > 0;

                      return (
                        <div
                          key={item.id}
                          style={{
                            flex: "0 0 auto",
                            width: 220,
                            backgroundColor: "#fff",
                            padding: 12,
                            scrollSnapAlign: "start",
                            position: "relative",
                            ...(added
                              ? {
                                  borderTop: `2px solid ${successGreen}`,
                                  borderLeft: `2px solid ${successGreen}`,
                                  borderRight: `2px solid ${successGreen}`,
                                  borderBottom: `4px solid ${successGreen}`,
                                }
                              : { border: `1px solid ${oysterGrey}` }),
                          }}
                        >
                          {added && (
                            <div
                              style={{
                                position: "absolute",
                                top: -2,
                                left: -2,
                                right: -2,
                                zIndex: 2,
                                backgroundColor: "#f1f8e8",
                                borderTop: `2px solid ${successGreen}`,
                                padding: "5px 10px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: squidInk,
                                  lineHeight: "20px",
                                }}
                              >
                                {qty} in trolley
                              </span>
                            </div>
                          )}
                          <div style={{ marginTop: added ? 28 : 0 }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                marginBottom: 8,
                              }}
                            >
                              <div style={{ position: "relative" }}>
                                {item.offers && !added && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      zIndex: 1,
                                      backgroundColor: "#c00",
                                      color: "#fff",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      lineHeight: "20px",
                                      padding: "0 8px",
                                      borderRadius: 2,
                                    }}
                                  >
                                    Offer
                                  </div>
                                )}
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{
                                    width: 64,
                                    height: 64,
                                    objectFit: "contain",
                                    flexShrink: 0,
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: squidInk,
                                    lineHeight: "20px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {item.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: waitroseGrey,
                                    lineHeight: "18px",
                                    marginTop: 2,
                                  }}
                                >
                                  {item.weight}
                                </div>
                                {item.offers && (
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 500,
                                      color: "#a6192e",
                                      lineHeight: "18px",
                                      textDecoration: "underline",
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.offers}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 500,
                                  color: squidInk,
                                  lineHeight: "24px",
                                }}
                              >
                                £{item.price.toFixed(2)}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 300,
                                  color: squidInk,
                                  lineHeight: "20px",
                                }}
                              >
                                {item.ppu || item.weight}
                              </div>
                            </div>
                            <div>
                              {added ? (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "stretch",
                                    width: "100%",
                                  }}
                                >
                                  <div
                                    style={{
                                      flex: 1,
                                      height: 40,
                                      border: `1px solid ${squidInk}`,
                                      backgroundColor: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 16,
                                      fontWeight: 500,
                                      color: squidInk,
                                    }}
                                  >
                                    {qty}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBelowQty(item.id, qty - 1)
                                    }
                                    style={{
                                      height: 40,
                                      border: "none",
                                      backgroundColor: waitroseGrey,
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      padding: "7px 16px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="2"
                                      viewBox="0 0 16 2"
                                      fill="none"
                                    >
                                      <rect
                                        width="16"
                                        height="2"
                                        rx="0.5"
                                        fill="white"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBelowQty(item.id, qty + 1)
                                    }
                                    style={{
                                      height: 40,
                                      border: "none",
                                      backgroundColor: waitroseGrey,
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      padding: "7px 16px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 16 16"
                                      fill="none"
                                    >
                                      <rect
                                        x="7"
                                        y="0"
                                        width="2"
                                        height="16"
                                        rx="0.5"
                                        fill="white"
                                      />
                                      <rect
                                        x="0"
                                        y="7"
                                        width="16"
                                        height="2"
                                        rx="0.5"
                                        fill="white"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addCsmToTrolleyFromCard(item)}
                                  style={{
                                    width: "100%",
                                    height: 40,
                                    border: `1px solid ${squidInk}`,
                                    backgroundColor: "#fff",
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: squidInk,
                                    cursor: "pointer",
                                  }}
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </>
                )}
              </div>

              {/* Section 2: Make it super special (events) */}
              {eventItems.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h2
                    style={{
                      margin: "0 0 4px",
                      fontSize: 18,
                      fontWeight: 500,
                      color: squidInk,
                    }}
                  >
                    Make it super special
                  </h2>
                  <div style={{ position: "relative", marginTop: 8 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        overflowX: "auto",
                        paddingBottom: 12,
                        scrollSnapType: "x mandatory",
                      }}
                    >
                      {eventItems.slice(0, 15).map((item) => {
                        const key = String(item.id);
                        const qty = trolley[key] || 0;
                        const added = qty > 0;

                        return (
                          <div
                            key={item.id}
                            style={{
                              flex: "0 0 auto",
                              width: 220,
                              backgroundColor: "#fff",
                              padding: 12,
                              scrollSnapAlign: "start",
                              position: "relative",
                              ...(added
                                ? {
                                    borderTop: `2px solid ${successGreen}`,
                                    borderLeft: `2px solid ${successGreen}`,
                                    borderRight: `2px solid ${successGreen}`,
                                    borderBottom: `4px solid ${successGreen}`,
                                  }
                                : { border: `1px solid ${oysterGrey}` }),
                            }}
                          >
                            {added && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: -2,
                                  left: -2,
                                  right: -2,
                                  zIndex: 2,
                                  backgroundColor: "#f1f8e8",
                                  borderTop: `2px solid ${successGreen}`,
                                  padding: "5px 10px",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: squidInk,
                                    lineHeight: "20px",
                                  }}
                                >
                                  {qty} in trolley
                                </span>
                              </div>
                            )}
                            <div style={{ marginTop: added ? 28 : 0 }}>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  marginBottom: 8,
                                }}
                              >
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{
                                    width: 64,
                                    height: 64,
                                    objectFit: "contain",
                                    flexShrink: 0,
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 500,
                                      color: squidInk,
                                      lineHeight: "20px",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                    }}
                                  >
                                    {item.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: waitroseGrey,
                                      lineHeight: "18px",
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.weight}
                                  </div>
                                  {item.offers && (
                                    <div
                                      style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: "#a6192e",
                                        lineHeight: "18px",
                                        textDecoration: "underline",
                                        marginTop: 2,
                                      }}
                                    >
                                      {item.offers}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ marginBottom: 8 }}>
                                <div
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: squidInk,
                                    lineHeight: "24px",
                                  }}
                                >
                                  £{item.price.toFixed(2)}
                                </div>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 300,
                                    color: squidInk,
                                    lineHeight: "20px",
                                  }}
                                >
                                  {item.ppu || item.weight}
                                </div>
                              </div>
                              <div>
                                {added ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "stretch",
                                      width: "100%",
                                    }}
                                  >
                                    <div
                                      style={{
                                        flex: 1,
                                        height: 40,
                                        border: `1px solid ${squidInk}`,
                                        backgroundColor: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 16,
                                        fontWeight: 500,
                                        color: squidInk,
                                      }}
                                    >
                                      {qty}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateBelowQty(item.id, qty - 1)
                                      }
                                      style={{
                                        height: 40,
                                        border: "none",
                                        backgroundColor: waitroseGrey,
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        padding: "7px 16px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <svg
                                        width="16"
                                        height="2"
                                        viewBox="0 0 16 2"
                                        fill="none"
                                      >
                                        <rect
                                          width="16"
                                          height="2"
                                          rx="0.5"
                                          fill="white"
                                        />
                                      </svg>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateBelowQty(item.id, qty + 1)
                                      }
                                      style={{
                                        height: 40,
                                        border: "none",
                                        backgroundColor: waitroseGrey,
                                        color: "#fff",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        cursor: "pointer",
                                        padding: "7px 16px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                      >
                                        <rect
                                          x="7"
                                          y="0"
                                          width="2"
                                          height="16"
                                          rx="0.5"
                                          fill="white"
                                        />
                                        <rect
                                          x="0"
                                          y="7"
                                          width="16"
                                          height="2"
                                          rx="0.5"
                                          fill="white"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addCsmToTrolleyFromCard(item)
                                    }
                                    style={{
                                      width: "100%",
                                      height: 40,
                                      border: `1px solid ${squidInk}`,
                                      backgroundColor: "#fff",
                                      fontSize: 16,
                                      fontWeight: 500,
                                      color: squidInk,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Section 3: Alcohol-related ideas */}
              <div style={{ marginBottom: 24 }}>
                {csmAlcohol.length > 0 && (
                  <>
                <h2
                  style={{
                    margin: "0 0 4px",
                    fontSize: 18,
                    fontWeight: 500,
                    color: squidInk,
                  }}
                >
                  Time for a top up?
                </h2>
                  <div style={{ position: "relative", marginTop: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      overflowX: "auto",
                      paddingBottom: 12,
                      scrollSnapType: "x mandatory",
                    }}
                  >
                    {csmAlcohol.map((item) => {
                      const key = String(item.id);
                      const qty = trolley[key] || 0;
                      const added = qty > 0;

                      return (
                        <div
                          key={item.id}
                          style={{
                            flex: "0 0 auto",
                            width: 220,
                            backgroundColor: "#fff",
                            padding: 12,
                            scrollSnapAlign: "start",
                            position: "relative",
                            ...(added
                              ? {
                                  borderTop: `2px solid ${successGreen}`,
                                  borderLeft: `2px solid ${successGreen}`,
                                  borderRight: `2px solid ${successGreen}`,
                                  borderBottom: `4px solid ${successGreen}`,
                                }
                              : { border: `1px solid ${oysterGrey}` }),
                          }}
                        >
                          {added && (
                            <div
                              style={{
                                position: "absolute",
                                top: -2,
                                left: -2,
                                right: -2,
                                zIndex: 2,
                                backgroundColor: "#f1f8e8",
                                borderTop: `2px solid ${successGreen}`,
                                padding: "5px 10px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  fontWeight: 500,
                                  color: squidInk,
                                  lineHeight: "20px",
                                }}
                              >
                                {qty} in trolley
                              </span>
                            </div>
                          )}
                          <div style={{ marginTop: added ? 28 : 0 }}>
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                marginBottom: 8,
                              }}
                            >
                              <div style={{ position: "relative" }}>
                                {item.offers && !added && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      zIndex: 1,
                                      backgroundColor: "#c00",
                                      color: "#fff",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      lineHeight: "20px",
                                      padding: "0 8px",
                                      borderRadius: 2,
                                    }}
                                  >
                                    Offer
                                  </div>
                                )}
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  style={{
                                    width: 64,
                                    height: 64,
                                    objectFit: "contain",
                                    flexShrink: 0,
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: squidInk,
                                    lineHeight: "20px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {item.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: waitroseGrey,
                                    lineHeight: "18px",
                                    marginTop: 2,
                                  }}
                                >
                                  {item.weight}
                                </div>
                                {item.offers && (
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 500,
                                      color: "#a6192e",
                                      lineHeight: "18px",
                                      textDecoration: "underline",
                                      marginTop: 2,
                                    }}
                                  >
                                    {item.offers}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                              <div
                                style={{
                                  fontSize: 16,
                                  fontWeight: 500,
                                  color: squidInk,
                                  lineHeight: "24px",
                                }}
                              >
                                £{item.price.toFixed(2)}
                              </div>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 300,
                                  color: squidInk,
                                  lineHeight: "20px",
                                }}
                              >
                                {item.ppu || item.weight}
                              </div>
                            </div>
                            <div>
                              {added ? (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "stretch",
                                    width: "100%",
                                  }}
                                >
                                  <div
                                    style={{
                                      flex: 1,
                                      height: 40,
                                      border: `1px solid ${squidInk}`,
                                      backgroundColor: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 16,
                                      fontWeight: 500,
                                      color: squidInk,
                                    }}
                                  >
                                    {qty}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBelowQty(item.id, qty - 1)
                                    }
                                    style={{
                                      height: 40,
                                      border: "none",
                                      backgroundColor: waitroseGrey,
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      padding: "7px 16px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="2"
                                      viewBox="0 0 16 2"
                                      fill="none"
                                    >
                                      <rect
                                        width="16"
                                        height="2"
                                        rx="0.5"
                                        fill="white"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBelowQty(item.id, qty + 1)
                                    }
                                    style={{
                                      height: 40,
                                      border: "none",
                                      backgroundColor: waitroseGrey,
                                      color: "#fff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      padding: "7px 16px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 16 16"
                                      fill="none"
                                    >
                                      <rect
                                        x="7"
                                        y="0"
                                        width="2"
                                        height="16"
                                        rx="0.5"
                                        fill="white"
                                      />
                                      <rect
                                        x="0"
                                        y="7"
                                        width="16"
                                        height="2"
                                        rx="0.5"
                                        fill="white"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => addCsmToTrolleyFromCard(item)}
                                  style={{
                                    width: "100%",
                                    height: 40,
                                    border: `1px solid ${squidInk}`,
                                    backgroundColor: "#fff",
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: squidInk,
                                    cursor: "pointer",
                                  }}
                                >
                                  Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </>
                )}
              </div>

              {/* Section 3: Other CSM helpers by type (Ready Meals, Herbs and Spices) */}
              <div style={{ marginBottom: 24 }}>
                {["Ready Meals", "Herbs and Spices"].map((rawPt) => {
                    const pt = rawPt;
                    const itemsForType = csmItems.filter(
                      (item) =>
                        (item.productType || "").trim().toLowerCase() ===
                        rawPt.toLowerCase()
                    );
                    if (itemsForType.length === 0) return null;
                    return (
                      <div key={pt} style={{ marginBottom: 24 }}>
                        <h2
                          style={{
                            margin: "0 0 4px",
                            fontSize: 18,
                            fontWeight: 500,
                            color: squidInk,
                          }}
                        >
                          {pt === "Ready Meals"
                            ? "Ready when you're in a hurry"
                            : pt === "Herbs and Spices"
                            ? "Spice it up"
                            : pt}
                        </h2>
                        <div style={{ position: "relative", marginTop: 8 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              overflowX: "auto",
                              paddingBottom: 12,
                              scrollSnapType: "x mandatory",
                            }}
                          >
                            {itemsForType.map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  flex: "0 0 auto",
                                  width: 220,
                                  border: `1px solid ${oysterGrey}`,
                                  backgroundColor: "#fff",
                                  padding: 12,
                                  scrollSnapAlign: "start",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 12,
                                    marginBottom: 8,
                                  }}
                                >
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    style={{
                                      width: 64,
                                      height: 64,
                                      objectFit: "contain",
                                      flexShrink: 0,
                                    }}
                                  />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: squidInk,
                                        lineHeight: "20px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                      }}
                                    >
                                      {item.name}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: waitroseGrey,
                                        lineHeight: "18px",
                                        marginTop: 2,
                                      }}
                                    >
                                      {item.weight}
                                    </div>
                            {item.offers && (
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  color: "#a6192e",
                                  lineHeight: "18px",
                                  textDecoration: "underline",
                                  marginTop: 2,
                                }}
                              >
                                {item.offers}
                              </div>
                            )}
                                  </div>
                                </div>
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              color: squidInk,
                              lineHeight: "24px",
                            }}
                          >
                            £{item.price.toFixed(2)}
                          </div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 300,
                              color: squidInk,
                              lineHeight: "20px",
                            }}
                          >
                            {item.ppu || item.weight}
                          </div>
                        </div>
                                <button
                                  type="button"
                                  onClick={() => addCsmToTrolleyFromCard(item)}
                                  style={{
                                    width: "100%",
                                    height: 40,
                                    border: `1px solid ${squidInk}`,
                                    backgroundColor: "#fff",
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: squidInk,
                                    cursor: "pointer",
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div
              style={{
                position: "fixed",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: 0,
                width: "100%",
                maxWidth: 767,
                padding: "12px 16px",
                backgroundColor: "#fff",
                borderTop: `1px solid ${oysterGrey}`,
                zIndex: 20,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPage("groceries");
                  window.scrollTo(0, 0);
                }}
                style={{
                  width: "100%",
                  height: 48,
                  border: "none",
                  backgroundColor: waitroseGrey,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: "24px",
                  cursor: "pointer",
                }}
              >
                Continue shopping
              </button>
            </div>
          </>
        )}

        {/* ═══════════════ TROLLEY PAGE ═══════════════ */}
        {page === "trolley" && checkoutStep === "trolley" && (
          <>
            <div style={{ padding: "24px 16px 0", backgroundColor: "#fff" }}>
              <h1 style={{
                margin: 0, fontSize: 18, fontWeight: 500,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: squidInk, textAlign: "center",
              }}>
                Your trolley
              </h1>
              <div style={{ width: 40, height: 2, backgroundColor: squidInk, margin: "16px auto" }} />
            </div>

            {belowMinSpend && trolleyItems.length > 0 && (
              <div style={{
                margin: "0 16px 12px", padding: "12px 16px",
                backgroundColor: "#fef7e0", border: "1px solid #f5c518",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18, lineHeight: "24px" }}>⚠</span>
                <div style={{ fontSize: 14, color: squidInk, lineHeight: "20px" }}>
                  <span style={{ fontWeight: 500 }}>Spend £{amountToMinSpend.toFixed(2)} more to reach the £{MIN_SPEND.toFixed(0)} minimum for delivery.</span>
                  {" "}You can still checkout for collection.
                </div>
              </div>
            )}

            {trolleyItems.length === 0 ? (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
                <div style={{ fontSize: 18, fontWeight: 500, color: squidInk, marginBottom: 8 }}>
                  Your trolley is empty
                </div>
                <div style={{ fontSize: 14, color: waitroseGrey, lineHeight: "20px", marginBottom: 24 }}>
                  Add items from Quick Shop to get started
                </div>
                <button type="button" onClick={() => { setPage("favourites"); window.scrollTo(0, 0); }}
                  style={{
                    height: 40, border: `1px solid ${squidInk}`, backgroundColor: "#fff",
                    fontSize: 16, fontWeight: 400, color: squidInk, cursor: "pointer",
                    padding: "0 32px", lineHeight: "24px",
                  }}>
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <div style={{ padding: "0 16px 8px", fontSize: 14, fontWeight: 500, color: waitroseGrey }}>
                  {trolleyItemCount} {trolleyItemCount === 1 ? "item" : "items"}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {trolleyItems.map((item) => (
                    <div key={item.id} style={{
                      borderTop: `1px solid ${oysterGrey}`,
                      backgroundColor: "#fff", padding: 16,
                      display: "flex", gap: 16,
                    }}>
                      <img src={item.image} alt={item.name}
                        style={{ width: 70, height: 70, objectFit: "contain", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 500, color: squidInk, lineHeight: "20px",
                          overflow: "hidden", textOverflow: "ellipsis",
                          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 13, color: waitroseGrey, lineHeight: "18px" }}>
                          {item.weight}
                        </div>
                        {item.offers && (
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#a6192e", lineHeight: "18px" }}>
                            {item.offers}
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                            <div style={{
                              width: 56, height: 36, border: `1px solid ${squidInk}`,
                              backgroundColor: "#fff", display: "flex", alignItems: "center",
                              padding: "0 10px", fontSize: 14, fontWeight: 500, color: squidInk,
                            }}>
                              {item.quantity}
                            </div>
                            <button type="button" onClick={() => updateTrolleyQty(item.id, item.quantity - 1)}
                              style={{
                                height: 36, border: "none", backgroundColor: waitroseGrey,
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", padding: "0 14px", flexShrink: 0,
                              }}>
                              <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
                                <rect width="12" height="2" rx="0.5" fill="white" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => updateTrolleyQty(item.id, item.quantity + 1)}
                              style={{
                                height: 36, border: "none", backgroundColor: waitroseGrey,
                                color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", padding: "0 14px", flexShrink: 0,
                              }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <rect x="5" y="0" width="2" height="12" rx="0.5" fill="white" />
                                <rect x="0" y="5" width="12" height="2" rx="0.5" fill="white" />
                              </svg>
                            </button>
                          </div>
                          <div style={{ fontSize: 16, fontWeight: 500, color: squidInk }}>
                            £{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                        <button type="button" onClick={() => removeTrolleyItem(item.id)}
                          style={{
                            alignSelf: "flex-start", marginTop: 4,
                            border: "none", backgroundColor: "transparent",
                            fontSize: 13, fontWeight: 500, color: waitroseGrey,
                            textDecoration: "underline", cursor: "pointer", padding: 0,
                          }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${oysterGrey}` }} />
                </div>

                {/* Order summary */}
                <div style={{ padding: "20px 16px", backgroundColor: "#fff" }}>
                  <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 500, color: squidInk }}>
                    Order summary
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: squidInk }}>
                      <span>Subtotal ({trolleyItemCount} {trolleyItemCount === 1 ? "item" : "items"})</span>
                      <span style={{ fontWeight: 500 }}>£{trolleySubtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: squidInk }}>
                      <span>Delivery</span>
                      <span style={{ fontWeight: 500 }}>{DELIVERY_FEE === 0 ? "Free" : `£${DELIVERY_FEE.toFixed(2)}`}</span>
                    </div>
                    <div style={{ height: 1, backgroundColor: oysterGrey, margin: "4px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 500, color: squidInk }}>
                      <span>Estimated total</span>
                      <span>£{(trolleySubtotal + DELIVERY_FEE).toFixed(2)}</span>
                    </div>
                  </div>
                  {!belowMinSpend && (
                    <div style={{
                      marginTop: 16, padding: "10px 12px",
                      backgroundColor: "#f1f8e8", border: `1px solid ${successGreen}`,
                      fontSize: 13, color: green, fontWeight: 500, lineHeight: "18px",
                      display: "flex", gap: 8, alignItems: "center",
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 4" stroke={green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      You've met the £{MIN_SPEND.toFixed(0)} minimum spend for delivery
                    </div>
                  )}
                </div>

                <div style={{ padding: "12px 16px 16px", backgroundColor: "#fff" }}>
                  <button type="button" onClick={() => { setPage("favourites"); window.scrollTo(0, 0); }}
                    style={{
                      width: "100%", height: 40, border: `1px solid ${squidInk}`,
                      backgroundColor: "#fff", fontSize: 14, fontWeight: 400, color: squidInk,
                      cursor: "pointer", marginBottom: 10, lineHeight: "24px",
                    }}>
                    Continue shopping
                  </button>
                  <button type="button" onClick={() => clearTrolley()}
                    style={{
                      width: "100%", height: 40, border: `1px solid ${oysterGrey}`,
                      backgroundColor: "#fff", fontSize: 14, fontWeight: 400, color: waitroseGrey,
                      cursor: "pointer", lineHeight: "24px",
                    }}>
                    Empty trolley
                  </button>
                </div>

                <div style={{ height: 80 }} />
              </>
            )}

            {trolleyItems.length > 0 && (
              <div style={{
                position: "fixed", left: "50%", transform: "translateX(-50%)",
                bottom: 0, width: "100%", maxWidth: 767,
                padding: "12px 16px", backgroundColor: "#fff",
                borderTop: `1px solid ${oysterGrey}`, zIndex: 20,
              }}>
                <button type="button"
                  onClick={() => { setCheckoutStep("checkout"); window.scrollTo(0, 0); }}
                  style={{
                    width: "100%", height: 48, border: "none",
                    backgroundColor: belowMinSpend ? waitroseGrey : green,
                    color: "#fff", fontSize: 16, fontWeight: 400,
                    lineHeight: "24px", cursor: "pointer",
                  }}>
                  Checkout — £{(trolleySubtotal + DELIVERY_FEE).toFixed(2)}
                </button>
              </div>
            )}
          </>
        )}

        {/* ═══════════════ CHECKOUT PAGE ═══════════════ */}
        {page === "trolley" && checkoutStep === "checkout" && (
          <>
            <div style={{ padding: "24px 16px 0", backgroundColor: "#fff" }}>
              <h1 style={{
                margin: 0, fontSize: 18, fontWeight: 500,
                letterSpacing: "0.2em", textTransform: "uppercase",
                color: squidInk, textAlign: "center",
              }}>
                Checkout
              </h1>
              <div style={{ width: 40, height: 2, backgroundColor: squidInk, margin: "16px auto" }} />
            </div>

            {/* Progress steps */}
            <div style={{ display: "flex", padding: "0 16px 20px", gap: 4 }}>
              {["Trolley", "Delivery", "Payment", "Confirm"].map((step, i) => (
                <div key={step} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{
                    height: 4, marginBottom: 6,
                    backgroundColor: i === 0 ? green : (i === 1 ? green : oysterGrey),
                    borderRadius: 2,
                  }} />
                  <span style={{
                    fontSize: 11, fontWeight: 500,
                    color: i <= 1 ? green : waitroseGrey,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Delivery slot section */}
            <div style={{
              margin: "0 16px 12px", padding: 16,
              border: `1px solid ${oysterGrey}`, backgroundColor: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📅</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: squidInk }}>
                  Delivery slot
                </h3>
              </div>
              <div style={{
                padding: "12px 14px", backgroundColor: scallopGrey,
                border: `1px solid ${oysterGrey}`, marginBottom: 8,
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: squidInk, marginBottom: 2 }}>
                  Tomorrow, {new Date(Date.now() + 86400000).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <div style={{ fontSize: 14, color: waitroseGrey }}>
                  7:00 AM - 8:00 PM
                </div>
              </div>
              <button type="button" style={{
                border: "none", backgroundColor: "transparent",
                fontSize: 14, fontWeight: 500, color: squidInk,
                textDecoration: "underline", cursor: "pointer", padding: 0,
              }}>
                Change slot
              </button>
            </div>

            {/* Delivery address */}
            <div style={{
              margin: "0 16px 12px", padding: 16,
              border: `1px solid ${oysterGrey}`, backgroundColor: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: squidInk }}>
                  Delivery address
                </h3>
              </div>
              <div style={{ fontSize: 14, color: squidInk, lineHeight: "22px" }}>
                123 Example Street<br />
                London<br />
                SW1A 1AA
              </div>
              <button type="button" style={{
                border: "none", backgroundColor: "transparent",
                fontSize: 14, fontWeight: 500, color: squidInk,
                textDecoration: "underline", cursor: "pointer", padding: 0, marginTop: 8,
              }}>
                Change address
              </button>
            </div>

            {/* Payment method */}
            <div style={{
              margin: "0 16px 12px", padding: 16,
              border: `1px solid ${oysterGrey}`, backgroundColor: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>💳</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: squidInk }}>
                  Payment
                </h3>
              </div>
              <div style={{
                padding: "12px 14px", backgroundColor: scallopGrey,
                border: `1px solid ${oysterGrey}`,
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 24, borderRadius: 3,
                  backgroundColor: "#1a1f71", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 700, color: "#fff",
                }}>
                  VISA
                </div>
                <span style={{ fontSize: 14, color: squidInk }}>
                  •••• •••• •••• 4242
                </span>
              </div>
              <button type="button" style={{
                border: "none", backgroundColor: "transparent",
                fontSize: 14, fontWeight: 500, color: squidInk,
                textDecoration: "underline", cursor: "pointer", padding: 0, marginTop: 8,
              }}>
                Change payment method
              </button>
            </div>

            {/* Order summary */}
            <div style={{
              margin: "0 16px 12px", padding: 16,
              border: `1px solid ${oysterGrey}`, backgroundColor: "#fff",
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500, color: squidInk }}>
                Order summary
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: squidInk }}>
                  <span>Subtotal ({trolleyItemCount} {trolleyItemCount === 1 ? "item" : "items"})</span>
                  <span style={{ fontWeight: 500 }}>£{trolleySubtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: squidInk }}>
                  <span>Delivery</span>
                  <span style={{ fontWeight: 500 }}>{DELIVERY_FEE === 0 ? "Free" : `£${DELIVERY_FEE.toFixed(2)}`}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: squidInk }}>
                  <span>Savings</span>
                  <span style={{ fontWeight: 500, color: "#a6192e" }}>-£0.00</span>
                </div>
                <div style={{ height: 1, backgroundColor: oysterGrey, margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 500, color: squidInk }}>
                  <span>Estimated total</span>
                  <span>£{(trolleySubtotal + DELIVERY_FEE).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Items in trolley (collapsed summary) */}
            <div style={{
              margin: "0 16px 12px", padding: 16,
              border: `1px solid ${oysterGrey}`, backgroundColor: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: squidInk }}>
                  Items ({trolleyItemCount})
                </h3>
                <button type="button"
                  onClick={() => { setCheckoutStep("trolley"); window.scrollTo(0, 0); }}
                  style={{
                    border: "none", backgroundColor: "transparent",
                    fontSize: 14, fontWeight: 500, color: squidInk,
                    textDecoration: "underline", cursor: "pointer", padding: 0,
                  }}>
                  Edit trolley
                </button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {trolleyItems.slice(0, 8).map((item) => (
                  <div key={item.id} style={{
                    width: 56, height: 56, position: "relative",
                    border: `1px solid ${oysterGrey}`, backgroundColor: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 4,
                  }}>
                    <img src={item.image} alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    <span style={{
                      position: "absolute", top: -4, left: -4,
                      width: 16, height: 16, borderRadius: "50%",
                      backgroundColor: green, color: "#fff",
                      fontSize: 10, fontWeight: 600,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {item.quantity}
                    </span>
                  </div>
                ))}
                {trolleyItems.length > 8 && (
                  <div style={{
                    width: 56, height: 56,
                    backgroundColor: scallopGrey, border: `1px solid ${oysterGrey}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 500, color: waitroseGrey,
                  }}>
                    +{trolleyItems.length - 8}
                  </div>
                )}
              </div>
            </div>

            {/* Substitutions preference */}
            <div style={{
              margin: "0 16px 12px", padding: 16,
              border: `1px solid ${oysterGrey}`, backgroundColor: "#fff",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>🔄</span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: squidInk }}>
                  Substitutions
                </h3>
              </div>
              <div style={{ fontSize: 14, color: waitroseGrey, lineHeight: "20px", marginBottom: 12 }}>
                If an item is unavailable, allow our shoppers to choose a suitable alternative.
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 44, height: 24, borderRadius: 12,
                  backgroundColor: green, position: "relative",
                  cursor: "pointer",
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%",
                    backgroundColor: "#fff", position: "absolute",
                    top: 2, left: 22, boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: squidInk }}>
                  Allow substitutions
                </span>
              </div>
            </div>

            <div style={{ height: 80 }} />

            {/* Checkout CTA */}
            <div style={{
              position: "fixed", left: "50%", transform: "translateX(-50%)",
              bottom: 0, width: "100%", maxWidth: 767,
              padding: "12px 16px", backgroundColor: "#fff",
              borderTop: `1px solid ${oysterGrey}`, zIndex: 20,
            }}>
              <button type="button"
                onClick={() => { setCheckoutStep("confirmation"); window.scrollTo(0, 0); }}
                style={{
                  width: "100%", height: 48, border: "none",
                  backgroundColor: waitroseGrey, color: "#fff",
                  fontSize: 16, fontWeight: 400, lineHeight: "24px",
                  cursor: "pointer",
                }}>
                Place order — £{(trolleySubtotal + DELIVERY_FEE).toFixed(2)}
              </button>
            </div>
          </>
        )}

        {/* ═══════════════ CONFIRMATION PAGE ═══════════════ */}
        {page === "trolley" && checkoutStep === "confirmation" && (
          <div style={{ padding: "48px 16px", textAlign: "center", backgroundColor: "#fff" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              backgroundColor: "#f1f8e8", margin: "0 auto 20px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M6 16L13 23L26 9" stroke={green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 style={{
              margin: "0 0 8px", fontSize: 20, fontWeight: 500,
              letterSpacing: "0.15em", textTransform: "uppercase", color: squidInk,
            }}>
              Order confirmed
            </h1>
            <div style={{ width: 40, height: 2, backgroundColor: squidInk, margin: "12px auto 20px" }} />
            <p style={{ margin: "0 0 4px", fontSize: 16, color: squidInk, lineHeight: "24px" }}>
              Thank you for your order
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: waitroseGrey, lineHeight: "20px" }}>
              Order reference: <span style={{ fontWeight: 500, color: squidInk }}>WR-{Date.now().toString().slice(-8)}</span>
            </p>

            <div style={{
              textAlign: "left", border: `1px solid ${oysterGrey}`,
              padding: 16, marginBottom: 16,
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500, color: squidInk }}>
                Delivery details
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: squidInk, lineHeight: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: waitroseGrey }}>Date</span>
                  <span style={{ fontWeight: 500 }}>
                    {new Date(Date.now() + 86400000).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: waitroseGrey }}>Time</span>
                  <span style={{ fontWeight: 500 }}>7:00 AM - 8:00 PM</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: waitroseGrey }}>Address</span>
                  <span style={{ fontWeight: 500, textAlign: "right" }}>123 Example Street, London</span>
                </div>
              </div>
            </div>

            <div style={{
              textAlign: "left", border: `1px solid ${oysterGrey}`,
              padding: 16, marginBottom: 24,
            }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 500, color: squidInk }}>
                Payment summary
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: squidInk }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Items ({trolleyItemCount})</span>
                  <span style={{ fontWeight: 500 }}>£{trolleySubtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Delivery</span>
                  <span style={{ fontWeight: 500 }}>{DELIVERY_FEE === 0 ? "Free" : `£${DELIVERY_FEE.toFixed(2)}`}</span>
                </div>
                <div style={{ height: 1, backgroundColor: oysterGrey, margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 500 }}>
                  <span>Total charged</span>
                  <span>£{(trolleySubtotal + DELIVERY_FEE).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button type="button"
              onClick={() => window.open("https://ows.io/os/8w5nzah9", "_blank", "noopener,noreferrer")}
              style={{
                width: "100%", height: 48, border: "none",
                backgroundColor: green, color: "#fff",
                fontSize: 16, fontWeight: 400, lineHeight: "24px",
                cursor: "pointer", marginBottom: 10,
              }}>
              Card sorting exercise
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
