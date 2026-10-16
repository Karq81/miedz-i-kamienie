// Maly sklep z magazynem. Produkty siedza w produkty.json, zeby dalo sie je
// zmieniac bez ruszania strony. Docelowo to samo pojdzie z bazy (Supabase)
// i Dmytro bedzie je dodawal sam z panelu w telefonie.

const NAZWY_KATEGORII = {
  wszystko: 'Wszystko',
  bransoleta: 'Bransolety',
  wisiorek: 'Wisiorki',
  naszyjnik: 'Naszyjniki',
  kolczyki: 'Kolczyki',
  pierscionek: 'Pierścionki',
  spinka: 'Spinki'
};

let magazyn = [];
let kategoria = 'wszystko';
let szukane = '';
const PORCJA = 8;      // tyle kart naraz - reszta po dotknieciu "Pokaz wiecej"
let ile = PORCJA;

const lista = document.getElementById('lista');
const filtry = document.getElementById('filtry');
const pole = document.getElementById('szukaj');
const podsumowanie = document.getElementById('podsumowanie');

/** Napis o stanie magazynu dla jednej pozycji. */
function stan(p) {
  if (p.ilosc <= 0) return { klasa: 'nie', napis: 'SPRZEDANE' };
  if (p.ilosc === 1) return { klasa: 'jest', napis: 'OSTATNIA SZTUKA' };
  return { klasa: 'jest', napis: p.ilosc + ' SZT.' };
}

function cena(p) {
  return p.cena > 0 ? p.cena + ' zł' : 'wycena';
}

function rysujKarte(p) {
  const s = stan(p);
  const zdjecie = p.zdjecie
    ? `<img src="${p.zdjecie}" alt="${p.nazwa}" loading="lazy">`
    : `<div class="brak-zdjecia">zdjęcie wkrótce</div>`;
  return `
    <div class="wyrob${p.ilosc <= 0 ? ' wyprzedany' : ''}" data-id="${p.id}">
      <div class="foto">${zdjecie}</div>
      <div class="tresc">
        <h3>${p.nazwa}</h3>
        <p class="kamien">${p.kamien}</p>
        <div class="dol"><span class="cena">${cena(p)}</span><span class="stan ${s.klasa}">${s.napis}</span></div>
      </div>
    </div>`;
}

function pasuje(p) {
  if (kategoria !== 'wszystko' && p.kategoria !== kategoria) return false;
  if (!szukane) return true;
  const t = (p.nazwa + ' ' + p.kamien).toLowerCase();
  return t.includes(szukane);
}

function rysuj() {
  const widoczne = magazyn.filter(pasuje);
  const porcja = widoczne.slice(0, ile);
  const reszta = widoczne.length - porcja.length;
  lista.innerHTML = widoczne.length
    ? porcja.map(rysujKarte).join('') +
      (reszta > 0 ? `<button class="wiecej" id="wiecej">Pokaż więcej (${reszta})</button>` : '')
    : '<p class="pusto">Nic takiego nie mam. Napisz — mogę zrobić na zamówienie.</p>';
  const wiecej = document.getElementById('wiecej');
  if (wiecej) wiecej.addEventListener('click', e => { e.stopPropagation(); ile += PORCJA; rysuj(); });

  const sztuk = magazyn.reduce((s, p) => s + Math.max(0, p.ilosc), 0);
  podsumowanie.textContent =
    `W magazynie ${sztuk} ${sztuk === 1 ? 'sztuka' : (sztuk % 10 >= 2 && sztuk % 10 <= 4 && (sztuk % 100 < 12 || sztuk % 100 > 14) ? 'sztuki' : 'sztuk')}` +
    (widoczne.length !== magazyn.length ? ` · pokazuję ${widoczne.length}` : '');

  lista.querySelectorAll('.wyrob').forEach(k =>
    k.addEventListener('click', () => pokazSzczegoly(k.dataset.id)));
}

function rysujFiltry() {
  const obecne = ['wszystko', ...new Set(magazyn.map(p => p.kategoria))];
  filtry.innerHTML = obecne.map(k =>
    `<button data-k="${k}"${k === kategoria ? ' class="akt"' : ''}>${NAZWY_KATEGORII[k] || k}</button>`
  ).join('');
  filtry.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    kategoria = b.dataset.k;
    ile = PORCJA;
    filtry.querySelectorAll('button').forEach(x => x.classList.toggle('akt', x === b));
    rysuj();
  }));
}

/* ------------------------------------------------------------------ szczegoly */

const okno = document.getElementById('okno');

function pokazSzczegoly(id) {
  const p = magazyn.find(x => x.id === id);
  if (!p) return;
  const s = stan(p);
  okno.querySelector('.tresc-okna').innerHTML = `
    ${p.zdjecie ? `<img class="duze" src="${p.zdjecie}" alt="${p.nazwa}">` : ''}
    <h3>${p.nazwa}</h3>
    <p class="kamien">${p.kamien}</p>
    <div class="dol"><span class="cena">${cena(p)}</span><span class="stan ${s.klasa}">${s.napis}</span></div>
    <p class="drobne">${p.ilosc > 0
      ? 'Napisz, a odłożę tę sztukę dla Ciebie. Rozmiar dopasuję.'
      : 'Ta sztuka jest sprzedana, ale mogę zrobić podobną — nigdy identyczną.'}</p>
    <button class="pytaj" data-id="${p.id}">
      ${p.ilosc > 0 ? 'Pytam o ten wyrób' : 'Chcę podobny'}
    </button>
    <p class="drobne" id="skopiowane"></p>`;
  okno.classList.add('widac');
  okno.querySelector('.pytaj').addEventListener('click', () => napisz(p));
}

/** Przygotowuje gotowa wiadomosc i otwiera Messengera. */
async function napisz(p) {
  const tekst = `Dzień dobry! Piszę w sprawie: ${p.nazwa} (${p.kamien}). ` +
    (p.ilosc > 0 ? 'Czy jest dostępna?' : 'Czy mógłbyś zrobić podobną?');
  const info = document.getElementById('skopiowane');
  try {
    await navigator.clipboard.writeText(tekst);
    info.textContent = 'Wiadomość skopiowana — wklej ją w Messengerze.';
  } catch (e) {
    info.textContent = 'Napisz: ' + tekst;
  }
  setTimeout(() => window.open('https://m.me/100078696184625', '_blank', 'noopener'), 400);
}

okno.addEventListener('click', e => {
  if (e.target === okno || e.target.classList.contains('zamknij')) okno.classList.remove('widac');
});
addEventListener('keydown', e => { if (e.key === 'Escape') okno.classList.remove('widac'); });

pole.addEventListener('input', () => { szukane = pole.value.trim().toLowerCase(); ile = PORCJA; rysuj(); });

/* ------------------------------------------------------------------ start */

fetch('produkty.json?v=' + Date.now())
  .then(o => o.json())
  .then(d => { magazyn = d.produkty || []; rysujFiltry(); rysuj(); })
  .catch(() => {
    lista.innerHTML = '<p class="pusto">Nie udało się wczytać wyrobów. Odśwież stronę.</p>';
  });
