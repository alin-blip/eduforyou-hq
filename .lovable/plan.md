

# Plan: Sync complet din pipeline-ul "Leads (Master Pipeline)" GHL

## Ce e greșit acum

Edge function-ul `ghl-sync-leads` actual:
- Trage **doar 200 contacte** (2 pagini × 100), nu toate cele 12.133 oportunități.
- Trage **doar 100 oportunități** fără filtru de pipeline → poate fi orice pipeline, nu "Leads (Master Pipeline)".
- E centrat pe **contacte → upsert ghl_leads**, nu pe **oportunități** (care sunt entitatea cheie în GHL pentru fluxul tău Necontactat → Înscris).
- N-are paginare reală pe oportunități, n-are filtru pe pipeline-ul Master, n-are progress/log per batch.

Tu ai nevoie de **fiecare oportunitate** din pipeline-ul Master, cu stage-ul curent (Necontactat / Nu Răspunde x1/x2 / În Discuții / Consent Form / Înscris etc.), ca să poți construi scoreboard-uri reale (Cristi, Andrei, Florentina, Petea).

## Ce construim

### 1. Refactor edge function `ghl-sync-leads`
- **Identifică automat pipeline-ul Master** după nume (case-insensitive match pentru "Leads" + "Master Pipeline"; fallback: cel mai mare după număr de oportunități). Configurabil via secret `GHL_MASTER_PIPELINE_ID` dacă userul vrea să-l fixeze.
- **Paginare reală pe `/opportunities/search`** cu `pipeline_id={master}` și `limit=100`, urmărind `meta.nextPageUrl` sau `startAfter`/`startAfterId` (cursor GHL v2). Loop până când API-ul nu mai întoarce rezultate sau atingem un cap de siguranță (15.000).
- **Batch upsert în chunks de 500** ca să nu lovim limite Postgres / payload size.
- **Pull contact details on-demand**: pentru fiecare oportunitate, folosim `contactId` și îmbogățim cu nume/email/telefon din `/contacts/{id}` doar dacă lipsesc din opportunity payload (cache map ca să nu cerem același contact de 2 ori).
- **Returnează progres**: `{ pipeline_name, pipeline_id, total_opportunities, upserted, pages_fetched, duration_ms }`.

### 2. Schema `ghl_leads` — clarificare semantică
Tabelul rămâne, dar **fiecare rând = 1 oportunitate** din Master Pipeline (nu 1 contact). Cheia unică devine `ghl_opportunity_id` (cu fallback pe `ghl_contact_id` pentru contacte fără opportunity, dacă mai apar). Migrare: drop unique pe `ghl_contact_id`, add unique pe `ghl_opportunity_id`, păstrăm ambele coloane.

### 3. Tabel nou `ghl_pipelines` (cache stages)
Mic tabel (id, name, stages jsonb, synced_at) ca să afișăm stages-urile pipeline-ului în UI fără să refacem call la GHL la fiecare load. Populat în același sync.

### 4. UI `/integrations` — afișare pipeline detectat
Pe cardul GHL adăugăm:
- Nume pipeline detectat ("Leads (Master Pipeline)") + total oportunități.
- Distribuție pe stage-uri (mini bar chart sau listă: Necontactat 25, Nu Răspunde x1 338, ... Înscris X).
- Status sync mai detaliat (ultimul: 12.133 opps în 4.2s, 23 pagini).

### 5. Cron (opțional, recomandat)
Programăm `pg_cron` să ruleze sync-ul la fiecare 30 min, cu lock ca să nu se suprapună două run-uri.

## Detalii tehnice

**Filtrare pipeline în GHL API v2:**
```
GET /opportunities/search?location_id={loc}&pipeline_id={master}&limit=100
```
Răspuns conține `meta.startAfter` + `meta.startAfterId` pentru cursor. Iterăm până când `opportunities.length === 0`.

**Upsert chunked:**
```ts
for (let i = 0; i < rows.length; i += 500) {
  await admin.from("ghl_leads").upsert(rows.slice(i, i+500), { onConflict: "ghl_opportunity_id" });
}
```

**Migrare SQL:**
```sql
ALTER TABLE ghl_leads DROP CONSTRAINT IF EXISTS ghl_leads_ghl_contact_id_key;
ALTER TABLE ghl_leads ADD CONSTRAINT ghl_leads_opportunity_unique UNIQUE (ghl_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_ghl_leads_stage ON ghl_leads(stage_name);
CREATE INDEX IF NOT EXISTS idx_ghl_leads_pipeline ON ghl_leads(pipeline_id);

CREATE TABLE ghl_pipelines (
  id text PRIMARY KEY,
  name text NOT NULL,
  is_master boolean DEFAULT false,
  stages jsonb NOT NULL DEFAULT '[]',
  synced_at timestamptz DEFAULT now()
);
ALTER TABLE ghl_pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Managers read pipelines" ON ghl_pipelines FOR SELECT
  USING (has_any_role(auth.uid(), ARRAY['ceo','executive','manager']::app_role[]));
```

**Timeout:** edge functions Supabase au 150s wall time. 12k oportunități / 100 per page = 121 pagini × ~150ms latență GHL ≈ 18s. Confortabil.

## Ce NU includ în acest plan (separate)

Audit-ul tău cere ulterior: `students`, `applications`, `sfe_cases`, `daily_reports`, `sla_engine`, scoreboard-uri per rol (Petea/Dalina/Cristi/Andrei/Florentina), commission tracking, webhooks GHL real-time. **Astea sunt 6-8 task-uri mari separate** — după ce avem datele reale din Master Pipeline în `ghl_leads`, atacăm pe rând. Recomand să începem cu **scoreboard Petea** (queue per stage + aging) imediat după ce sync-ul merge, fiindcă deblochează vizibilitate operațională imediată.

## Fișiere modificate

- `supabase/functions/ghl-sync-leads/index.ts` — rescriere pe oportunități + paginare cursor + chunk upsert
- `supabase/migrations/<new>.sql` — unique pe opportunity_id + tabel pipelines
- `src/pages/Integrations.tsx` — afișare pipeline + distribuție stages
- `src/hooks/useIntegrations.ts` — query nou pentru pipeline stats

## Pași după aprobare

1. Migrare DB (unique key + tabel pipelines).
2. Rescriu edge function cu paginare completă și filtru Master Pipeline.
3. Update UI cu detalii pipeline + breakdown stages.
4. Apeși "Sincronizează" → ar trebui să vezi 12.133 oportunități în câteva secunde.

