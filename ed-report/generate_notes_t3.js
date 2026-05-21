import { EcoleDirecteClient } from "./ecoledirecte.js";
import { writeFileSync } from "fs";
import puppeteer from "puppeteer";
import "dotenv/config";

const client = new EcoleDirecteClient();

// ── Tentative login direct (API) ──────────────────────────────────────────────
let browser = null;
try {
  await client.login(process.env.ED_USERNAME, process.env.ED_PASSWORD, {
    fa: { cn: process.env.ED_FA_CN, cv: process.env.ED_FA_CV },
  });
} catch (e) {
  console.warn("Login direct échoué, passage en mode navigateur:", e.message);
}

// ── Sélection de l'élève ─────────────────────────────────────────────────────
const targetId = process.env.ELEVE_ID ? parseInt(process.env.ELEVE_ID) : client.eleves[0]?.id;
if (!targetId) throw new Error("Aucun élève trouvé");

// Détecter si cet élève est sur un compte secondaire (nécessite mode navigateur)
const targetAccount = client.accounts.find(a => a.profile?.eleves?.some(e => e.id === targetId));
const mainAccount   = client.accounts.find(a => a.main) ?? client.accounts[0];
const needsBrowser  = targetAccount && targetAccount.id !== mainAccount?.id;

if (needsBrowser) {
  console.log("Compte secondaire détecté → mode navigateur Puppeteer");
  browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await client.loginWithBrowser(page, process.env.ED_USERNAME, process.env.ED_PASSWORD, {
    fa_cn: process.env.ED_FA_CN,
    fa_cv: process.env.ED_FA_CV,
  });
  await client.selectEleveAsync(targetId);
} else {
  client.selectEleve(targetId);
}

const eleveInfo = client.eleves.find(e => e.id === targetId);
const eleveName  = `${eleveInfo.prenom} ${eleveInfo.nom}`;
const eleveClasse = eleveInfo.classe?.libelle ?? "";
console.log(`Élève : ${eleveName} · ${eleveClasse}`);

const { notes, periodes } = await client.getNotes();

// ── Cahier de texte : interrogations à venir ──────────────────────────────────
const today = new Date().toISOString().slice(0, 10);
let cdt = {};
try {
  cdt = await client.getCahierDeTexte(today, "2026-07-15");
} catch (e) {
  console.warn("CDT non disponible:", e.message);
}

const toF = s => s !== null && s !== undefined && s !== "" && s !== "~"
  ? parseFloat(s.toString().replace(",", "."))
  : null;

const sur20 = (v, s) => {
  const vf = toF(v), sf = toF(s) || 20;
  return vf === null || isNaN(vf) ? null : Math.round(vf / sf * 2000) / 100;
};

// ── Index code → libellé matière (dynamique, tout élève) ─────────────────────
// Source 1 : bulletins T1/T2 → noms parents officiels (champ "discipline", sans sous-matières)
const libelleByCode = {};
for (const p of periodes) {
  for (const d of p.ensembleMatieres?.disciplines ?? []) {
    if (d.codeMatiere && d.discipline && !d.sousMatiere && !d.groupeMatiere) {
      libelleByCode[d.codeMatiere] = d.discipline;
    }
  }
}
// Source 2 : notes individuelles (fallback si bulletin absent, ex. T3 en cours)
for (const n of notes) {
  if (n.codeMatiere && n.libelleMatiere && !libelleByCode[n.codeMatiere]) {
    libelleByCode[n.codeMatiere] = n.libelleMatiere;
  }
}

// ── Récolter les interrogations à venir (codeMatiere direct depuis le CDT) ────
const upcomingByCode = {};
for (const [date, devoirs] of Object.entries(cdt)) {
  if (date < today) continue;
  for (const d of devoirs) {
    if (!d.interrogation) continue;
    const code = d.codeMatiere;
    if (!code) continue;
    if (!upcomingByCode[code]) upcomingByCode[code] = [];
    upcomingByCode[code].push({ date, devoir: "Interrogation" });
  }
}
console.log("Interrogations à venir:", JSON.stringify(upcomingByCode, null, 2));

// ── Notes T3 valides avec min/moy/max classe ──────────────────────────────────
const notesT3 = notes
  .filter(n =>
    n.codePeriode === "A003" &&
    n.valeur && n.valeur !== "~" && !n.nonSignificatif
  )
  .map(n => {
    const s = toF(n.noteSur) || 20;
    return {
      code: n.codeMatiere,
      matiere: libelleByCode[n.codeMatiere] ?? n.libelleMatiere,
      date: n.date,
      devoir: n.devoir,
      type: n.typeDevoir,
      noteSur: s,
      elsa: sur20(n.valeur, s),
      cls:  sur20(n.moyenneClasse, s),
      min:  sur20(n.minClasse, s),
      max:  sur20(n.maxClasse, s),
      raw: `${n.valeur}/${s}`,
      upcoming: false,
    };
  })
  .filter(n => n.elsa !== null);

// ── Grouper par matière (code) ────────────────────────────────────────────────
const byMat = {};
for (const n of notesT3) {
  if (!byMat[n.code]) byMat[n.code] = { matiere: n.matiere, items: [] };
  byMat[n.code].items.push(n);
}

// Injecter les upcoming (crée la carte si la matière n'a pas encore de notes T3)
for (const [code, exams] of Object.entries(upcomingByCode)) {
  const matiere = libelleByCode[code] ?? code;
  if (!byMat[code]) byMat[code] = { matiere, items: [] };
  for (const ex of exams) {
    const dev = ex.devoir.length > 22 ? ex.devoir.slice(0, 21) + "…" : ex.devoir;
    byMat[code].items.push({
      code, matiere,
      date: ex.date,
      devoir: dev,
      type: "Interrogation",
      noteSur: 20,
      elsa: 10,   // placeholder centré
      cls: null,  // inconnu → pas de trait
      min: 0,
      max: 20,
      raw: "? / 20",
      upcoming: true,
    });
  }
}

// ── Fenêtre "nouvelle note" : 7 derniers jours ───────────────────────────────
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);

// ── Ordre : prio 1 = examen à venir · prio 2 = nouvelle note · prio 3 = autres
// Au sein de chaque groupe : moyenne Elsa décroissante
const matOrder = Object.entries(byMat).sort((a, b) => {
  const real = items => items.filter(n => !n.upcoming);
  const avg  = items => items.length ? items.reduce((s, n) => s + n.elsa, 0) / items.length : 10;

  const prioA = a[1].items.some(n => n.upcoming) ? 0
    : real(a[1].items).some(n => n.date >= sevenDaysAgo) ? 1
    : 2;
  const prioB = b[1].items.some(n => n.upcoming) ? 0
    : real(b[1].items).some(n => n.date >= sevenDaysAgo) ? 1
    : 2;

  if (prioA !== prioB) return prioA - prioB;
  return avg(real(b[1].items)) - avg(real(a[1].items));
});

// ── Sérialiser chaque matière ─────────────────────────────────────────────────
const chartsData = matOrder.map(([, { matiere, items }]) => {
  // Notes réelles triées par date, puis upcoming triés par date
  const sorted = [
    ...items.filter(n => !n.upcoming).sort((a, b) => a.date.localeCompare(b.date)),
    ...items.filter(n =>  n.upcoming).sort((a, b) => a.date.localeCompare(b.date)),
  ];
  return {
    matiere,
    n: sorted.length,
    labels: sorted.map(n => {
      const d = n.date.slice(5).replace("-", "/");
      if (n.upcoming) {
        const dev = n.devoir.length > 16 ? n.devoir.slice(0, 15) + "…" : n.devoir;
        return `${d} · ${dev} ★`;
      }
      const dev = n.devoir.length > 22 ? n.devoir.slice(0, 21) + "…" : n.devoir;
      return `${d} · ${dev}`;
    }),
    elsa:     sorted.map(n => n.elsa),
    cls:      sorted.map(n => n.cls),
    min:      sorted.map(n => n.min),
    max:      sorted.map(n => n.max),
    raw:      sorted.map(n => n.raw),
    type:     sorted.map(n => n.type),
    upcoming:     sorted.map(n => n.upcoming),
    dates:        sorted.map(n => n.date),
    newNoteCount: sorted.filter(n => !n.upcoming && n.date >= sevenDaysAgo).length,
  };
});

console.log(`\n${notesT3.length} notes T3 · ${Object.keys(upcomingByCode).length} matière(s) avec examen à venir`);
matOrder.forEach(([, { matiere, items }]) => {
  const nUp = items.filter(n => n.upcoming).length;
  console.log(`  ${matiere.padEnd(18)} ${items.filter(n => !n.upcoming).length} notes${nUp ? ` + ${nUp} examen(s) à venir` : ""}`);
});

// ── HTML ──────────────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Notes T3 par matière — ${eleveName}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"><\/script>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f0f2f7; padding: 24px; color: #222; }
  h1 { font-size: 1.3rem; font-weight: 700; margin-bottom: 4px; }
  .sub { color: #666; font-size: 0.85rem; margin-bottom: 20px; }
  .legend { display: flex; gap: 18px; margin-bottom: 20px; font-size: 0.8rem; color: #555; flex-wrap: wrap; align-items: center; }
  .li { display: flex; align-items: center; gap: 6px; }
  .box-g  { width:14px; height:12px; background:rgba(76,175,100,.28); border:1.5px solid rgba(76,175,100,.9); }
  .box-r  { width:14px; height:12px; background:rgba(229,115,115,.28); border:1.5px solid rgba(220,90,90,.9); }
  .box-up { width:14px; height:12px; background:rgba(120,140,255,.18); border:1.5px dashed rgba(100,120,220,.7); border-radius:2px; }
  .dot    { width:10px; height:10px; border-radius:50%; background:#f5a623; border:1.5px solid #c97a08; }
  .line   { width:3px; height:14px; }
  .line-g { background: rgba(46,125,50,.9); }
  .line-r { background: rgba(183,28,28,.9); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr)); gap: 16px; }
  .card { background: #fff; border-radius: 12px; padding: 18px; border: 1px solid #e0e0e0; box-shadow: 0 1px 6px rgba(0,0,0,.06); }
  .card.has-upcoming { border: 4px solid rgba(100,120,220,0.7); box-shadow: 0 2px 12px rgba(100,120,220,0.18); }
  .badge-upcoming  { background: #6478dc; color: #fff !important; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; font-weight: 500; }
  .badge-new-note  { background: #e07b2a; color: #fff !important; border-radius: 6px; padding: 2px 8px; font-size: 0.75rem; font-weight: 500; }
  .card h2 { font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: #333; display:flex; justify-content:space-between; }
  .card h2 span { font-weight:400; color:#999; font-size:0.8rem; }
  .wrap { position: relative; }
</style>
</head>
<body>

<h1>Notes individuelles T3 — ${eleveName} · ${eleveClasse}</h1>
<p class="sub">Trimestre 3 (en cours)</p>

<div class="legend">
  <div class="li"><div class="dot"></div> Note de l'élève</div>
  <div class="li"><div class="line line-g"></div> Moyenne classe</div>
  <div class="li" style="gap:6px;align-items:center;">Min <div class="box-g"></div> Max</div>
</div>

<div class="grid" id="grid"></div>

<script>
const chartsData = ${JSON.stringify(chartsData)};
const elevePrenom = ${JSON.stringify(eleveInfo.prenom)};

function buildChart(container, d) {
  // Plugin défini dans buildChart → capture d par closure (pas de opts.d nécessaire)
  const upIdx = d.upcoming.map((u, i) => u ? i : -1).filter(i => i >= 0);
  const upcomingPlugin = {
    id: 'upcomingMark',
    afterDatasetsDraw(chart) {
      if (!upIdx.length) return;
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(2); // dataset 2 = points Elsa
      upIdx.forEach(i => {
        const pt = meta.data[i];
        if (!pt) return;
        ctx.save();
        ctx.font = 'bold 10px Segoe UI, sans-serif';
        ctx.fillStyle = '#5c3d00';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', pt.x, pt.y);
        ctx.restore();
      });
    }
  };

  const colFill   = d.elsa.map((v, i) =>
    d.upcoming[i]      ? 'rgba(120,140,255,0.14)' :
    d.cls[i] === null  ? 'rgba(150,150,150,0.15)' :   // pas de stats classe → neutre
    v >= d.cls[i]      ? 'rgba(76,175,100,0.22)'  : 'rgba(229,115,115,0.22)');
  const colBorder = d.elsa.map((v, i) =>
    d.upcoming[i]      ? 'rgba(100,120,220,0.6)'  :
    d.cls[i] === null  ? 'rgba(150,150,150,0.5)'  :   // pas de stats classe → neutre
    v >= d.cls[i]      ? 'rgba(76,175,100,0.85)'  : 'rgba(220,90,90,0.85)');

  // Scatter cls : on exclut les null (upcoming) et on aligne les couleurs
  const clsPts  = d.cls.map((v, i) => ({ v, i })).filter(p => p.v !== null);
  const clsData = clsPts.map(({ v, i }) => ({ x: v, y: d.labels[i] }));
  const clsColors = clsPts.map(({ v, i }) =>
    d.elsa[i] >= v ? 'rgba(46,125,50,0.95)' : 'rgba(183,28,28,0.95)');

  const h = Math.max(140, d.n * 38 + 40);
  container.style.height = h + 'px';

  new Chart(container, {
    type: 'bar',
    data: {
      labels: d.labels,
      datasets: [
        {
          // Boîte min → max
          type: 'bar',
          data: d.min.map((mn, i) => (mn !== null && d.max[i] !== null) ? [mn, d.max[i]] : null),
          backgroundColor: colFill,
          borderColor: colBorder,
          borderWidth: 1.5,
          borderRadius: 3,
          borderSkipped: false,
          barPercentage: 0.55,
          order: 3,
        },
        {
          // Trait vertical moyenne classe (upcoming exclus)
          type: 'scatter',
          data: clsData,
          pointStyle: 'line',
          pointRadius: 14,
          pointBorderWidth: 2.5,
          pointBorderColor: clsColors,
          rotation: 90,
          order: 2,
        },
        {
          // Point Elsa (orange, avec "?" pour upcoming via plugin)
          type: 'scatter',
          data: d.elsa.map((v, i) => ({ x: v, y: d.labels[i] })),
          backgroundColor: '#f5a623',
          borderColor: '#c97a08',
          borderWidth: 1.5,
          pointRadius: 7,
          pointHoverRadius: 10,
          order: 1,
        },
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(20,20,30,0.92)',
          titleColor: '#fff',
          bodyColor: '#ccc',
          padding: 10,
          filter: ctx => ctx.datasetIndex === 0,
          callbacks: {
            title: ctx => d.labels[ctx[0].dataIndex],
            label: ctx => {
              const i = ctx[0].dataIndex;
              if (d.upcoming[i]) {
                return [
                  \`  Examen à venir — résultat inconnu\`,
                  \`  Étendue estimée : 0 → 20\`,
                  \`  Type : \${d.type[i]}\`,
                ];
              }
              const lines = [
                \`  Note \${elevePrenom} : \${d.raw[i]} → \${d.elsa[i].toFixed(1)}/20\`,
              ];
              if (d.cls[i] !== null) {
                const ecart = (d.elsa[i] - d.cls[i]).toFixed(2);
                const sign = parseFloat(ecart) >= 0 ? '+' : '';
                lines.push(\`  Moy classe : \${d.cls[i].toFixed(1)}/20  (\${sign}\${ecart})\`);
              }
              if (d.min[i] !== null) lines.push(\`  Min classe : \${d.min[i].toFixed(1)}/20\`);
              if (d.max[i] !== null) lines.push(\`  Max classe : \${d.max[i].toFixed(1)}/20\`);
              lines.push(\`  Type : \${d.type[i]}\`);
              return lines;
            }
          }
        },
      },
      scales: {
        x: {
          min: 0, max: 20,
          ticks: { stepSize: 4, color: '#999', font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
        y: {
          ticks: { color: '#555', font: { size: 10 } },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
      },
    },
    plugins: [upcomingPlugin],
  });
}

const grid = document.getElementById('grid');
for (const d of chartsData) {
  const card = document.createElement('div');
  const nUp    = d.upcoming.filter(Boolean).length;
  const nReal  = d.elsa.filter((_, i) => !d.upcoming[i]).length;
  const nWithCls = d.elsa.filter((v, i) => !d.upcoming[i] && d.cls[i] !== null).length;
  const nAbove   = d.elsa.filter((v, i) => !d.upcoming[i] && d.cls[i] !== null && v >= d.cls[i]).length;
  card.className = nUp ? 'card has-upcoming' : 'card';
  const upBadge  = nUp > 0
    ? \` · <span class="badge-upcoming">\${nUp} examen\${nUp>1?'s':''} à venir</span>\`
    : '';
  const newBadge = d.newNoteCount > 0
    ? \` · <span class="badge-new-note">\${d.newNoteCount} nouvelle\${d.newNoteCount>1?'s':''} note\${d.newNoteCount>1?'s':''}</span>\`
    : '';
  // N'afficher "X/Y au-dessus" que si les stats classe sont disponibles
  const aboveStr = nWithCls > 0
    ? \`\${nAbove}/\${nWithCls} au-dessus\`
    : \`\${nReal} note\${nReal > 1 ? 's' : ''}\`;
  card.innerHTML = \`<h2>\${d.matiere}\${upBadge}\${newBadge} <span>\${aboveStr}</span></h2><div class="wrap"></div>\`;
  grid.appendChild(card);
  const canvas = document.createElement('canvas');
  card.querySelector('.wrap').appendChild(canvas);
  buildChart(canvas, d);
}
<\/script>
</body>
</html>`;

writeFileSync("/Users/francoisbracq/code/Shoelace23/ed-test/notes_t3_detail.html", html, "utf8");
console.log("✅ notes_t3_detail.html généré");

if (browser) await browser.close();
