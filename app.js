/* ===== каталог: правь цены и описания здесь ===== */
const PRODUCTS = [
  { id: "plugin",  name: "Плагин под заказ",        price: 3000, desc: "Bukkit / Spigot / Paper. Любая механика: кастомные команды, GUI, экономика, ивенты. Версии 1.5.2 - 1.21." },
  { id: "mod",     name: "Мод под заказ",           price: 5000, desc: "Forge / Fabric. Новые блоки, предметы, механики, интеграции. Клиент и сервер." },
  { id: "optim",   name: "Оптимизация сервера",     price: 2500, desc: "Профилирование и ускорение: плагины, моды, ядро, конфиги. TPS вверх, лаги вниз." },
  { id: "bugfix",  name: "Фикс багов и крашей",     price: 1500, desc: "Разбор логов, дебаг, исправление ошибок в ядрах, плагинах и модах." },
  { id: "rework",  name: "Доработка готового кода", price: 2000, desc: "Допилю чужой плагин или мод: новые фичи, обновление на новую версию, рефакторинг." },
  { id: "consult", name: "Консультация / аудит",    price: 1000, desc: "Разбор проекта, ревью кода, советы по архитектуре и анти-лагам. Созвон или чат." },
];

const TG_URL = "https://t.me/davidich444";
const LS_KEY = "zstd-cart";

/* ===== state ===== */
let cart = {}; // id -> qty
try { cart = JSON.parse(localStorage.getItem(LS_KEY) || "{}") || {}; } catch (e) { cart = {}; }

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString("ru-RU") + " ₽";

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cart)); } catch (e) {}
}

/* ===== catalog ===== */
function renderCatalog() {
  const grid = $("productGrid");
  grid.innerHTML = "";
  PRODUCTS.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-id">[${String(i + 1).padStart(2, "0")}]</div>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="card-foot">
        <span class="card-price">от ${fmt(p.price)}</span>
        <button class="btn" data-add="${p.id}">в корзину</button>
      </div>`;
    grid.appendChild(card);
  });
  grid.addEventListener("click", (e) => {
    const id = e.target && e.target.getAttribute && e.target.getAttribute("data-add");
    if (!id) return;
    cart[id] = (cart[id] || 0) + 1;
    save();
    renderCart();
    toast("добавлено в корзину");
  });
  updateAddButtons();
}

function updateAddButtons() {
  document.querySelectorAll("[data-add]").forEach((b) => {
    const inCart = !!cart[b.getAttribute("data-add")];
    b.classList.toggle("in-cart", inCart);
    b.textContent = inCart ? "в корзине" : "в корзину";
  });
}

/* ===== cart ===== */
function cartEntries() {
  return Object.entries(cart)
    .map(([id, qty]) => ({ p: PRODUCTS.find((x) => x.id === id), qty }))
    .filter((e) => e.p && e.qty > 0);
}

function renderCart() {
  const items = $("cartItems");
  const entries = cartEntries();
  items.innerHTML = "";

  if (!entries.length) {
    items.innerHTML = `<div class="cart-empty">корзина пуста<br>// добавь что-нибудь из каталога</div>`;
  }

  let total = 0;
  entries.forEach(({ p, qty }) => {
    total += p.price * qty;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <span class="cart-item-name">${p.name}</span>
      <span class="qty">
        <button data-dec="${p.id}">-</button>${qty}<button data-inc="${p.id}">+</button>
      </span>
      <span class="cart-item-price">от ${fmt(p.price * qty)}</span>`;
    items.appendChild(row);
  });

  $("cartTotal").textContent = "от " + fmt(total);
  const count = entries.reduce((s, e) => s + e.qty, 0);
  $("cartCount").textContent = count;
  updateAddButtons();
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (!t || !t.getAttribute) return;
  const inc = t.getAttribute("data-inc");
  const dec = t.getAttribute("data-dec");
  if (inc) { cart[inc] = (cart[inc] || 0) + 1; save(); renderCart(); }
  if (dec) {
    cart[dec] = (cart[dec] || 0) - 1;
    if (cart[dec] <= 0) delete cart[dec];
    save(); renderCart();
  }
});

/* ===== drawer ===== */
function openCart(open) {
  $("cart").hidden = !open;
  $("overlay").hidden = !open;
  document.body.style.overflow = open ? "hidden" : "";
}
$("cartBtn").addEventListener("click", () => openCart(true));
$("cartClose").addEventListener("click", () => openCart(false));
$("overlay").addEventListener("click", () => openCart(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") openCart(false); });

/* ===== checkout ===== */
function buildOrderText() {
  const entries = cartEntries();
  const lines = ["Заказ с zstd-dev.github.io:", ""];
  let total = 0;
  entries.forEach(({ p, qty }) => {
    total += p.price * qty;
    lines.push(`- ${p.name} x${qty} (от ${fmt(p.price * qty)})`);
  });
  lines.push("", `Итого: от ${fmt(total)}`);
  const nick = $("buyerNick").value.trim();
  const note = $("buyerNote").value.trim();
  if (nick) lines.push(`Ник: ${nick}`);
  if (note) lines.push(`Задача: ${note}`);
  return lines.join("\n");
}

$("checkoutBtn").addEventListener("click", async () => {
  if (!cartEntries().length) { toast("корзина пуста"); return; }
  const text = buildOrderText();
  let copied = false;
  try { await navigator.clipboard.writeText(text); copied = true; } catch (e) {}
  if (copied) {
    toast("заявка скопирована, вставь её в чат");
  } else {
    $("checkoutHint").textContent = "скопируй заявку вручную: " + text;
  }
  window.open(TG_URL, "_blank", "noopener");
});

/* ===== toast ===== */
let toastTimer;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

/* ===== init ===== */
renderCatalog();
renderCart();
