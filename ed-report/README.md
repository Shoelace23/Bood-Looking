# ED Report — Rapport hebdomadaire EcoleDirecte

Génère et envoie par email un rapport visuel des notes trimestrielles d'un élève EcoleDirecte.

## Fichiers

| Fichier | Rôle |
|---|---|
| `ecoledirecte.js` | Client API EcoleDirecte (auth GTK, QCM/FA, multi-comptes via Puppeteer) |
| `generate_notes_t3.js` | Génère `notes_t3_detail.html` — cards Chart.js par matière |
| `send_report.js` | Pipeline complet : génération HTML → screenshots Puppeteer → email Gmail SMTP |

## Configuration

Créer `.env` :
```
ED_USERNAME=fbracq
ED_PASSWORD=xxxxxx
ED_FA_CN=ED_UExV...
ED_FA_CV=NmQ2Mz...
```

Créer `config.json` :
```json
{ "gmailAppPassword": "xxxx xxxx xxxx xxxx" }
```

## Usage

```bash
# Rapport Elsa (compte principal)
node send_report.js

# Rapport Chloé (compte secondaire → Puppeteer auto)
ELEVE_ID=3469 ELEVE_NOM="Chloé" node send_report.js
```

## Crontab (vendredi 15h)

```cron
0  15 * * 5 node /path/send_report.js >> send_report.log 2>&1
20 15 * * 5 ELEVE_ID=3469 ELEVE_NOM="Chloé" node /path/send_report.js >> send_report_chloe.log 2>&1
```

## Architecture multi-comptes

EcoleDirecte crée un compte parent par établissement. Le token du compte principal
ne peut pas accéder aux élèves des comptes secondaires (protection anti-bot via
TransparentEdge / `renewtoken.awp`).

**Solution :** détection automatique du compte secondaire → bascule Puppeteer
(vrai navigateur, obtient les bons cookies, déclenche `renewtoken.awp`).
