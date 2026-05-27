import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const DIR = "/Users/francoisbracq/code/Shoelace23/ed-test";
const HTML_FILE = `${DIR}/notes_t3_detail.html`;

// ── Config (Gmail App Password) ───────────────────────────────────────────────
let config = {};
try {
  config = JSON.parse(readFileSync(`${DIR}/config.json`, "utf8"));
} catch {
  console.error("❌ config.json manquant — créez-le avec votre Gmail App Password.");
  process.exit(1);
}

// ── Élève cible (optionnel, sinon premier de la liste) ───────────────────────
const eleveId = process.env.ELEVE_ID ?? "";
const eleveLabel = process.env.ELEVE_NOM ?? "Rapport notes";

// ── 1. Régénérer le HTML ──────────────────────────────────────────────────────
console.log(`🔄 Génération du rapport T3${eleveLabel ? ` — ${eleveLabel}` : ""}...`);
execSync(`node ${DIR}/generate_notes_t3.js`, {
  stdio: "inherit",
  env: { ...process.env, ELEVE_ID: eleveId },
});
console.log("✅ HTML généré\n");

// ── 2. Screenshotter chaque card individuellement à 1080px ───────────────────
console.log("📸 Capture des cards...");
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

// 1080px → grille 2 colonnes : CSS grid étire les cards d'une même ligne à hauteur égale
await page.setViewport({ width: 1080, height: 900, deviceScaleFactor: 2 });
await page.goto(`file://${HTML_FILE}`, { waitUntil: "networkidle0" });
await new Promise(r => setTimeout(r, 2500));

const cards = await page.$$(".card");
console.log(`  ${cards.length} cards détectées`);

const screenshots = [];
for (let i = 0; i < cards.length; i++) {
  const buf = await cards[i].screenshot({ type: "png" });
  screenshots.push(buf);
  process.stdout.write(`  card ${i + 1}/${cards.length}\r`);
}
await browser.close();
console.log("\n✅ Screenshots OK\n");

// ── 3. Construire l'email HTML ────────────────────────────────────────────────
const attachments = screenshots.map((buf, i) => ({
  filename: `card_${i}.png`,
  content: buf,
  encoding: "binary",
  cid: `card_${i}@rapport`,
}));

// 2 colonnes desktop / 1 colonne mobile (media query)
const rows = [];
for (let i = 0; i < screenshots.length; i += 2) {
  const left  = `<img src="cid:card_${i}@rapport" width="100%" style="display:block;border-radius:10px;">`;
  const right = i + 1 < screenshots.length
    ? `<img src="cid:card_${i+1}@rapport" width="100%" style="display:block;border-radius:10px;">`
    : "";
  rows.push(`
    <tr>
      <td class="col" width="50%" style="padding:5px;vertical-align:top;">${left}</td>
      <td class="col" width="50%" style="padding:5px;vertical-align:top;">${right}</td>
    </tr>`);
}
const gridHtml = `<table width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join("")}</table>`;

const today = new Date().toLocaleDateString("fr-FR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

const htmlEmail = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  @media (max-width: 600px) {
    .col { display:block !important; width:100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f0f2f7;font-family:'Segoe UI',system-ui,sans-serif;">
  <div style="max-width:1100px;margin:0 auto;padding:24px 16px;">
    <h1 style="font-size:1.15rem;color:#222;margin:0 0 4px;">Notes Elsa BRACQ — Trimestre 3</h1>
    <p style="color:#888;font-size:0.82rem;margin:0 0 16px;text-transform:capitalize;">${today}</p>
    ${gridHtml}
    <p style="color:#bbb;font-size:0.75rem;text-align:center;margin-top:16px;">Rapport généré automatiquement depuis EcoleDirecte</p>
  </div>
</body>
</html>`;

// ── 4. Envoyer via Gmail SMTP ─────────────────────────────────────────────────
console.log("📧 Envoi de l'email...");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "francois.bracq@gmail.com",
    pass: config.gmailAppPassword,
  },
});

await transporter.sendMail({
  from: '"Rapport Elsa" <francois.bracq@gmail.com>',
  to: "francois.bracq@gmail.com",
  subject: `Petit update hebdo sur les notes${eleveLabel ? ` de ${eleveLabel}` : ""} — ${new Date().toLocaleDateString("fr-FR")}`,
  html: htmlEmail,
  attachments,
});

console.log("✅ Email envoyé à francois.bracq@gmail.com !");
