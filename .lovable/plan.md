

# Val 2.5 — Strategic Layer (BizzOS-grade upgrade)

## Ce am identificat ca lipsă față de BizzOS Orchestrate

Am construit deja: CEO Cockpit, OKR/KPI Engine, Teams, CICLES, Tasks, Virtual CFO (schelet), Project Hub, Integrări (schelet), Reports.

Ce ne lipsește pentru a atinge nivelul "Orchestrate":

| Modul BizzOS | Status actual EduForYou OS | Acțiune |
|---|---|---|
| **Vivid VISION** (sistem strategic 3 ani) | ❌ lipsă | **adaugă** |
| **Value Tree / Profit Tree / KPI Tree** | ❌ lipsă (avem doar liste) | **adaugă** |
| **KPI cross-department** (corelații) | ⚠ parțial | **extinde** |
| **Scenario Engine AI** (simulări multiple) | ⚠ doar sliders simple | **extinde cu AI** |
| **AI Copilot decizional** (chat strategic) | ❌ lipsă | **adaugă** |
| **AI CFO Strategic** (analiză + recomandări) | ❌ doar tracking | **adaugă strat AI** |
| **EBITDA impact per KPI** | ❌ lipsă | **adaugă** |
| **Benchmarking industrie** | ❌ lipsă | **adaugă (manual now, API later)** |
| **Multi-entity / divizii** (holding view) | ⚠ ready, dar fără UI | **adaugă switcher** |
| **Accountability system** (cine răspunde de ce KPI) | ⚠ parțial | **extinde** |
| **Sales pipeline + forecast** | ❌ lipsă (vine din GHL) | **adaugă pagină dedicată** |
| **Profit per linie de business / per client** | ⚠ doar revenue per sursă | **extinde CFO** |

## Ce livrăm în Val 2.5

### 1. Vivid VISION Builder
Pagină dedicată `/vision` unde definești:
- **Vision pe 3 ani** (story narativ + metrici țintă)
- **Mission & Core values**
- **Big Hairy Audacious Goal** (BHAG)
- **Brand promise**
- Vizualizare timeline 3 ani cu milestones anuale → leagă automat de OKR-urile trimestriale

### 2. Strategy Trees (Value · Profit · KPI)
Componentă `TreeBuilder` reutilizabilă (drag & drop ierarhic):
- **Value Tree**: cum se creează valoare pentru client → leagă de KPI
- **Profit Tree**: revenue → cost → margin (descompunere vizuală pe linii business: B2C, Agent Hub, Partners SAAS, Webinar)
- **KPI Tree**: KPI companie → KPI departament → KPI individual (cascade vizuală)
- Salvate în tabel nou `strategy_trees` (jsonb pentru flexibilitate)

### 3. AI Copilot Decizional (Lovable AI)
Drawer global accesibil cu Cmd+K din orice pagină:
- Folosește **google/gemini-2.5-pro** prin Lovable AI Gateway (fără API key)
- Context: vede toate KPI, OKR, finance data ale companiei
- Întrebări tip: "De ce a scăzut conversia luna asta?", "Ce ar trebui să prioritizez?", "Generează un plan pentru Q1"
- Edge function `ai-copilot` cu RLS pe context (vede doar ce poate vedea user-ul)

### 4. AI CFO Strategic
Tab nou în `/cfo` → "AI Insights":
- Analizează automat P&L, cashflow, runway
- Generează **3 recomandări săptămânale** (ex: "Reduceți spend pe canal X cu 20%, ROAS scăzut")
- **Scenario Engine avansat**: descrii în limbaj natural ("Dacă angajez 3 oameni noi și cresc spend Meta cu 30%"), AI calculează impact pe runway/profit
- **EBITDA impact per KPI**: pentru fiecare KPI, AI estimează cât contribuie la EBITDA

### 5. Sales Pipeline & Forecast
Pagină nouă `/sales`:
- Pipeline Kanban (Lead → Qualified → Proposal → Won/Lost)
- Forecast vânzări (luna curentă + 3 luni)
- Funnel pe canale (organic, Meta, Google, GHL, partners)
- Tabel `deals` + `pipeline_stages` (manual now, sync din GHL în Val 3)

### 6. Multi-Entity Switcher
Top-bar adaugă selector de entitate (acum doar "EduForYou", dar pregătit pentru holding):
- Tabel nou `entities` (companii din holding)
- Toate datele filtrate pe `entity_id`
- "All entities" view pentru consolidare

### 7. Accountability Matrix
Pagină nouă `/accountability`:
- Matrice vizuală: KPI × Owner (cine răspunde de ce)
- Status per owner (on track / at risk / off track)
- Alertă automată dacă un KPI nu are owner

### 8. Benchmarking (manual seed)
Tab în `/reports`:
- Editor manual pentru benchmarks pe industrie (EdTech: avg CAC, LTV, churn, etc.)
- Comparație side-by-side cu metricile tale
- Pregătit pentru SimilarWeb sync în Val 3

## Tabele noi

```text
strategy_trees     (id, type [value|profit|kpi], data jsonb, entity_id)
vision             (id, story, mission, values jsonb, bhag, milestones jsonb, entity_id)
deals              (id, title, value, stage, owner_id, source, expected_close)
pipeline_stages    (id, name, position, probability)
entities           (id, name, slug, logo_url)
benchmarks         (id, metric, industry, value, source)
ai_insights        (id, type, content, generated_at, entity_id)
```

## Ordine de livrare (1 sesiune)

1. Multi-entity (fundație) + Vivid VISION
2. Strategy Trees (Value · Profit · KPI)
3. Sales Pipeline + Accountability Matrix
4. AI Copilot decizional (drawer global)
5. AI CFO Strategic + Scenario Engine
6. Benchmarking + finisaje

## Ce rămâne pentru Val 3 (neschimbat)
Integrări reale OAuth: Meta Ads, GA4, GTM, GHL, SimilarWeb. Acestea vor alimenta automat KPI Tree, Sales Pipeline și Benchmarking.

