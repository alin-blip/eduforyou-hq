

# Plan: Notes din GHL + categorii pe useri (RO/EN)

## Ce construim

### 1. Sync notes din GHL în `ghl_leads`
GHL API expune notes pe contact: `GET /contacts/{contactId}/notes`. Le trag în același edge function `ghl-sync-leads`, le stochez ca array JSON în coloană nouă `notes` pe `ghl_leads`. Fiecare notă: `{ id, body, createdAt, userId }`.

**Optimizare**: 12k leads × 1 call notes = 12k calls suplimentare → prea încet pentru 150s timeout. Soluție: trag notes **doar pentru leads din stage-uri "moarte"** (Refuz, Picat, etc.) unde consultantul a scris motivul — alea sunt ~2000-3000 leads, ~30-40s extra. Pentru restul, notes rămân goale (oricum nu e relevant până nu e descalificat).

Adaug coloana în `ghl_leads`:
```sql
ALTER TABLE ghl_leads ADD COLUMN notes jsonb DEFAULT '[]'::jsonb;
ALTER TABLE ghl_leads ADD COLUMN notes_count integer DEFAULT 0;
ALTER TABLE ghl_leads ADD COLUMN last_note_body text;
ALTER TABLE ghl_leads ADD COLUMN last_note_at timestamptz;
```

### 2. Mapare useri GHL → categorii RO/EN
Creez tabel mic `ghl_users` cu mapping manual:
```sql
CREATE TABLE ghl_users (
  ghl_user_id text PRIMARY KEY,
  display_name text NOT NULL,
  language text NOT NULL CHECK (language IN ('ro','en','other')),
  is_active boolean DEFAULT true
);
```

Seed inițial bazat pe datele reale din DB:
- `dA3aj2FKfVcDfkN1025N` → "Cristian" / `ro` / active (8728 leads)
- `m1zfsJ02lY1y5PpbKiiE` → "EN Consultant 1" / `en` / active (1605)
- `bPhmWA2a0Oo5cVr3i8sC` → "EN Consultant 2" / `en` / active (519)

Numele exacte le poți edita în UI (vezi punctul 4). Curând rămâne doar 1 user EN — îi marchezi pe ceilalți `is_active=false` și ai un singur bucket "EN" în UI.

### 3. UI `/ops` — filtru pe limbă + nume reale
Înlocuiesc dropdown-ul actual de assignee (cu UUID-uri brute) cu:
- **Tabs sus**: `Toți / 🇷🇴 Română (Cristian) / 🇬🇧 Engleză / Nealocați`
- Sub tabs, opțional: dropdown cu numele reale ale consultanților (din `ghl_users`).
- Coloanele de stage rămân la fel, dar arată numele ("Cristian") în loc de ID-ul brut.

### 4. Detail drawer pe lead — afișează notes
Click pe orice lead în `/ops` → deschide un Sheet/Drawer cu:
- Datele de contact (nume, email, telefon, source, stage, aging).
- **Secțiunea "Notes consultant"**: lista de notițe cu autor (din map `ghl_users`) + dată + body. Pentru leads descalificate (Refuz/Picat) asta e cheia — vezi de ce a picat.
- Buton "Open in GHL" cu link direct: `https://app.gohighlevel.com/v2/location/{locationId}/contacts/detail/{contactId}`.

### 5. Pagina `/teams/ghl-users` (mini admin)
Tabel simplu unde CEO/Manager poate:
- Vedea toți userii GHL detectați (din `ghl_leads.assigned_to` distinct).
- Edita display_name, language (ro/en/other), is_active.
- Auto-discover useri noi când apar în sync.

## Detalii tehnice

**Edge function `ghl-sync-leads`** primește un pas nou după upsert leads:
```ts
// Pull notes pentru leads din stages "moarte" (descalificate)
const deadStages = ["🛑 Refuz","👎Prezent Picat","❌ File in Process Picat",...];
const deadLeads = rows.filter(r => deadStages.includes(r.stage_name));
const contactNotes = new Map<string, any[]>();
for (const lead of deadLeads) {
  if (contactNotes.has(lead.ghl_contact_id)) continue;
  const data = await ghlFetch(`/contacts/${lead.ghl_contact_id}/notes`, GHL_API_KEY);
  contactNotes.set(lead.ghl_contact_id, data?.notes ?? []);
}
// Update batch ghl_leads.notes pentru cele din deadLeads
```

**Auto-discover useri noi**: după sync, INSERT în `ghl_users` pentru orice `assigned_to` care nu există încă (cu `display_name = ghl_user_id`, `language = 'other'`, `is_active = true`) — apare în UI ca "needs review".

**Hook nou `useGhlUsers`**: query React la `ghl_users` + lookup map `userId → {display_name, language}` folosit peste tot în UI (Ops, drawer, etc.).

## Fișiere modificate

- `supabase/migrations/<new>.sql` — coloane notes pe ghl_leads + tabel ghl_users + RLS + seed cu cei 3 useri
- `supabase/functions/ghl-sync-leads/index.ts` — pull notes pentru dead stages + auto-register useri noi
- `src/hooks/useOpsLeads.ts` — adaug `notes`, `last_note_body`, `last_note_at` în SELECT
- `src/hooks/useGhlUsers.ts` (nou) — query useri + map id→nume/limbă
- `src/pages/Ops.tsx` — tabs RO/EN/Nealocați + nume reale + click pe lead deschide drawer
- `src/components/ops/LeadDetailDrawer.tsx` (nou) — notes timeline + buton GHL
- `src/pages/GhlUsers.tsx` (nou) — admin pentru mapping useri → limbă
- `src/components/layout/AppSidebar.tsx` + `src/App.tsx` — link nou "GHL Users" sub Settings

## Pași execuție

1. **Migrare DB**: notes pe ghl_leads + tabel ghl_users + seed cu cei 3 useri pe care-i știm.
2. **Update edge function**: pull notes pentru leads descalificate + auto-register useri.
3. **Resync**: apeși "Sincronizează" → vine cu notes pentru ~2-3k leads descalificate.
4. **UI Ops**: tabs RO/EN, nume reale, drawer cu notes.
5. **UI admin GHL Users**: editezi numele reale (Cristian + numele consultanților EN).

## Ce nu includ (separate)

- Sync notes pentru **toate** leads (nu doar dead) — doar dacă vrei explicit; ar lungi sync-ul la ~3 min și ar trebui mutat pe job background.
- Real-time webhook din GHL pentru notes noi (acum sync e doar manual / cron).
- Analiză AI pe notes ("top 5 motive de refuz luna asta") — fezabil ulterior cu Lovable AI.

