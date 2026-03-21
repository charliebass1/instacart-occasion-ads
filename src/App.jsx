import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, Plus, X, Zap, BarChart3, Eye, Info, Check, ArrowRight, Search, Sparkles, TrendingUp, AlertTriangle, Target } from "lucide-react";

// ── Brand colors (inline styles since artifact renderer only supports core Tailwind) ──
const C = {
  dark: "#003D29",
  green: "#0AAD05",
  orange: "#FF7009",
  text: "#343538",
  mid: "#72767E",
  light: "#F6F7F5",
  muted: "#9CA3AF",
  border: "#EAEAE8",
  hover: "#002A1C",
};

// ── Data ────────────────────────────────────────────────────────────────
const OCCASIONS = {
  game_day: { name: "Game Day", icon: "🏈", signals: ["chips","salsa","beer","frozen wings","paper plates","dip","soda","pizza rolls","hot dogs","buns"], avgBasket: 67, vol: "1.2M", desc: "Sports entertaining" },
  weeknight_dinner: { name: "Weeknight Dinner", icon: "🍝", signals: ["pasta","sauce","ground beef","garlic","onion","olive oil","salad mix","bread","chicken breast","rice"], avgBasket: 42, vol: "4.8M", desc: "Quick family meals" },
  meal_prep: { name: "Meal Prep", icon: "🥗", signals: ["chicken breast","brown rice","broccoli","sweet potato","meal prep containers","greek yogurt","eggs","spinach","avocado","quinoa"], avgBasket: 78, vol: "890K", desc: "Health-conscious prep" },
  kids_lunches: { name: "Kids' Lunches", icon: "🧒", signals: ["sandwich bread","peanut butter","jelly","juice boxes","goldfish crackers","apple slices","string cheese","granola bars","fruit snacks","lunchbox"], avgBasket: 35, vol: "2.1M", desc: "School lunch packing" },
  brunch: { name: "Brunch", icon: "🥂", signals: ["eggs","bacon","orange juice","champagne","berries","cream cheese","bagels","smoked salmon","avocado","coffee"], avgBasket: 85, vol: "620K", desc: "Weekend hosting" },
  baby: { name: "Baby Care", icon: "👶", signals: ["baby food","diapers","formula","baby wipes","teething crackers","whole milk","bananas","avocado","sweet potato","oatmeal"], avgBasket: 58, vol: "1.4M", desc: "Infant nutrition" },
};

const SAMPLES = [
  { label: "Sarah", desc: "Game Day", items: ["tortilla chips","salsa","beer 12-pack","frozen wings","paper plates","guacamole"] },
  { label: "Mike", desc: "Meal Prep", items: ["chicken breast 3lb","brown rice","broccoli","sweet potato","greek yogurt","eggs 18ct","spinach"] },
  { label: "Jen", desc: "Weeknight Dinner", items: ["penne pasta","marinara sauce","ground beef","garlic","salad mix","italian bread"] },
  { label: "David", desc: "Kids' Lunches", items: ["sandwich bread","peanut butter","grape jelly","juice boxes","goldfish crackers","string cheese"] },
  { label: "Lisa", desc: "Baby Care", items: ["baby food","diapers","formula","baby wipes","whole milk","bananas","sweet potato"] },
];

const CAMPAIGNS = [
  { brand: "Tostitos", product: "Queso Blanco", occ: "game_day", roas: 7.4, imp: "2.3M" },
  { brand: "Barilla", product: "Protein+ Penne", occ: "weeknight_dinner", roas: 6.1, imp: "3.8M" },
  { brand: "Chobani", product: "Complete Cups", occ: "meal_prep", roas: 8.2, imp: "1.1M" },
  { brand: "Horizon", product: "Organic Pouches", occ: "kids_lunches", roas: 5.9, imp: "2.6M" },
];

const NON_ENDEMIC = [
  { brand: "DraftKings", product: "Sportsbook App", occ: "game_day", roas: 9.1, imp: "1.8M", cat: "Sports Betting" },
  { brand: "Blue Apron", product: "Weekly Plan", occ: "weeknight_dinner", roas: 6.8, imp: "2.1M", cat: "Meal Kits" },
  { brand: "Peloton", product: "App Membership", occ: "meal_prep", roas: 7.5, imp: "890K", cat: "Fitness" },
  { brand: "Kumon", product: "Math + Reading", occ: "kids_lunches", roas: 5.4, imp: "1.2M", cat: "Education" },
  { brand: "Haven Life", product: "Term Life Quote", occ: "baby", roas: 8.9, imp: "960K", cat: "Insurance" },
  { brand: "OpenTable", product: "Reservations", occ: "brunch", roas: 7.2, imp: "540K", cat: "Dining" },
];

const NON_ENDEMIC_SURFACES = [
  { n: "Off-Platform (TikTok, YouTube)", p: 45 },
  { n: "Marketplace Display", p: 35 },
  { n: "Caper Cart Screen", p: 20 },
];

function classify(items) {
  const n = items.map(i => i.toLowerCase());
  const scores = {};
  Object.entries(OCCASIONS).forEach(([k, o]) => {
    let m = 0; const matched = [];
    o.signals.forEach(s => { if (n.some(i => i.includes(s) || s.includes(i.split(" ")[0]))) { m++; matched.push(s); } });
    if (m >= 2) scores[k] = { conf: Math.min(0.95, 0.3 + m * 0.15), matched };
  });
  return Object.entries(scores).sort((a, b) => b[1].conf - a[1].conf).map(([k, d]) => ({ k, ...OCCASIONS[k], ...d }));
}

// ── Shared ──────────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 ${className}`}>{children}</div>
);

function IPhoneFrame({ children }) {
  return (
    <div className="mx-auto" style={{ width: 220 }}>
      <div className="rounded-3xl p-1.5 shadow-xl" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="relative">
          <div className="absolute top-0 left-1/2 w-16 h-3 rounded-b-xl z-10" style={{ transform: "translateX(-50%)", backgroundColor: "#1A1A1A" }} />
        </div>
        <div className="bg-white overflow-hidden" style={{ borderRadius: 22 }}>{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 1: ENGINE
// ═══════════════════════════════════════════════════════════════════════
function EngineTab() {
  const [sel, setSel] = useState(null);
  const [items, setItems] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const run = useCallback((list) => { setLoading(true); setResults([]); setTimeout(() => { setResults(classify(list)); setLoading(false); }, 500); }, []);
  const pick = (s) => { setSel(s.label); setItems(s.items); run(s.items); };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: C.dark }}>Occasion Engine</h2>
      <p className="text-gray-500 text-sm mb-5">Select a sample cart to see occasion classification in action.</p>

      <Card className="p-5 mb-4">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Sample Carts</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {SAMPLES.map(s => (
            <button key={s.label} onClick={() => pick(s)}
              className="p-3 rounded-xl text-left transition-all"
              style={{ backgroundColor: sel === s.label ? C.dark : C.light, color: sel === s.label ? "white" : C.text }}>
              <p className="font-semibold text-sm">{s.label}'s Cart</p>
              <p className="text-xs mt-0.5" style={{ opacity: 0.6 }}>{s.desc} · {s.items.length} items</p>
            </button>
          ))}
        </div>
        {items.length > 0 && (
          <div className="space-y-0 max-h-44 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2">
                <Check size={12} style={{ color: C.green }} />
                <span className="text-sm text-gray-800">{item}</span>
              </div>
            ))}
          </div>
        )}
        {items.length === 0 && (
          <div className="text-center py-6">
            <ShoppingCart size={28} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Select a cart above to begin</p>
          </div>
        )}
      </Card>

      {loading && <div className="flex justify-center py-10"><div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <Card key={r.k} className={`p-5 ${i === 0 ? "ring-2 ring-green-400 ring-opacity-30" : ""}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold" style={{ color: C.dark }}>{r.name}</span>
                      {i === 0 && <span className="text-white text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: C.green }}>Top Match</span>}
                    </div>
                    <p className="text-gray-500 text-sm">{r.desc}</p>
                  </div>
                </div>
                <span className="text-2xl font-bold" style={{ color: C.dark }}>{Math.round(r.conf * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${r.conf * 100}%`, backgroundColor: C.green }} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.matched.map(s => <span key={s} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{s}</span>)}
              </div>
              {i === 0 && (
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center"><p className="text-base font-bold" style={{ color: C.dark }}>${r.avgBasket}</p><p className="text-xs text-gray-400">Avg basket</p></div>
                  <div className="text-center"><p className="text-base font-bold" style={{ color: C.dark }}>{r.vol}</p><p className="text-xs text-gray-400">Weekly vol</p></div>
                  <div className="text-center"><p className="text-base font-bold" style={{ color: C.green }}>$7.40</p><p className="text-xs text-gray-400">Proj. ROAS</p></div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && items.length < 2 && (
        <div className="text-center py-10"><Search size={28} className="text-gray-300 mx-auto mb-2" /><p className="text-gray-400 text-sm">Add items to see occasion detection</p></div>
      )}

      <p className="text-xs text-gray-400 uppercase tracking-widest mt-6 mb-3">Occasion Taxonomy v1</p>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(OCCASIONS).map(([k, o]) => (
          <div key={k} className="bg-gray-100 rounded-xl px-3 py-2.5 text-center">
            <span className="text-xl">{o.icon}</span>
            <p className="text-xs font-medium mt-0.5" style={{ color: C.dark }}>{o.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 2: BRANDS
// ═══════════════════════════════════════════════════════════════════════
function BrandTab() {
  const [mode, setMode] = useState("endemic");
  const [occ, setOcc] = useState("game_day");
  const [budget, setBudget] = useState(45000);
  const [launched, setLaunched] = useState(false);
  const o = OCCASIONS[occ];
  const isNE = mode === "non_endemic";
  const neMatch = NON_ENDEMIC.find(n => n.occ === occ);
  const roas = isNE
    ? (neMatch ? neMatch.roas : 7.0)
    : (occ === "game_day" ? 7.4 : occ === "meal_prep" ? 8.2 : occ === "brunch" ? 7.8 : 6.1);
  const imp = Math.round((budget / 45000) * (isNE ? 1800000 : 2300000));
  const surfaces = isNE ? NON_ENDEMIC_SURFACES : [{ n: "Marketplace", p: 55 }, { n: "Caper Cart", p: 25 }, { n: "Off-Platform", p: 20 }];

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: C.dark }}>Brand Dashboard</h2>
      <p className="text-gray-500 text-sm mb-5">Create a campaign targeting a shopping occasion.</p>

      {/* Endemic / Non-Endemic toggle */}
      <div className="flex gap-1.5 mb-3">
        {[{ k: "endemic", l: "Endemic (CPG)" }, { k: "non_endemic", l: "Non-Endemic" }].map(m => (
          <button key={m.k} onClick={() => { setMode(m.k); setLaunched(false); }}
            className="flex-1 py-2 rounded-xl font-semibold transition-all text-center"
            style={{ fontSize: 13, backgroundColor: mode === m.k ? C.dark : C.light, color: mode === m.k ? "white" : C.mid }}>
            {m.l}
          </button>
        ))}
      </div>

      {isNE && (
        <div className="rounded-xl p-2.5 mb-3 border border-orange-200 bg-orange-50">
          <p className="font-semibold text-gray-800 mb-1" style={{ fontSize: 13 }}>Non-endemic ads unlock new TAM</p>
          <p className="text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>
            Keywords tell you what someone buys. Occasions tell you what someone is <em>doing</em> — the signal non-endemic advertisers actually need. US non-endemic retail media grew 83% YoY in 2025.
          </p>
        </div>
      )}

      <Card className="p-5 mb-4">
        <p className="text-gray-400 uppercase tracking-widest mb-2.5" style={{ fontSize: 13 }}>Target Occasion</p>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(OCCASIONS).map(([k, oc]) => (
            <button key={k} onClick={() => { setOcc(k); setLaunched(false); }}
              className="flex items-center gap-1.5 p-2 rounded-xl text-left transition-all"
              style={{ backgroundColor: occ === k ? C.dark : C.light, color: occ === k ? "white" : C.text }}>
              <span className="text-sm">{oc.icon}</span>
              <p className="font-medium leading-tight" style={{ fontSize: 13 }}>{oc.name}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Non-endemic: show matched advertiser for selected occasion */}
      {isNE && neMatch && (
        <Card className="p-5 mb-4">
          <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Matched Non-Endemic Advertiser</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.light }}>
              <span className="text-lg">{OCCASIONS[neMatch.occ].icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ fontSize: 13, color: C.dark }}>{neMatch.brand}</p>
              <p className="text-gray-500" style={{ fontSize: 13 }}>{neMatch.product}</p>
              <p className="font-medium mt-0.5" style={{ fontSize: 13, color: C.orange }}>{neMatch.cat}</p>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ fontSize: 14, color: C.green }}>{neMatch.roas}x</p>
              <p className="text-gray-400" style={{ fontSize: 13 }}>Proj. ROAS</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-5 mb-4">
        <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Monthly Budget</p>
        <p className="text-2xl font-bold mb-2" style={{ color: C.dark }}>${budget.toLocaleString()}</p>
        <input type="range" min={5000} max={100000} step={5000} value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full accent-green-500 mb-3" />
        <p className="text-gray-400 uppercase tracking-widest mb-1.5" style={{ fontSize: 13 }}>Ad Surfaces</p>
        {surfaces.map(s => (
          <div key={s.n} className="flex items-center justify-between py-1">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isNE ? C.orange : C.green }} />
              <span className="text-gray-800" style={{ fontSize: 13 }}>{s.n}</span>
            </div>
            <span className="text-gray-400" style={{ fontSize: 13 }}>{s.p}%</span>
          </div>
        ))}
      </Card>

      <Card className="p-5 mb-4">
        <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Projected Performance</p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-bold" style={{ color: C.green }}>${roas.toFixed(1)}</span>
          <span className="text-gray-400" style={{ fontSize: 13 }}>Occasion ROAS</span>
        </div>
        <p className="text-gray-400 mb-3" style={{ fontSize: 13 }}>
          {isNE ? "Non-endemic via occasion signal " : "vs $5.25 keyword avg "}
          <span className="font-medium" style={{ color: C.green }}>(+{Math.round(((roas - 5.25) / 5.25) * 100)}%)</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div><p className="text-gray-400" style={{ fontSize: 13 }}>Impressions</p><p className="text-xs font-bold" style={{ color: C.dark }}>{(imp / 1e6).toFixed(1)}M</p></div>
          <div><p className="text-gray-400" style={{ fontSize: 13 }}>{isNE ? "Installs/Leads" : "Conversions"}</p><p className="text-xs font-bold" style={{ color: C.dark }}>{Math.round(imp * (isNE ? 0.031 : 0.042) * 0.12).toLocaleString()}</p></div>
          <div><p className="text-gray-400" style={{ fontSize: 13 }}>Revenue</p><p className="text-xs font-bold" style={{ color: C.green }}>${Math.round(budget * roas).toLocaleString()}</p></div>
        </div>
        {!isNE && (
          <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
            {[{ l: `${o.icon} Occasion`, v: roas, c: C.green }, { l: "Keyword", v: 5.25, c: C.mid }, { l: "Amazon", v: 4.92, c: "#C4C8CC" }].map(r => (
              <div key={r.l}>
                <div className="flex justify-between mb-0.5" style={{ fontSize: 13 }}><span className="text-gray-800">{r.l}</span><span className="font-bold" style={{ color: r.c }}>${r.v.toFixed(2)}</span></div>
                <div className="w-full bg-gray-100 rounded-full h-1"><div className="h-1 rounded-full transition-all duration-500" style={{ width: `${(r.v / 10) * 100}%`, backgroundColor: r.c }} /></div>
              </div>
            ))}
          </div>
        )}
        {isNE && (
          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <p className="text-gray-400 uppercase tracking-widest mb-1.5" style={{ fontSize: 13 }}>Why it works for non-endemic</p>
            <p className="text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>
              A life insurance company can't target "diapers." But they <em>can</em> target "new parent" — an occasion only Instacart's basket data reveals. Off-platform delivery via TikTok, YouTube, and The Trade Desk.
            </p>
          </div>
        )}
      </Card>

      <button onClick={() => setLaunched(true)}
        className="w-full py-3 rounded-2xl text-xs font-semibold transition-all flex items-center justify-center gap-2 text-white"
        style={{ backgroundColor: launched ? C.green : C.dark }}>
        {launched ? <><Check size={14} /> Campaign Created</> : <>Launch Campaign <ArrowRight size={14} /></>}
      </button>

      <Card className="mt-3 overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-gray-100">
          <p className="text-gray-400 uppercase tracking-widest" style={{ fontSize: 13 }}>{isNE ? "Non-Endemic Campaigns" : "Active Campaigns"}</p>
        </div>
        {(isNE ? NON_ENDEMIC : CAMPAIGNS).map((c, i) => {
          const co = OCCASIONS[c.occ];
          return (
            <div key={i} className="flex items-center justify-between px-3.5 py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <span>{co.icon}</span>
                <div>
                  <p className="font-medium" style={{ fontSize: 13, color: C.dark }}>{c.brand}</p>
                  <p className="text-gray-400" style={{ fontSize: 13 }}>{c.product}{c.cat ? ` · ${c.cat}` : ""}</p>
                </div>
              </div>
              <div className="text-right"><p className="font-bold" style={{ fontSize: 13, color: isNE ? C.orange : C.green }}>${c.roas}x</p><p className="text-gray-400" style={{ fontSize: 13 }}>{c.imp}</p></div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 3: CONSUMER
// ═══════════════════════════════════════════════════════════════════════
function ConsumerTab() {
  const [surface, setSurface] = useState("app");
  const [showAd, setShowAd] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => { setShowAd(false); setAdded(false); const t = setTimeout(() => setShowAd(true), 800); return () => clearTimeout(t); }, [surface]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: C.dark }}>Consumer Experience</h2>
      <p className="text-gray-500 text-sm mb-5">How occasion-targeted ads appear to shoppers.</p>

      <div className="flex gap-1.5 mb-4">
        {[{ k: "app", l: "📱 App" }, { k: "caper", l: "🛒 Caper Cart" }].map(v => (
          <button key={v.k} onClick={() => setSurface(v.k)}
            className="px-3 py-1.5 rounded-full font-medium transition-all"
            style={{ fontSize: 13, backgroundColor: surface === v.k ? C.dark : C.light, color: surface === v.k ? "white" : C.mid }}>
            {v.l}
          </button>
        ))}
      </div>

      {surface === "app" ? (
        <IPhoneFrame>
          <div className="px-3.5 py-2 flex justify-between items-center" style={{ backgroundColor: C.dark }}>
            <span className="text-white font-semibold tracking-wide" style={{ fontSize: 13 }}>instacart</span>
            <span className="text-white" style={{ fontSize: 13, opacity: 0.4 }}>Cart (5)</span>
          </div>
          <div className="px-2.5 py-2">
            <p className="text-gray-400 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>Your Cart</p>
            {["Tortilla Chips", "Salsa Verde", "Beer 12-pack", "Frozen Wings", "Paper Plates"].map((item, i) => (
              <div key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                <span className="text-gray-800" style={{ fontSize: 13 }}>{item}</span>
                <span className="text-gray-400" style={{ fontSize: 13 }}>${(3.99 + i * 2.5).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className={`mx-2.5 mb-1.5 transition-all duration-500 ${showAd ? "opacity-100" : "opacity-0"}`}>
            <div className="bg-orange-50 border border-orange-200 rounded-lg overflow-hidden">
              <div className="px-2.5 py-1 flex justify-between">
                <span className="font-bold" style={{ fontSize: 13, color: C.orange }}>🏈 Game Day Essentials</span>
                <span className="text-gray-400" style={{ fontSize: 7 }}>Sponsored</span>
              </div>
              <div className="px-2.5 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-yellow-50 rounded-md flex items-center justify-center text-base">🧀</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800" style={{ fontSize: 13 }}>Tostitos Queso Blanco</p>
                    <p className="text-gray-400" style={{ fontSize: 8 }}>15 oz · $4.99</p>
                    <p className="font-medium" style={{ fontSize: 8, color: C.green }}>$1.00 off</p>
                  </div>
                </div>
                <button onClick={() => setAdded(true)}
                  className="w-full mt-1.5 py-1 rounded-md font-semibold"
                  style={{ fontSize: 13, backgroundColor: added ? "#E8F5E9" : C.dark, color: added ? C.green : "white" }}>
                  {added ? "Added" : "Add to Cart"}
                </button>
              </div>
            </div>
          </div>
          <div className="mx-2.5 mb-2.5">
            <div className="rounded-lg py-2 text-center" style={{ backgroundColor: C.green }}>
              <p className="text-white font-semibold" style={{ fontSize: 13 }}>Checkout · $32.45</p>
            </div>
          </div>
        </IPhoneFrame>
      ) : (
        <div className="mx-auto" style={{ width: 240 }}>
          <div className="bg-gray-800 rounded-2xl p-2 shadow-xl">
            <div className="flex justify-between px-2 py-1">
              <span className="text-gray-500" style={{ fontSize: 13 }}>Caper Cart</span>
              <span style={{ fontSize: 13, color: C.green }}>● Connected</span>
            </div>
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-3 py-2.5" style={{ backgroundColor: C.dark }}>
                <div className="flex justify-between items-center">
                  <div><p className="text-white font-semibold" style={{ fontSize: 13 }}>Hi Charlie</p><p className="text-white" style={{ fontSize: 13, opacity: 0.4 }}>5 of 8 items</p></div>
                  <p className="text-white text-sm font-bold">$28.47</p>
                </div>
                <div className="mt-1.5 w-full rounded-full h-0.5" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                  <div className="h-0.5 rounded-full" style={{ width: "62%", backgroundColor: C.green }} />
                </div>
              </div>
              <div className="px-2.5 py-1.5 space-y-0.5">
                {["Chips", "Salsa", "Beer", "Wings", "Plates"].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-gray-800" style={{ fontSize: 13 }}><Check size={9} style={{ color: C.green }} />{item}</div>
                ))}
              </div>
              <div className={`mx-2.5 mb-1.5 transition-all duration-500 ${showAd ? "opacity-100" : "opacity-0"}`}>
                <div className="rounded-lg border border-orange-200 bg-orange-50 overflow-hidden">
                  <div className="px-2.5 py-1" style={{ backgroundColor: "rgba(255,112,9,0.1)" }}>
                    <span className="font-bold" style={{ fontSize: 13, color: C.orange }}>🏈 GAME DAY DETECTED</span>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center gap-2 bg-white rounded-md p-1.5">
                      <span className="text-base">🧀</span>
                      <div className="flex-1">
                        <p className="font-medium" style={{ fontSize: 13 }}>Tostitos Queso</p>
                        <p style={{ fontSize: 8, color: C.green }}>$1 off · Aisle 3</p>
                      </div>
                      <button onClick={() => setAdded(true)}
                        className="px-2 py-1 rounded-md font-semibold"
                        style={{ fontSize: 13, backgroundColor: added ? "#E8F5E9" : C.dark, color: added ? C.green : "white" }}>
                        {added ? "✓" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mx-2.5 mb-2 bg-gray-100 rounded-md p-1.5 flex items-center gap-1.5">
                <span style={{ fontSize: 13 }}>📍</span>
                <div>
                  <p className="text-gray-400" style={{ fontSize: 8 }}>Next</p>
                  <p className="text-gray-800" style={{ fontSize: 13 }}>Guacamole → Aisle 4</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="p-3.5 mt-4">
        <p className="text-gray-400 uppercase tracking-widest mb-2.5" style={{ fontSize: 13 }}>How It Works</p>
        {[
          { n: "1", t: "Detect", d: "Classify occasion from basket signals in real time." },
          { n: "2", t: "Match", d: "At 75%+ confidence, activate occasion ad inventory." },
          { n: "3", t: "Serve", d: "Contextual ads appear mid-shopping across all surfaces." },
          { n: "4", t: "Attribute", d: "Ad → add → purchase. Full closed loop." },
        ].map(s => (
          <div key={s.n} className="flex gap-2.5 mb-2.5 last:mb-0">
            <div className="w-5 h-5 text-white rounded-full flex items-center justify-center flex-shrink-0" style={{ fontSize: 13, fontWeight: 700, backgroundColor: C.dark }}>{s.n}</div>
            <div><p className="font-semibold" style={{ fontSize: 13, color: C.dark }}>{s.t}</p><p className="text-gray-500" style={{ fontSize: 13 }}>{s.d}</p></div>
          </div>
        ))}
      </Card>

      <div className="bg-gray-100 rounded-2xl p-3.5 mt-2.5 space-y-1.5">
        {[
          { t: "Higher ROAS", d: "$7.40 vs $5.25 keyword avg (+41%)." },
          { t: "Premium tier", d: "New inventory, no keyword cannibalization." },
          { t: "Cross-surface", d: "App + Caper Cart + off-platform, one campaign." },
          { t: "Defensible", d: "Only Instacart has this basket data at scale." },
        ].map(i => <p key={i.t} className="text-gray-800" style={{ fontSize: 13 }}><span className="font-semibold" style={{ color: C.dark }}>{i.t}:</span> {i.d}</p>)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 4: ABOUT
// ═══════════════════════════════════════════════════════════════════════
function AboutTab() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: C.dark }}>About This Concept</h2>
      <p className="text-gray-500 text-sm mb-5">A new ad primitive for Instacart retail media.</p>

      <Card className="p-5 mb-4">
        <h3 className="text-sm font-bold mb-2" style={{ color: C.dark }}>The Insight</h3>
        <p className="text-xs text-gray-800 leading-relaxed mb-2">
          Carrot Ads surpassed <strong>$1B+ in ad revenue</strong> with 9,000+ advertisers. But targeting is keyword-based — the same as every other retail media network.
        </p>
        <p className="text-xs text-gray-800 leading-relaxed mb-3">
          Instacart has <strong>338.8M orders across 1,800+ retailers</strong>. That basket data reveals what keywords can't: the shopping <strong>occasion</strong>.
        </p>
        <div className="grid grid-cols-3 gap-2 bg-gray-100 rounded-xl p-2.5">
          {[{ v: "$37.2B", l: "GTV '25" }, { v: "338.8M", l: "Orders" }, { v: "$1.09B", l: "EBITDA" }].map(s => (
            <div key={s.l} className="text-center"><p className="text-sm font-bold" style={{ color: C.dark }}>{s.v}</p><p className="text-gray-400" style={{ fontSize: 8 }}>{s.l}</p></div>
          ))}
        </div>
      </Card>

      {/* iPhone mockup */}
      <div className="mb-3">
        <p className="text-gray-400 uppercase tracking-widest mb-2.5 text-center" style={{ fontSize: 13 }}>The Consumer Ad Experience</p>
        <div className="bg-gray-100 rounded-2xl py-5 px-3">
          <IPhoneFrame>
            <div className="px-3.5 py-2 flex justify-between items-center" style={{ backgroundColor: C.dark }}>
              <span className="text-white font-semibold tracking-wide" style={{ fontSize: 13 }}>instacart</span>
              <span className="text-white" style={{ fontSize: 13, opacity: 0.4 }}>Cart (5)</span>
            </div>
            <div className="px-2.5 py-2">
              <p className="text-gray-400 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>Your Cart</p>
              {["Tortilla Chips", "Salsa Verde", "Beer 12-pack", "Frozen Wings", "Paper Plates"].map((item, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-gray-100 last:border-0">
                  <span className="text-gray-800" style={{ fontSize: 13 }}>{item}</span>
                  <span className="text-gray-400" style={{ fontSize: 13 }}>${(3.99 + i * 2.5).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mx-2.5 mb-1.5">
              <div className="bg-orange-50 border border-orange-200 rounded-lg overflow-hidden">
                <div className="px-2.5 py-1 flex justify-between items-center" style={{ backgroundColor: "rgba(255,112,9,0.05)" }}>
                  <span className="font-bold" style={{ fontSize: 13, color: C.orange }}>🏈 Game Day Essentials</span>
                  <span className="text-gray-400" style={{ fontSize: 7 }}>Sponsored</span>
                </div>
                <div className="px-2.5 pb-2 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-yellow-50 rounded-md flex items-center justify-center text-lg">🧀</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800" style={{ fontSize: 13 }}>Tostitos Queso Blanco</p>
                      <p className="text-gray-500" style={{ fontSize: 8 }}>15 oz · $4.99</p>
                      <p className="font-semibold" style={{ fontSize: 8, color: C.green }}>$1.00 off with loyalty</p>
                    </div>
                  </div>
                  <div className="text-white text-center py-1.5 rounded-md mt-1.5 font-semibold" style={{ fontSize: 13, backgroundColor: C.dark }}>Add to Cart</div>
                </div>
              </div>
            </div>
            <div className="mx-2.5 mb-2.5">
              <div className="rounded-lg py-2 text-center" style={{ backgroundColor: C.green }}>
                <p className="text-white font-semibold" style={{ fontSize: 13 }}>Checkout · $32.45</p>
                <p className="text-white" style={{ fontSize: 8, opacity: 0.5 }}>Free delivery with Instacart+</p>
              </div>
            </div>
          </IPhoneFrame>
          <p className="text-gray-400 text-center mt-2.5 leading-relaxed" style={{ fontSize: 13 }}>
            Occasion ad triggered by basket composition<br />matching "Game Day" at 87% confidence
          </p>
        </div>
      </div>

      <Card className="p-5 mb-4">
        <h3 className="text-sm font-bold mb-2" style={{ color: C.dark }}>How It Works</h3>
        <p className="text-xs text-gray-800 leading-relaxed mb-2">
          As items are added — online or via Caper Cart — the engine classifies basket composition against a trained
          occasion taxonomy. At 75%+ confidence, occasion-targeted ads activate across <strong>all surfaces</strong>: in-app,
          Caper Cart screens, and off-platform.
        </p>
        <p className="text-xs text-gray-800 leading-relaxed">
          Attribution is closed-loop: <strong>ad → add → purchase</strong>. Caper Cart data closes it in-store. Online data closes it digitally.
        </p>
      </Card>

      <Card className="p-5 mb-4">
        <h3 className="text-sm font-bold mb-2" style={{ color: C.dark }}>Strategic Alignment</h3>
        <div className="space-y-2.5">
          {[
            { t: "Q4 2025 Shareholder Letter", d: "AI personalization is a core priority. Occasion targeting applies this to ads." },
            { t: "Enterprise AI (Nov 2025)", d: "Cart Assistant and Catalog Engine generate richer signals for ad decisioning." },
            { t: "LLM Discovery (Feb 2026)", d: "DeBERTa classifier (99% cost reduction) — occasion inference extends this." },
            { t: "NVIDIA Partnership (Mar 2026)", d: "Grocery world model connecting Caper + online data is the infrastructure this needs." },
          ].map(i => (
            <div key={i.t} className="flex gap-2">
              <div className="w-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: C.green }} />
              <div><p className="font-semibold" style={{ fontSize: 13, color: C.dark }}>{i.t}</p><p className="text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>{i.d}</p></div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <h3 className="text-sm font-bold mb-2" style={{ color: C.dark }}>Why This Wins</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { t: "Higher ROAS", d: "$7.40 vs $5.25 keyword avg." },
            { t: "Premium Tier", d: "Higher CPMs, no cannibalization." },
            { t: "Cross-Surface", d: "One campaign, all surfaces." },
            { t: "Defensible", d: "Only Instacart has this data." },
          ].map(i => (
            <div key={i.t} className="bg-gray-100 rounded-xl p-2.5">
              <p className="font-semibold mb-0.5" style={{ fontSize: 13, color: C.dark }}>{i.t}</p>
              <p className="text-gray-500" style={{ fontSize: 13 }}>{i.d}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <h3 className="text-sm font-bold mb-2" style={{ color: C.dark }}>Non-Endemic TAM Expansion</h3>
        <p className="text-xs text-gray-800 leading-relaxed mb-2">
          Endemic ad spend is approaching saturation. The next growth frontier: <strong>non-endemic advertisers</strong> — financial services, streaming, fitness, education, travel — who need behavioral signals, not product keywords.
        </p>
        <p className="text-xs text-gray-800 leading-relaxed mb-3">
          Occasion targeting is the bridge. A "Baby Care" occasion unlocks life insurance and 529 plans. "Game Day" unlocks sports betting and streaming. Walmart and Amazon are already here — <strong>US non-endemic retail media grew 83% YoY</strong>.
        </p>
        <div className="space-y-1.5">
          {[
            { occ: "🏈 Game Day", ne: "DraftKings, YouTube TV, DoorDash" },
            { occ: "👶 Baby Care", ne: "Haven Life, Babylist, Kindercare" },
            { occ: "🥗 Meal Prep", ne: "Peloton, Noom, Vitamix" },
            { occ: "🧒 Kids' Lunches", ne: "Kumon, Disney+, T-Mobile" },
            { occ: "🥂 Brunch", ne: "OpenTable, Drizly, Sur La Table" },
          ].map(r => (
            <div key={r.occ} className="flex items-start gap-2 py-1 border-b border-gray-100 last:border-0">
              <span className="font-semibold whitespace-nowrap" style={{ fontSize: 13, color: C.dark }}>{r.occ}</span>
              <span className="text-gray-500" style={{ fontSize: 13 }}>{r.ne}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-xl p-2.5" style={{ backgroundColor: C.light }}>
          <p className="text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>
            <span className="font-semibold" style={{ color: C.orange }}>The unlock:</span> Instacart's RPM infrastructure (TikTok, YouTube, The Trade Desk) already delivers audiences off-platform. Occasion segments package that data for non-endemic buyers who can't use keyword targeting.
          </p>
        </div>
      </Card>

      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: C.dark }}>
        <Sparkles size={14} style={{ color: C.orange }} className="mb-2" />
        <p className="text-white text-xs leading-relaxed italic">
          "Every retail media network sells keyword targeting. Only Instacart can sell <span className="font-semibold" style={{ color: C.green }}>occasion targeting</span> — because only Instacart sees the full basket in real time."
        </p>
      </div>

      <div className="text-center">
        <p className="text-gray-500" style={{ fontSize: 13 }}>Product concept by <strong>Charlie Bass</strong> · March 2026</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 5: ECONOMICS & STRATEGY
// ═══════════════════════════════════════════════════════════════════════
function EconomicsTab() {
  const [section, setSection] = useState("model");

  return (
    <div>
      <h2 className="text-xl font-bold mb-1" style={{ color: C.dark }}>Economics &amp; Strategy</h2>
      <p className="text-gray-500 text-sm mb-5">Revenue model, risk assessment, and go-to-market recommendation.</p>

      <div className="flex gap-1 mb-4">
        {[{ k: "model", l: "Model", ic: TrendingUp }, { k: "risks", l: "Risks", ic: AlertTriangle }, { k: "rec", l: "GTM", ic: Target }].map(s => (
          <button key={s.k} onClick={() => setSection(s.k)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl font-semibold transition-all"
            style={{ fontSize: 13, backgroundColor: section === s.k ? C.dark : C.light, color: section === s.k ? "white" : C.mid }}>
            <s.ic size={12} />{s.l}
          </button>
        ))}
      </div>

      {section === "model" && (
        <div>
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { v: "$270–370M", l: "Y1 Incremental Rev." },
              { v: "23–31%", l: "Ad Rev. Uplift" },
              { v: "$42–55", l: "Occasion CPM" },
            ].map(s => (
              <div key={s.l} className="bg-gray-100 rounded-xl p-2.5 text-center">
                <p className="font-bold" style={{ fontSize: 14, color: C.green }}>{s.v}</p>
                <p className="text-gray-400" style={{ fontSize: 8 }}>{s.l}</p>
              </div>
            ))}
          </div>

          <Card className="p-5 mb-4">
            <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Revenue Model Assumptions</p>
            {[
              { p: "Annual orders", v: "338.8M", b: "FY2024 reported" },
              { p: "Occasion-eligible baskets", v: "60%", b: "4+ items in known occasions" },
              { p: "Above-threshold activations", v: "40%", b: "Exceeding 75% confidence" },
              { p: "Net activation rate", v: "24%", b: "60% × 40%" },
              { p: "Endemic occasion CPM", v: "$42", b: "1.7x vs $25 keyword baseline" },
              { p: "Non-endemic CPM", v: "$55", b: "Behavioral signal scarcity" },
              { p: "Impressions per activation", v: "3.2", b: "Multi-surface delivery" },
            ].map(r => (
              <div key={r.p} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <span className="text-gray-800" style={{ fontSize: 13 }}>{r.p}</span>
                  <span className="text-gray-400 ml-1" style={{ fontSize: 8 }}>({r.b})</span>
                </div>
                <span className="font-bold" style={{ fontSize: 13, color: C.dark }}>{r.v}</span>
              </div>
            ))}
          </Card>

          <Card className="p-5 mb-4">
            <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Year 1 Projection</p>
            {[
              { m: "Occasion activations", v: "81.3M", c: C.dark },
              { m: "Total impressions", v: "260.2M", c: C.dark },
              { m: "Endemic revenue", v: "$180–220M", c: C.green },
              { m: "Non-endemic revenue", v: "$90–150M", c: C.orange },
              { m: "Total incremental", v: "$270–370M", c: C.green },
            ].map(r => (
              <div key={r.m} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-gray-800" style={{ fontSize: 13 }}>{r.m}</span>
                <span className="font-bold" style={{ fontSize: 12, color: r.c }}>{r.v}</span>
              </div>
            ))}
          </Card>

          <Card className="p-5 mb-4">
            <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Why Occasions Command a Premium</p>
            {[
              { t: "Signal Density", d: "Multi-item basket reveals occasion intent — informationally richer than a single keyword search. Higher signal → higher predicted conversion → higher WTP." },
              { t: "Reduced Adverse Selection", d: "Keyword auctions favor brands with worst organic relevance. Occasion targeting naturally filters for contextually relevant matches." },
              { t: "Inventory Scarcity", d: "Occasion inventory is demand-gated — only available when basket triggers classification. Scarce, non-substitutable inventory commands premium CPMs." },
              { t: "Data Flywheel", d: "Each classified basket strengthens the model. More advertisers → better models → higher ROAS → more demand. Deepening moat over time." },
            ].map(i => (
              <div key={i.t} className="mb-2.5 last:mb-0">
                <p className="font-semibold mb-0.5" style={{ fontSize: 13, color: C.dark }}>{i.t}</p>
                <p className="text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>{i.d}</p>
              </div>
            ))}
          </Card>

          <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: C.light }}>
            <p className="text-gray-400 uppercase tracking-widest mb-1.5" style={{ fontSize: 13 }}>Auction Design</p>
            <p className="font-bold text-center mb-1" style={{ fontSize: 13, color: C.dark }}>
              Ad Rank = Bid × Relevance × CTR × Creative Quality
            </p>
            <p className="text-gray-500 text-center leading-relaxed" style={{ fontSize: 13 }}>
              Modified second-price auction with quality scoring. Highest bidder doesn't always win — most relevant ad does.
            </p>
          </div>
        </div>
      )}

      {section === "risks" && (
        <div>
          {[
            { r: "Occasion Misclassification", impact: "Irrelevant ads degrade trust and ROAS", mit: "75% confidence threshold. HITL quality audits. DeBERTa classifier fine-tuned on verified labels.", sev: "Medium", color: C.orange },
            { r: "Consumer Ad Fatigue", impact: "Shoppers perceive occasion ads as surveillant", mit: "Limit 1 occasion ad per session. 'Why this ad?' transparency. Opt-out mechanism. A/B test sentiment pre-launch.", sev: "Medium", color: C.orange },
            { r: "Advertiser Adoption Friction", impact: "Brands resist new targeting paradigm", mit: "Launch as 'Occasion Boost' overlay on existing keyword campaigns. Subsidized CPM for 90 days. Pilot case studies.", sev: "Low", color: C.green },
            { r: "Non-Endemic Brand Safety", impact: "Betting/insurance ads may feel jarring in grocery", mit: "Strict occasion-category allowlists with retailer approval. Creative review. Category gates per retailer.", sev: "High", color: "#E53935" },
            { r: "Data Privacy / Regulatory", impact: "Basket-level inference triggers privacy scrutiny", mit: "Aggregated signals only — no PII leaves environment. Clean room for non-endemic partners. SOC 2 compliant.", sev: "Low", color: C.green },
            { r: "Keyword Cannibalization", impact: "Occasion ads redirect existing keyword spend", mit: "Separate auction pool. New placement type (additive, not replacement). Budget isolation between campaign types.", sev: "Low", color: C.green },
          ].map(risk => (
            <Card key={risk.r} className="p-3.5 mb-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <p className="font-bold" style={{ fontSize: 12, color: C.dark }}>{risk.r}</p>
                <span className="px-2 py-0.5 rounded-full text-white font-semibold" style={{ fontSize: 13, backgroundColor: risk.color }}>{risk.sev}</span>
              </div>
              <p className="text-gray-500 mb-2" style={{ fontSize: 13 }}><span className="font-semibold text-gray-700">Impact:</span> {risk.impact}</p>
              <div className="rounded-lg p-2.5 bg-gray-100">
                <p className="text-gray-400 uppercase tracking-widest mb-1" style={{ fontSize: 8 }}>Mitigation</p>
                <p className="text-gray-600 leading-relaxed" style={{ fontSize: 13 }}>{risk.mit}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {section === "rec" && (
        <div>
          <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: C.dark }}>
            <Sparkles size={14} style={{ color: C.orange }} className="mb-2" />
            <p className="text-white text-sm font-bold mb-1">Go-to-Market Recommendation</p>
            <p className="text-white leading-relaxed" style={{ fontSize: 13, opacity: 0.85 }}>
              Build occasion-based targeting as a premium tier within Carrot Ads. Launch with 6 core occasions and 3–5 pilot non-endemic advertisers. Leverage existing AI infrastructure — no new data collection required.
            </p>
          </div>

          <Card className="p-5 mb-4">
            <p className="text-gray-400 uppercase tracking-widest mb-2.5" style={{ fontSize: 13 }}>Launch Phasing</p>
            {[
              { phase: "Phase 1", time: "Q3 2026", title: "Pilot", items: "6 occasions, 20 endemic brands, Instacart marketplace only. Validate classification accuracy and ROAS lift." },
              { phase: "Phase 2", time: "Q4 2026", title: "Endemic Scale", items: "Open to all 9,000+ advertisers. Add Caper Cart + retailer site surfaces. Launch Occasion Boost overlay in Ads Manager." },
              { phase: "Phase 3", time: "Q1 2027", title: "Non-Endemic Launch", items: "3–5 pilot non-endemic partners (DraftKings, Haven Life, Peloton). Off-platform delivery via TikTok + TTD." },
              { phase: "Phase 4", time: "Q2 2027", title: "Full Scale", items: "Self-serve non-endemic onboarding. Expanded occasion taxonomy (12+ occasions). Data Hub clean room for agency partners." },
            ].map(p => (
              <div key={p.phase} className="flex gap-2.5 mb-3 last:mb-0">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0" style={{ fontSize: 13, backgroundColor: C.dark }}>
                    {p.phase.split(" ")[1]}
                  </div>
                  <div className="w-0.5 flex-1 mt-1 rounded-full bg-gray-200" />
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold" style={{ fontSize: 13, color: C.dark }}>{p.title}</span>
                    <span className="text-gray-400 font-medium" style={{ fontSize: 13 }}>{p.time}</span>
                  </div>
                  <p className="text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>{p.items}</p>
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-5 mb-4">
            <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Structural Advantages</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { t: "338.8M Orders", d: "Unmatched basket-level data across 1,800+ retailers." },
                { t: "Caper Cart", d: "In-store occasion detection at edge — no competitor has this." },
                { t: "LLM Pipeline", d: "DeBERTa teacher-student pattern ready for occasion inference." },
                { t: "RPM Infrastructure", d: "Off-platform delivery to TikTok, YouTube, TTD, Pinterest." },
                { t: "MRC Accredited", d: "Verified metrics across 240+ ecommerce sites." },
                { t: "Uber Eats", d: "Carrot Ads integration extends surface reach further." },
              ].map(a => (
                <div key={a.t} className="bg-gray-100 rounded-xl p-2.5">
                  <p className="font-semibold mb-0.5" style={{ fontSize: 13, color: C.dark }}>{a.t}</p>
                  <p className="text-gray-500 leading-relaxed" style={{ fontSize: 13 }}>{a.d}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 mb-4">
            <p className="text-gray-400 uppercase tracking-widest mb-2" style={{ fontSize: 13 }}>Competitive White Space</p>
            <p className="text-xs text-gray-800 leading-relaxed mb-2">
              No existing platform combines <strong>real-time basket occasion inference</strong> with <strong>closed-loop attribution</strong> and <strong>non-endemic advertiser access</strong>.
            </p>
            {[
              { co: "Amazon DSP", gap: "Retroactive segments, not real-time basket" },
              { co: "Kroger / 84.51°", gap: "Loyalty-based, no occasion inference" },
              { co: "Chicory", gap: "Recipe context, off-platform, no closed loop" },
              { co: "Grocery TV", gap: "Physical context only, no behavioral data" },
            ].map(c => (
              <div key={c.co} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                <span className="font-semibold" style={{ fontSize: 13, color: C.dark }}>{c.co}</span>
                <span className="text-gray-400" style={{ fontSize: 13 }}>— {c.gap}</span>
              </div>
            ))}
          </Card>

          <div className="text-center mt-4">
            <p className="text-gray-500" style={{ fontSize: 13 }}>Product concept by <strong>Charlie Bass</strong> · March 2026</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("engine");
  const tabs = [
    { k: "engine", l: "Engine", i: Zap },
    { k: "brand", l: "Brands", i: BarChart3 },
    { k: "consumer", l: "UX", i: Eye },
    { k: "econ", l: "Econ", i: TrendingUp },
    { k: "about", l: "About", i: Info },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ backgroundColor: C.dark }}>
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-3">
          <span className="text-white font-bold text-lg whitespace-nowrap tracking-tight">instacart</span>
          <div className="h-5" style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
          <div className="flex gap-1 flex-1 min-w-0">
            {tabs.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap"
                style={{
                  backgroundColor: tab === t.k ? "white" : "transparent",
                  color: tab === t.k ? C.dark : "rgba(255,255,255,0.55)",
                }}>
                <t.i size={14} />{t.l}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-5 py-6">
        {tab === "engine" && <EngineTab />}
        {tab === "brand" && <BrandTab />}
        {tab === "consumer" && <ConsumerTab />}
        {tab === "econ" && <EconomicsTab />}
        {tab === "about" && <AboutTab />}
      </div>
    </div>
  );
}
