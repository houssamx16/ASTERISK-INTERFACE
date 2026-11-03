# Asterisk IP Telephony Appliance — Interactive Web UI
**Université Kasdi Merbah Ouargla**  
*Faculté des Nouvelles Technologies de l’Information et de la Communication — Département d’Informatique (Master ASR2)*

A modern, responsive, high-performance Web Management Appliance for **Asterisk VoIP Telephony (PJSIP)** built with React 18, Vite, TypeScript, and Tailwind CSS.

---

## 🚀 Quick Start

```bash
# 1. Navigate to the project directory
cd asterisk-appliance-ui

# 2. Start the interactive local development server
npm run dev
```

The application will be live at: **`http://localhost:3000`**

---

## 📦 Features Implemented (Matching Project Specifications)

1. **Tableau de Bord / Dashboard (Parties II & VIII)**
   - Asterisk Service Status indicator (ONLINE / PJSIP Stack)
   - Real-time CPU, RAM, and Disk resource gauges with dynamic fluctuations
   - Extension registration counter (Registered vs Offline)
   - Active calls counter and daily traffic accumulator
   - Hourly call traffic area chart (Recharts) and volume per department bar chart
   - Live calls monitoring table with real-time **Hangup (AMI)** trigger

2. **Utilisateurs & Extensions SIP PJSIP (Partie III)**
   - Full CRUD: Create, Edit, Delete extensions
   - SIP Password generator and visibility toggle
   - Association with user profiles and departments
   - Department assignment (100–199 Admin, 200–299 Finance, 300–399 IT, 400–499 Support, 500–599 Mgmt)
   - Active/Inactive toggle button
   - Live endpoint registration watcher (IP Address, User-Agent, Latency ms)
   - **Recharger Asterisk (`pjsip reload`)** button with pending-changes indicator banner

3. **Plan de Numérotation & Routage (Partie IV)**
   - Department ranges viewer with in-place range limits editor
   - Dialplan security restrictions (Allow, Block, or Require PIN code)
   - Call Forwarding configurator per extension (Unconditional, On Busy, On No Answer with timeout)

4. **Services Téléphoniques VoIP (Partie V)**
   - **Voicemail**: Mailbox creation, PIN, email notifications, WAV attachment toggle, message count
   - **Conférences**: ConfBridge/MeetMe virtual room creation, Member PIN, Admin PIN, auto-mute, auto-record
   - **Musique d'Attente (MOH)**: Audio file manager (.wav, .gsm), file upload simulation, preview and delete
   - **Transfert d'Appel**: Practical guide for Blind Transfer (`##`) and Attended Transfer (`*2`)

5. **Centre d'Appel & Files d'Attente ACD (Partie VI)**
   - Queue management (queues.conf) with ring strategies (`ringall`, `leastrecent`, `fewestcalls`, `random`, `rrmemory`)
   - Agent assignment roster with priority penalties
   - Live queue metrics: Callers waiting, completed calls, abandoned calls, avg wait time

6. **Serveur Vocal Interactif / IVR (Partie VII)**
   - Interactive visual DTMF dialpad (0–9, *, #)
   - Touch route assigner: Extension, Queue, Conference, Voicemail, Hangup
   - Welcome audio prompt configuration and timeout/retry rules

7. **Supervision Temps Réel (Partie VIII)**
   - Active channels watcher with caller, callee, duration counter, codec
   - Channel hangup capability via AMI command simulator
   - Daemons health status: Asterisk, PJSIP, MariaDB, Web Server with restart actions
   - PJSIP Endpoints live latency and qualify status

8. **CDR & Rapports d'Appels (Partie IX)**
   - Call Detail Records table (caller, callee, date/time, total duration, billable seconds, disposition)
   - Filter by disposition (`ANSWERED`, `NO ANSWER`, `BUSY`, `FAILED`) and department
   - Audio call recording playback simulator modal
   - One-click **Export to CSV** function generating valid downloadable spreadsheet files

9. **Sauvegarde, Sécurité & Système (Parties X & XI)**
   - Backup creation (Full .tar.gz and Config-only)
   - Download backup archive
   - One-click restore simulator with state confirmation
   - Asterisk core reload and daemon restart triggers

---

## 🔌 Switching from Mock to Real Backend

The project includes an interchangeable API layer configured via `.env`:

```env
# To use the interactive mock layer (default):
VITE_USE_MOCK=true

# When your backend teammate finishes the API:
VITE_USE_MOCK=false
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

All models strictly follow the REST API Contract provided to the backend developer.

