

# Plan: Mapare profiles + 6 module Operațional + Drawer enrichment

Verific întâi ce există deja, apoi adaug doar ce lipsește.

## Status curent (ce există deja, NU re-construiesc)

| Cerință | Status |
|---|---|
| `LeadDetailDrawer` cu nume real (din `ghl_users`), notes, "Open in GHL" | ✅ deja făcut |
| Tabs RO/EN/Nealocați + filtru consultant pe nume real în `/ops` | ✅ deja făcut |
| `/ghl-users` admin pentru mapping ID → nume + limbă | ✅ deja făcut |
| Sync notes pentru leads din dead stages | ✅ deja făcut |
| `ghl_leads.assigned_to` mapat la nume real (Cristi/Andrei/Florentina) | ✅ deja făcut prin `ghl_users` (NU prin `profiles`, vezi mai jos) |

## Decizie: `profiles` vs `ghl_users`

GHL user IDs (ex: `dA3aj2FKfVcDfkN1025N`) **nu sunt** UUID-uri Supabase — sunt ID-uri externe ale GHL. Deci nu se pot lega direct la `profiles.id` (care e `auth.users.id`). Avem două opțiuni:

**Opțiunea A (recomandată):** Păstrăm `ghl_users` ca tabelă de mapping standalone (cum e acum) + adăugăm coloana `profile_id uuid REFERENCES profiles(id)` ca să poți lega un consultant GHL de un user real Supabase (când Cristi își face cont). Drawer-ul și `/ops` arată numele din `profiles` dacă e legat, altfel din `ghl_users.display_name`.

**Opțiunea B:** Tot prin `profiles` direct, cu o coloană `ghl_user_id` pe `profiles`. Dezavantaj: nu poți avea consultanți GHL fără cont Supabase (ex: agenți externi).

→ Merg pe **A**, e mai flexibil și nu strică nimic existent.

## Ce construiesc — partea 1: Bridge `ghl_users ↔ profiles`

1. Migrare: `ALTER TABLE ghl_users ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL`.
2. UI nou pe `/ghl-users`: dropdown "Conectează la user Supabase" cu lista `profiles` (full_name + email).
3. `useGhlUsers` hook lipește `profile` la fiecare `ghl_user` printr-un join.
4. Drawer + `/ops` afișează `profile.full_name` dacă există, fallback la `ghl_users.display_name`.

## Ce construiesc — partea 2: 6 module Operațional (din promptul tău)

Confirm: **niciuna nu există**. Le adaug pe toate, gruparea în sidebar = "Operațional".

### 2.1. `/daily-report` — raport zilnic per consultant
- Tabel `daily_reports`: `id, user_id (FK profiles), report_date, calls_made, leads_contacted, leads_qualified, documents_collected, applications_submitted, students_enrolled, blockers, notes, submitted_at, locked boolean`. Unique pe (user_id, report_date).
- RLS: user editează propriul rând (până la `submitted_at`); manager/CEO citesc tot.
- UI: date picker, tabel cu 1 rând per consultant activ (din `profiles` cu rol `member`/`manager`), coloare condițională (verde ≥30 apeluri, roșu <15), buton "Submit & lock", istoric.

### 2.2. `/weekly-kpis` — agregat săptămânal
- Fără tabel nou. Query agregat din `daily_reports` + `ghl_leads`.
- Tabel: Metric × Mon-Fri + Total + Target. Cards summary + color coding (verde ≥target, galben ≥80%, roșu <80%).

### 2.3. `/sla-tracker` — istoric breach-uri SLA
- Tabel `sla_events`: `id, ghl_opportunity_id, lead_name, sla_type, responsible_user_id, deadline_at, actual_completion_at, status, notes`.
- Inserare automată: trigger pe `ghl_leads` la schimbare de stage → calculează SLA pe stage anterior (folosesc deja `STAGE_SLA_HOURS` din `useOpsLeads`).
- UI: lista filtrabilă, summary cards (% respected, worst offender, avg response).

### 2.4. `/pipeline` — kanban Master Pipeline cu fielduri interne
- Extind `ghl_leads` cu: `internal_assigned_to uuid (FK profiles)`, `university text`, `course text`, `internal_notes text`. Nu strică sync-ul (sync nu atinge coloanele `internal_*`).
- UI Kanban folosind stages din `ghl_pipelines` (master). Card galben după 2 zile, roșu după 5. Filter source/responsabil/uni. Click → drawer extins.

### 2.5. `/monthly-dashboard` — overview luna curentă
- Fără tabel nou. Query agregat. Big number cards (înrolați/target 84/% completare/revenue × £500), line chart cumulative pace, bar chart channel + university, funnel conversion.

### 2.6. `/agents` — managementul agenților (Dalina)
- Tabel `agents`: `id, name, email, phone, application_date, status (applied/approved/active/inactive), notes`.
- Tabel `agent_referrals`: `id, agent_id, student_name, ghl_opportunity_id, status, commission_amount, commission_paid, paid_date`.
- Rol nou în `app_role` enum: `agent_manager` (pentru Dalina). RLS: `agent_manager` + CEO read/write tot.
- UI: summary cards, tabel agenți, click → detail panel cu istoric referrals.

## Ce construiesc — partea 3: Drawer enrichment

În `LeadDetailDrawer.tsx` adaug:
1. **Tab "Raw payload"**: JSON viewer cu `raw_payload` din `ghl_leads` (collapsible, syntax highlight ușor).
2. **Tab "Stage history"**: derivat din `raw_payload.statusHistory` dacă GHL îl trimite, altfel din evenimente `sla_events` legate de același `ghl_opportunity_id`.
3. Tab-uri organizate: `Detalii / Notes / Raw / History`.

## Schema modificări DB (sumar)

```sql
-- Bridge profiles
ALTER TABLE ghl_users ADD COLUMN profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Extend ghl_leads cu internal tracking
ALTER TABLE ghl_leads ADD COLUMN internal_assigned_to uuid REFERENCES profiles(id);
ALTER TABLE ghl_leads ADD COLUMN university text;
ALTER TABLE ghl_leads ADD COLUMN course text;
ALTER TABLE ghl_leads ADD COLUMN internal_notes text;

-- Tabele noi
CREATE TABLE daily_reports (...);
CREATE TABLE sla_events (...);
CREATE TABLE agents (...);
CREATE TABLE agent_referrals (...);

-- Rol nou
ALTER TYPE app_role ADD VALUE 'agent_manager';

-- Trigger SLA pe ghl_leads (la UPDATE pe stage_name → INSERT în sla_events)
```

## Sidebar — grup nou "Operațional"

Sub Business adaug grupul:
- Daily Report (`/daily-report`)
- Weekly KPIs (`/weekly-kpis`)
- SLA Tracker (`/sla-tracker`)
- Student Pipeline (`/pipeline`)
- Monthly Dashboard (`/monthly-dashboard`)
- Agents (`/agents`)

Vizibilitatea per rol prin filtrarea itemilor din sidebar pe baza `roles` din `useAuth`.

## Fișiere noi/modificate

**Migrare:** `supabase/migrations/<new>.sql` — toate schema changes într-o singură migrare.

**Hooks noi:** `useDailyReports.ts`, `useWeeklyKpis.ts`, `useSlaEvents.ts`, `useStudentPipeline.ts`, `useMonthlyMetrics.ts`, `useAgents.ts`.

**Pagini noi:** `DailyReport.tsx`, `WeeklyKpis.tsx`, `SlaTracker.tsx`, `StudentPipeline.tsx`, `MonthlyDashboard.tsx`, `Agents.tsx`.

**Componente noi:** `pipeline/StudentKanbanCard.tsx`, `agents/AgentDialog.tsx`, `agents/AgentDetailDrawer.tsx`, `daily/DailyReportRow.tsx`.

**Modificate:** `LeadDetailDrawer.tsx` (tabs + raw + history), `GhlUsers.tsx` (dropdown profile_id), `useGhlUsers.ts` (join profile), `Ops.tsx` (afișare nume profile când există), `AppSidebar.tsx` (grup Operațional + role-based visibility), `App.tsx` (6 rute noi).

## Pași execuție

1. **Migrare DB unică**: bridge profile_id + extend ghl_leads + 4 tabele noi + rol agent_manager + trigger SLA.
2. **Bridge UI**: update `/ghl-users` cu dropdown profile + `useGhlUsers` cu join.
3. **Drawer enrichment**: tabs Raw + History în `LeadDetailDrawer`.
4. **6 pagini noi** + sidebar group + rute.
5. **Role visibility** în sidebar (filter pe `useAuth().roles`).

## Ce NU includ (separate, vorbește-mi explicit dacă vrei)

- **Atribuirea automată agent → student în GHL** (acum `agent_referrals.ghl_opportunity_id` se setează manual din UI; webhook din GHL ar fi separat).
- **Cron pg_cron auto-sync** la 30 min (separate, după ce confirmăm că totul merge manual).
- **Trigger automat de calcul SLA pentru istoricul existent** — trigger-ul nou prinde doar schimbări viitoare de stage. Pentru backfill ar trebui job separat care parcurge `raw_payload.statusHistory` (dacă GHL îl returnează).
- **Comisioane auto-calculate din monetary_value** — acum se introduc manual; pot adăuga formula după ce-mi spui % default.

