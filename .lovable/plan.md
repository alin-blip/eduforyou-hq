

# EduForYou OS — Management Operating System

Platformă centrală de management pentru EduForYou care unifică echipele, OKR/KPI, ritm de execuție, finanțe, integrări marketing și hub pentru proiectele conexe (Agent Hub, Partners SAAS, Webinar, etc.).

## 🏗️ Arhitectură generală

- **Backend**: Lovable Cloud (auth, baza de date, edge functions pentru OAuth + sincronizări)
- **Roluri**: CEO · Executive · Department Manager · Team Member (RLS strict, roluri în tabel separat)
- **Multi-tenant ready**: structura permite ulterior adăugarea altor companii (holding view)

## 📦 Module de livrat

### 1. Auth & Organization
- Login email/parolă + magic link
- Profil utilizator (nume, rol, departament, avatar, salariu opțional pentru cost calc)
- Invitație membri prin email
- Departamente configurabile (Marketing, Sales, Operations, Product, Finance, etc.)

### 2. CEO Cockpit (Dashboard principal)
- Scor PACE™ (Planning · Alignment · Coordination · Evaluation) — health score 0-100
- Widget-uri: revenue MTD, burn rate, runway, OKR completion %, KPI alerts roșu/verde, task overdue
- Heatmap performanță pe departamente
- Quick links către Agent Hub, Partners SAAS, Webinar (proiectele tale conexe)

### 3. OKR & KPI Engine
- **Obiective companie** → cascadă către departamente → individual
- Key Results cu progres %, owner, due date, check-in săptămânal
- KPI cards (target, actual, trend, threshold roșu/galben/verde) per departament
- Istoric & forecast (line chart)
- Aliniere vizuală: ce OKR personal contribuie la ce obiectiv companie

### 4. Teams & Workload
- Vizualizare echipe pe departamente, organigramă
- Workload per membru (task-uri active, ore estimate vs disponibile)
- "What is X working on" — feed live cu ce face fiecare astăzi/săptămâna asta
- Capacitate vs cerere (alertă overload)

### 5. CICLES™ — Ritmul de execuție
- **Daily Check-in (15 min)**: ce am făcut ieri, ce fac azi, blocaje
- **Weekly Board (60 min)**: review KPI săptămână, decizii, action items
- **Monthly KPI Review (120 min)**: analiză performanță, ajustări OKR
- **Quarterly Strategy (240 min)**: scor PACE, retrospectivă, planning trimestrul următor
- Notificări automate, template-uri, istoric meeting notes

### 6. Tasks & Projects
- Task-uri legate de KPI/OKR (lanț strategie → execuție)
- Status (todo/in progress/blocked/done), prioritate, asignat
- Vizualizare Kanban + List + Calendar
- Integrare cu departamente

### 7. Virtual CFO complet
- **Revenue tracking** lunar/trimestrial pe sursă (B2C eduforyou, Agent Hub, Partners SAAS)
- **Cheltuieli** pe categorii (salarii, ads, software, etc.) și pe departament
- **P&L** automat, marjă brută/netă
- **Cashflow & runway** (luni rămase la burn-rate actual)
- **Facturi & debite**: facturi emise, scadente, debite per client, alerte automate scadență
- **Forecast & scenarii**: proiecții 3/6/12 luni cu sliders (creștere %, cost %, hire plan)
- **KPI financiari**: CAC, LTV, payback, marjă pe linie de business
- **Bugete pe departament** vs actual, alerte depășire

### 8. Integrări Marketing & Data (OAuth/API real)

Toate prin Lovable Cloud edge functions, cu refresh token management:

- **Meta Ads (Facebook/Instagram)** — campanii, spend, ROAS, CPL, audiences
- **Google Analytics 4** — sesiuni, conversii, surse trafic, funnel
- **Google Tag Manager** — listă tag-uri, status, audit
- **GoHighLevel (GHL)** — leads, pipeline, contacte, conversii
- **SimilarWeb** — trafic competitori, ranking
- **(opțional ulterior)** Google Ads, LinkedIn Ads, Stripe, Mailchimp

Pentru fiecare: pagină dashboard dedicată + widget-uri în CEO Cockpit + date alimentează KPI-urile.

> Notă: GHL și SimilarWeb necesită API key manual (le adăugăm ca secrets); Meta + Google folosesc OAuth (vom configura aplicații OAuth — îți voi cere credentialele când ajungem acolo).

### 9. Project Hub (proiectele EduForYou)
- Pagină cu carduri pentru fiecare proiect Lovable conex: **Agent Hub**, **Partners SAAS AgencyOS**, **Webinar EduForYou**, **EduForYou main**, **Eduforyou Hub**, **Student Success Hub**
- Status (live/draft), URL, owner, KPI cheie per proiect (ex: nr. agenți, nr. parteneri, înscrieri webinar)
- Sincronizare manuală a metricilor + posibilitate ulterioară de webhook

### 10. 360° Comparison & Reports
- Snapshot lunar al companiei (PACE score, financials, OKR completion, marketing performance)
- Comparație lună-pe-lună / trimestru-pe-trimestru
- Export PDF "Board Report" pentru investitori/board
- AI Insights (folosind Lovable AI Gateway): rezumat săptămânal automat al schimbărilor importante

## 🎨 Design & UX

- **Tema**: dark mode default, premium "operating system" feel (inspirat BizzOS — gradient subtle, glassmorphism light, tipografie clean)
- **Culori**: primary albastru-închis/violet (autoritate), accent verde (creștere), roșu (alertă), galben (warning)
- **Layout**: sidebar fix stânga cu module, top bar cu search global + notifications + user menu
- **Responsive**: optimizat desktop (CEO/manager use case) + funcțional mobil pentru check-in zilnic

## 🚀 Plan de livrare

Având în vedere că ai ales "totul deodată", livrăm în **3 valuri** într-o singură sesiune de implementare, ca să poți începe să folosești cât mai repede:

1. **Val 1 — Foundation** (auth, roluri, departamente, echipe, CEO cockpit cu mock data, design system complet)
2. **Val 2 — Core management** (OKR/KPI engine, tasks, CICLES, Project Hub, Virtual CFO complet)
3. **Val 3 — Integrări** (schelet OAuth + GHL/Meta/GA/GTM/SimilarWeb dashboards — vom finaliza fiecare integrare pe rând după ce primim credentialele OAuth)

După ce aprobi, încep cu Val 1.

