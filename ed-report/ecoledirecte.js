import { URLSearchParams } from "url";

const BASE_URL = "https://api.ecoledirecte.com";
const API_VERSION = "4.100.0";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36";

const BASE_HEADERS = {
  authority: "api.ecoledirecte.com",
  accept: "application/json, text/plain, */*",
  "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
  "content-type": "application/x-www-form-urlencoded",
  origin: "https://www.ecoledirecte.com",
  referer: "https://www.ecoledirecte.com/",
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-site",
  "user-agent": USER_AGENT,
};

export class EcoleDirecteClient {
  #token = null;
  #account = null;
  #accounts = [];
  #eleve = null;
  #gtkCookie = null;
  #cookieString = "";
  #page = null;          // Puppeteer page (mode navigateur)
  #mainAccountId = null; // id du compte principal (login direct)

  // ─── Helpers ───────────────────────────────────────────────────────────────

  #headers(extra = {}) {
    return {
      ...BASE_HEADERS,
      ...(this.#token ? { "x-token": this.#token } : {}),
      ...(this.#cookieString ? { Cookie: this.#cookieString } : {}),
      ...extra,
    };
  }

  async #request(path, { verbe = "get", params = {}, body = {} } = {}) {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("v", API_VERSION);
    if (verbe !== "post") url.searchParams.set("verbe", verbe);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const urlStr = url.toString();

    // ── Mode navigateur (Puppeteer) ──────────────────────────────────────────
    if (this.#page) {
      const token = this.#token;
      const payload = await this.#page.evaluate(async (u, tok, b) => {
        const res = await fetch(u, {
          method: "POST",
          headers: {
            "accept": "application/json, text/plain, */*",
            "content-type": "application/x-www-form-urlencoded",
            "x-token": tok,
          },
          body: "data=" + encodeURIComponent(JSON.stringify(b)),
        });
        return res.json();
      }, urlStr, token, body);

      if (![200, 201].includes(payload.code)) {
        throw new Error(`Erreur API ${payload.code}: ${payload.message}`);
      }
      if (payload.token) this.#token = payload.token;
      return payload.data;
    }

    // ── Mode direct (fetch Node.js) ──────────────────────────────────────────
    const res = await fetch(urlStr, {
      method: "POST",
      headers: this.#headers(),
      body: `data=${encodeURIComponent(JSON.stringify(body))}`,
    });

    const text = await res.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`Réponse non-JSON (${res.status}): ${text.slice(0, 200)}`);
    }

    if (![200, 201].includes(payload.code)) {
      throw new Error(`Erreur API ${payload.code}: ${payload.message}`);
    }
    if (payload.token) this.#token = payload.token;
    return payload.data;
  }

  // ─── Auth (mode navigateur Puppeteer) ─────────────────────────────────────

  async loginWithBrowser(puppeteerPage, username, password, { fa_cn, fa_cv } = {}) {
    this.#page = puppeteerPage;

    // Injecter les FA tokens avant le chargement de la page
    await puppeteerPage.evaluateOnNewDocument((cn, cv) => {
      if (cn && cv) localStorage.setItem("fa", JSON.stringify([{ cn, cv, uniq: false }]));
    }, fa_cn ?? "", fa_cv ?? "");

    await puppeteerPage.goto("https://www.ecoledirecte.com/login", { waitUntil: "networkidle0" });

    // Si FA pas encore chargés (page déjà chargée), les injecter maintenant
    if (fa_cn && fa_cv) {
      await puppeteerPage.evaluate((cn, cv) => {
        if (!localStorage.getItem("fa")) {
          localStorage.setItem("fa", JSON.stringify([{ cn, cv, uniq: false }]));
        }
      }, fa_cn, fa_cv);
    }

    await puppeteerPage.type('input[placeholder="Identifiant"]', username);
    await puppeteerPage.type('input[placeholder="Mot de passe"]', password);

    await Promise.all([
      puppeteerPage.click('button[type="submit"]'),
      puppeteerPage.waitForNavigation({ waitUntil: "networkidle0", timeout: 15000 }).catch(() => {}),
    ]);
    await new Promise(r => setTimeout(r, 2000));

    const currentUrl = puppeteerPage.url();
    if (!currentUrl.includes("/Famille") && !currentUrl.includes("/Accueil") && !currentUrl.includes("/eleve")) {
      throw new Error(`Login navigateur échoué — URL: ${currentUrl}`);
    }

    // Lire l'état de session
    const ss = await puppeteerPage.evaluate(() => {
      const r = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        r[k] = sessionStorage.getItem(k);
      }
      return r;
    });

    this.#token = JSON.parse(ss.credentials ?? "{}")?.payload?.authToken ?? null;
    const accountsRaw = JSON.parse(ss.accounts ?? "{}")?.payload?.accounts ?? [];
    this.#accounts = accountsRaw;
    this.#account = accountsRaw.find(a => a.main) ?? accountsRaw[0] ?? null;
    this.#mainAccountId = this.#account?.id ?? null;
    this.#eleve = this.#account?.profile?.eleves?.[0] ?? null;

    return this.#account;
  }

  async #switchBrowserAccount(targetAccountId) {
    if (!this.#page) throw new Error("Mode navigateur non initialisé");

    // Trouver le nom de l'établissement cible
    const targetAcc = this.#accounts.find(a => a.id === targetAccountId);
    const targetNom = targetAcc?.nomEtablissement ?? "";

    // Ouvrir le dialog "Changer de compte"
    await this.#page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll("button"))
        .find(b => b.textContent.includes("Changer de compte"));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 1500));

    // Cliquer le bouton correspondant à l'établissement cible
    const switched = await this.#page.evaluate((targetNom, targetId) => {
      const btns = Array.from(document.querySelectorAll("button"));
      const SKIP = ["Annuler", "Fermer", "Changer de compte", "Se déconnecter"];
      for (const btn of btns) {
        const txt = btn.textContent.trim();
        if (SKIP.some(s => txt.includes(s))) continue;
        if (txt.length < 5) continue;
        // Correspondance par nom d'établissement (partiel)
        const nom = targetNom.toLowerCase();
        if (nom && txt.toLowerCase().includes(nom.slice(0, 8))) {
          btn.click();
          return true;
        }
      }
      // Fallback : cliquer n'importe quel bouton de dialog hors compte courant
      const dlgBtns = Array.from(document.querySelectorAll("dialog button"))
        .filter(b => !SKIP.some(s => b.textContent.includes(s)) && b.textContent.trim().length > 5);
      if (dlgBtns.length > 0) { dlgBtns[0].click(); return true; }
      return false;
    }, targetNom, targetAccountId);

    if (!switched) throw new Error(`Impossible de switcher vers le compte ${targetAccountId} (${targetNom})`);

    await new Promise(r => setTimeout(r, 3000));

    // Mettre à jour le token depuis sessionStorage
    const newToken = await this.#page.evaluate(() => {
      return JSON.parse(sessionStorage.getItem("credentials") ?? "{}")?.payload?.authToken ?? null;
    });
    if (newToken) this.#token = newToken;
  }

  // ─── Auth (mode direct API) ────────────────────────────────────────────────

  async login(username, password, { fa = null } = {}) {
    // 1. Récupérer le cookie GTK (obligatoire depuis mars 2025)
    const gtkRes = await fetch(
      `${BASE_URL}/v3/login.awp?gtk=1&v=${API_VERSION}`,
      { headers: BASE_HEADERS }
    );
    const rawCookies = gtkRes.headers.getSetCookie();
    this.#cookieString = rawCookies.map((c) => c.split(";")[0]).join("; ");
    this.#gtkCookie = this.#cookieString.match(/GTK=([^;]+)/)?.[1] ?? "";

    // 2. Login (avec fa si déjà connu, pour bypasser le QCM)
    const loginData = { identifiant: username, motdepasse: password, isRelogin: false, uuid: "" };
    if (fa) loginData.fa = Array.isArray(fa) ? fa : [fa];

    const url = `${BASE_URL}/v3/login.awp?v=${API_VERSION}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...BASE_HEADERS,
        "X-Gtk": this.#gtkCookie,
        Cookie: this.#cookieString,
      },
      body: `data=${encodeURIComponent(JSON.stringify(loginData))}`,
    });

    const payload = await res.json();

    // 3. Double auth QCM si code 250 (fa absent ou expiré)
    if (payload.code === 250) {
      const twoFaToken = res.headers.get("2fa-token");
      await this.#handleQcm(username, password, twoFaToken);
      return this.#account;
    }

    if (![200, 201].includes(payload.code)) {
      throw new Error(`Login échoué ${payload.code}: ${payload.message}`);
    }

    this.#token = payload.token;
    const accounts = payload.data.accounts;
    this.#accounts = accounts;
    this.#account =
      accounts.find((a) => a.typeCompte === "E" && a.main) ?? accounts[0];
    this.#eleve = this.#account.profile?.eleves?.[0] ?? null;
    return this.#account;
  }

  async #handleQcm(username, password, twoFaToken) {
    // Récupère la question via 2FA-Token (pas X-Token)
    const qcmRes = await fetch(
      `${BASE_URL}/v3/connexion/doubleauth.awp?v=${API_VERSION}&verbe=get`,
      {
        method: "POST",
        headers: {
          ...BASE_HEADERS,
          "2FA-Token": twoFaToken,
        },
        body: `data=${encodeURIComponent(JSON.stringify({}))}`,
      }
    );
    const qcmPayload = await qcmRes.json();
    if (qcmPayload.code !== 200) {
      throw new Error(`QCM fetch échoué ${qcmPayload.code}: ${qcmPayload.message}`);
    }

    const rawPropositions = qcmPayload.data.propositions; // valeurs base64 brutes à renvoyer au serveur
    const question = Buffer.from(qcmPayload.data.question, "base64").toString("utf8");
    const propositions = rawPropositions.map((p) =>
      Buffer.from(p, "base64").toString("utf8")
    );

    throw new QcmRequiredError(question, propositions, async (choix) => {
      // Retrouver la proposition brute (base64) correspondant au texte choisi
      const idx = propositions.indexOf(choix);
      const rawChoix = idx >= 0 ? rawPropositions[idx] : Buffer.from(choix).toString("base64");

      // Soumettre la réponse -> récupérer cn/cv
      const answerRes = await fetch(
        `${BASE_URL}/v3/connexion/doubleauth.awp?v=${API_VERSION}&verbe=post`,
        {
          method: "POST",
          headers: {
            "User-Agent": USER_AGENT,
            "Content-Type": "application/x-www-form-urlencoded",
            "2FA-Token": twoFaToken,
          },
          body: `data=${encodeURIComponent(JSON.stringify({ choix: rawChoix }))}`,
        }
      );
      const answerPayload = await answerRes.json();
      if (answerPayload.code !== 200) {
        throw new Error(`QCM answer échoué ${answerPayload.code}: ${answerPayload.message}`);
      }
      const { cn, cv } = answerPayload.data;

      // Re-login avec fa array (nouveau GTK pour éviter expiration)
      const freshGtkRes = await fetch(
        `${BASE_URL}/v3/login.awp?gtk=1&v=${API_VERSION}`,
        { headers: BASE_HEADERS }
      );
      const freshCookies = freshGtkRes.headers.getSetCookie();
      const freshCookieString = freshCookies.map((c) => c.split(";")[0]).join("; ");
      const freshGtk = freshCookieString.match(/GTK=([^;]+)/)?.[1] ?? "";

      const loginRes = await fetch(`${BASE_URL}/v3/login.awp?v=${API_VERSION}`, {
        method: "POST",
        headers: {
          ...BASE_HEADERS,
          "X-Gtk": freshGtk,
          Cookie: freshCookieString,
        },
        body: `data=${encodeURIComponent(
          JSON.stringify({
            identifiant: username,
            motdepasse: password,
            isRelogin: false,
            uuid: "",
            fa: [{ cn, cv }],
          })
        )}`,
      });
      const loginPayload = await loginRes.json();
      if (![200, 201].includes(loginPayload.code)) {
        throw new Error(`Re-login échoué ${loginPayload.code}: ${loginPayload.message}`);
      }
      this.#token = loginPayload.token;
      const accounts = loginPayload.data.accounts;
      this.#accounts = accounts;
      this.#account =
        accounts.find((a) => a.typeCompte === "E" && a.main) ?? accounts[0];
      this.#eleve = this.#account.profile?.eleves?.[0] ?? null;
      return { cn, cv }; // à stocker pour les prochains logins
    });
  }

  get account() {
    return this.#account;
  }

  get accounts() {
    return this.#accounts;
  }

  get #id() {
    return this.#eleve?.id ?? this.#account.id;
  }

  get eleves() {
    return this.#accounts.flatMap((a) => a.profile?.eleves ?? []);
  }

  selectEleve(id) {
    const eleve = this.eleves.find((e) => e.id === id);
    if (!eleve) throw new Error(`Élève ${id} introuvable`);
    this.#eleve = eleve;
    this.#account = this.#accounts.find((a) =>
      a.profile?.eleves?.some((e) => e.id === id)
    ) ?? this.#account;
  }

  // Version async — nécessaire en mode navigateur (switch de compte)
  async selectEleveAsync(id) {
    const eleve = this.eleves.find((e) => e.id === id);
    if (!eleve) throw new Error(`Élève ${id} introuvable`);

    const targetAccount = this.#accounts.find((a) =>
      a.profile?.eleves?.some((e) => e.id === id)
    ) ?? this.#account;

    // Si le compte cible est différent et qu'on est en mode navigateur → switch
    if (this.#page && targetAccount?.id !== this.#mainAccountId && targetAccount?.id !== this.#account?.id) {
      await this.#switchBrowserAccount(targetAccount.id);
    }

    this.#eleve = eleve;
    this.#account = targetAccount;
  }

  // ─── Élève ─────────────────────────────────────────────────────────────────

  async getNotes(annee) {
    return this.#request(`/v3/eleves/${this.#id}/notes.awp`, {
      params: annee ? { anneeScolaire: annee } : {},
      body: {},
    });
  }

  async getEmploiDuTemps(dateDebut, dateFin) {
    return this.#request(`/v3/E/${this.#id}/emploidutemps.awp`, {
      body: { dateDebut, dateFin, avecTrous: false },
    });
  }

  async getCahierDeTexte(dateDebut, dateFin) {
    return this.#request(`/v3/Eleves/${this.#id}/cahierdetexte.awp`, {
      body: { dateDebut, dateFin },
    });
  }

  async getDevoir(idDevoir) {
    return this.#request(`/v3/Eleves/${this.#id}/cahierdetexte/${idDevoir}.awp`, {
      verbe: "post",
      body: {},
    });
  }

  async debugFetch(path, body = {}) {
    const url = new URL(`${BASE_URL}${path}`);
    url.searchParams.set("v", API_VERSION);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: this.#headers(),
      body: `data=${encodeURIComponent(JSON.stringify(body))}`,
    });
    return { status: res.status, body: await res.text() };
  }

  async getVieScolaire() {
    return this.#request(`/v3/eleves/${this.#id}/viescolaire.awp`, {
      body: {},
    });
  }

  async getTimeline() {
    return this.#request(`/v3/eleves/${this.#id}/timeline.awp`, { body: {} });
  }

  async getMessages(annee) {
    return this.#request(`/v3/eleves/${this.#id}/messages.awp`, {
      params: { verbe: "get", mode: "destinataire" },
      body: { anneeMessages: annee },
    });
  }

  async getDocumentsAdmin() {
    return this.#request(`/v3/eleves/${this.#id}/documents.awp`, {
      body: {},
    });
  }

  async getCloud(path = "") {
    return this.#request(`/v3/eleves/${this.#id}/cloud/hdcloud.awp`, {
      body: { path },
    });
  }
}

// Erreur spéciale pour le QCM — l'appelant doit présenter les choix à l'utilisateur
export class QcmRequiredError extends Error {
  constructor(question, propositions, resolve) {
    super("Double authentification requise (QCM)");
    this.question = question;
    this.propositions = propositions;
    this.resolve = resolve; // async (choixString) => void
  }
}
