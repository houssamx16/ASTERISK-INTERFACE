# 📡 Asterisk VoIP Appliance — Spécification Complète du Contrat d'API REST (v1)
**Université Kasdi Merbah Ouargla**  
*Faculté des Nouvelles Technologies de l'Information et de la Communication — Département d'Informatique (ASR2)*  
*Document officiel destiné au développeur Backend (Node.js / Python / PHP) & Administrateur Système Asterisk*

---

## 📌 1. Conventions Générales

- **Base URL :** `http://<IP_SERVEUR>:5000/api/v1`
- **Format des données :** `application/json` (sauf upload de fichiers audio en `multipart/form-data`)
- **Authentification :** En-tête HTTP standard Bearer JWT :  
  `Authorization: Bearer <TOKEN_JWT>`
- **Format standard des réponses JSON :**
```json
{
  "success": true,
  "data": {},
  "message": "Opération effectuée avec succès",
  "timestamp": "2026-10-17T16:00:00Z"
}
```

- **Format standard des erreurs HTTP (4xx / 5xx) :**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "L'extension 101 est introuvable"
  },
  "timestamp": "2026-10-17T16:00:00Z"
}
```

---

## 📋 2. Répertoire Complet des Endpoints

| Domaine | Méthode | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/login` | Authentification de l'administrateur et émission du JWT |
| | `POST` | `/auth/logout` | Révocation du token de session |
| | `GET` | `/auth/me` | Profil et permissions de l'administrateur connecté |
| **Dashboard** | `GET` | `/dashboard/summary` | Compteurs globaux (extensions, canaux, statut Asterisk) |
| | `GET` | `/system/resources` | Métriques CPU, RAM, Disque et état des daemons |
| | `POST` | `/system/service/{name}/{action}` | Contrôle (`restart`/`reload`) de `asterisk`, `mariadb`, etc. |
| **Extensions** | `GET` | `/extensions` | Liste des extensions PJSIP et statuts d'enregistrement |
| | `POST` | `/extensions` | Création d'une nouvelle extension PJSIP et mot de passe |
| | `GET` | `/extensions/{id}` | Détails complets d'une extension |
| | `PUT` | `/extensions/{id}` | Mise à jour des paramètres d'une extension |
| | `PATCH` | `/extensions/{id}/toggle` | Activer / Désactiver rapidement un poste |
| | `DELETE` | `/extensions/{id}` | Suppression de l'extension et de son endpoint PJSIP |
| | `POST` | `/extensions/apply-config` | Exécuter la commande Asterisk CLI `pjsip reload` |
| **Dialplan** | `GET` | `/dialplan/ranges` | Liste des plages de numérotation par service (100–599) |
| | `PUT` | `/dialplan/ranges/{id}` | Modifier les bornes d'un département |
| | `GET` | `/dialplan/rules` | Règles de restriction (interdiction international, code PIN) |
| | `POST` | `/dialplan/rules` | Ajouter une règle de filtrage d'appel |
| | `DELETE` | `/dialplan/rules/{id}` | Supprimer une règle de restriction |
| | `GET` | `/dialplan/forwarding` | Liste des renvois d'appels configurés |
| | `PUT` | `/dialplan/forwarding/{ext}` | Configurer renvoi inconditionnel, occupé ou non-réponse |
| | `POST` | `/dialplan/reload` | Exécuter la commande Asterisk CLI `dialplan reload` |
| **Services** | `GET` | `/services/voicemail` | Liste des boîtes vocales et compteurs de messages |
| | `POST` | `/services/voicemail` | Créer ou configurer une boîte vocale (voicemail.conf) |
| | `PUT` | `/services/voicemail/{num}` | Mettre à jour code PIN ou notification email |
| | `GET` | `/services/conferences` | Salles de réunion virtuelles (confbridge.conf / meetme) |
| | `POST` | `/services/conferences` | Créer une salle (PIN user/admin, auto-mute, enregistrement) |
| | `DELETE` | `/services/conferences/{num}` | Supprimer une salle de conférence |
| | `GET` | `/services/moh` | Fichiers audio de musique d'attente (musiconhold.conf) |
| | `POST` | `/services/moh/upload` | Upload d'un fichier WAV/GSM (`multipart/form-data`) |
| | `DELETE` | `/services/moh/{id}` | Supprimer un fichier audio |
| **Queues** | `GET` | `/call-center/queues` | Liste des files d'attente ACD et stratégies |
| | `POST` | `/call-center/queues` | Créer une file d'attente (queues.conf) |
| | `PUT` | `/call-center/queues/{id}` | Mettre à jour les paramètres (timeout, maxlen, strategy) |
| | `DELETE` | `/call-center/queues/{id}` | Supprimer une file d'attente |
| | `POST` | `/call-center/queues/{id}/agents`| Assigner un agent SIP avec pénalité de sonnerie |
| | `DELETE` | `/call-center/queues/{id}/agents/{agentId}` | Retirer un agent d'une file |
| | `GET` | `/call-center/queues/{id}/stats` | Statistiques (appels servis, abandonnés, attente moy.) |
| **IVR** | `GET` | `/ivr` | Liste des serveurs vocaux interactifs |
| | `POST` | `/ivr` | Créer un menu vocal interactif (touches 0–9, *, #) |
| | `PUT` | `/ivr/{id}` | Modifier l'arbre de routage DTMF et message d'accueil |
| | `DELETE` | `/ivr/{id}` | Supprimer un menu IVR |
| **Monitoring** | `GET` | `/monitoring/live-channels` | Canaux Asterisk actifs en direct (via AMI `core show channels`) |
| | `POST` | `/monitoring/hangup/{channelId}` | Raccrocher un canal via AMI (`hangup channel`) |
| | `GET` | `/monitoring/peers` | État dynamique PJSIP (`pjsip show endpoints`) |
| **CDR** | `GET` | `/cdr` | Historique des appels avec pagination et filtres |
| | `GET` | `/cdr/stats` | Volume journalier et taux de décroché |
| | `GET` | `/cdr/export` | Téléchargement du rapport d'appels en format CSV |
| **Backup** | `GET` | `/system/backups` | Liste des archives de sauvegarde présentes sur le disque |
| | `POST` | `/system/backups` | Générer un snapshot complet (`.tar.gz`) de l'appliance |
| | `POST` | `/system/backups/{id}/restore`| Restaurer la configuration et la base de données |
| | `GET` | `/system/backups/{id}/download`| Télécharger l'archive de sauvegarde |
| | `DELETE` | `/system/backups/{id}` | Supprimer une archive |

---

## 💻 3. Payloads JSON & Exemples de Requêtes / Réponses

### 3.1 Authentification (`POST /auth/login`)
- **Body :**
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```
- **Réponse `200 OK` :**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "Administrateur Principal",
      "email": "admin@telephony.local",
      "role": "SUPER_ADMIN"
    }
  },
  "timestamp": "2026-10-17T16:00:00Z"
}
```

---

### 3.2 Tableau de Bord (`GET /dashboard/summary`)
- **Réponse `200 OK` :**
```json
{
  "success": true,
  "data": {
    "asterisk_status": "ONLINE",
    "asterisk_version": "Asterisk 20.9.2 LTS (PJSIP)",
    "uptime_seconds": 354890,
    "total_extensions": 10,
    "registered_phones": 8,
    "offline_phones": 2,
    "active_calls": 3,
    "today_calls_count": 184,
    "active_queues": 2,
    "active_conferences": 2
  },
  "timestamp": "2026-10-17T16:00:00Z"
}
```

---

### 3.3 Création d'une Extension PJSIP (`POST /extensions`)
*Le backend doit insérer l'extension dans MariaDB et mettre à jour `pjsip.conf`.*
- **Body :**
```json
{
  "extension_number": "104",
  "sip_password": "PassSecure104!",
  "caller_id": "Mourad Belkacem <104>",
  "user_name": "Mourad Belkacem",
  "user_email": "m.belkacem@telephony.local",
  "department": "Administration",
  "transport": "transport-udp",
  "context": "from-internal",
  "voicemail_enabled": true,
  "webrtc_enabled": false,
  "max_contacts": 1
}
```
- **Réponse `201 Created` :**
```json
{
  "success": true,
  "data": {
    "id": "ext-104",
    "extension_number": "104",
    "status": "active",
    "registration": {
      "status": "offline",
      "ip_address": "0.0.0.0",
      "user_agent": "None",
      "latency_ms": 0,
      "last_registered": "Never"
    }
  },
  "message": "Extension créée avec succès",
  "timestamp": "2026-10-17T16:00:00Z"
}
```

---

### 3.4 Configuration du Renvoi d'Appel (`PUT /dialplan/forwarding/{extension}`)
*Le backend enregistre les déviations d'appel répercutées dans le dialplan.*
- **Body :**
```json
{
  "forward_always_enabled": false,
  "forward_always_dest": "",
  "forward_busy_enabled": true,
  "forward_busy_dest": "102",
  "forward_no_answer_enabled": true,
  "forward_no_answer_dest": "voicemail",
  "timeout_seconds": 20
}
```

---

### 3.5 Création d'une File d'Attente Call Center (`POST /call-center/queues`)
*Le backend génère la section correspondante dans `queues.conf`.*
- **Body :**
```json
{
  "queue_name": "support_fr",
  "display_name": "Support Technique FR",
  "strategy": "rrmemory",
  "timeout_seconds": 30,
  "max_callers": 15,
  "announce_holdtime": true,
  "music_on_hold": "default",
  "agents": [
    { "extension_number": "401", "penalty": 1 },
    { "extension_number": "402", "penalty": 2 }
  ]
}
```

---

### 3.6 Création d'un Menu IVR (`POST /ivr`)
*Le backend configure les contextes du menu vocal interactif dans `extensions.conf`.*
- **Body :**
```json
{
  "name": "Serveur Vocal Principal",
  "extension": "700",
  "greeting_audio": "welcome_prompt.wav",
  "timeout_seconds": 10,
  "max_retries": 3,
  "invalid_destination": { "type": "extension", "value": "102" },
  "timeout_destination": { "type": "extension", "value": "102" },
  "entries": [
    { "digit": "1", "description": "Administration", "destination_type": "extension", "destination_value": "101" },
    { "digit": "2", "description": "Finance", "destination_type": "extension", "destination_value": "201" },
    { "digit": "3", "description": "Customer Service", "destination_type": "queue", "destination_value": "support_fr" },
    { "digit": "9", "description": "Salle Conférence", "destination_type": "conference", "destination_value": "800" }
  ]
}
```

---

### 3.7 Canaux Actifs / Supervision AMI (`GET /monitoring/live-channels`)
*Interroge Asterisk Manager Interface (AMI) via l'action `CoreShowChannels`.*
- **Réponse `200 OK` :**
```json
{
  "success": true,
  "data": [
    {
      "channel_id": "PJSIP/101-0000004f",
      "caller_id": "101",
      "caller_name": "Dr. Mohamed Larbi",
      "connected_to": "102",
      "callee_name": "Amina Mansouri",
      "duration_seconds": 142,
      "state": "Up",
      "codec": "alaw",
      "department": "Administration"
    }
  ],
  "timestamp": "2026-10-17T16:00:00Z"
}
```

---

### 3.8 Historique des Appels CDR (`GET /cdr`)
*Interroge la table MariaDB `cdr` issue d'Asterisk.*
- **Paramètres Query :**
  - `page` : numéro de page (défaut: 1)
  - `limit` : nombre d'enregistrements par page (défaut: 20)
  - `disposition` : `ANSWERED` \| `NO ANSWER` \| `BUSY` \| `FAILED`
  - `department` : filtre par service
  - `search` : recherche par numéro source ou destination
- **Réponse `200 OK` :**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 1042,
        "call_date": "2026-10-17 15:42:10",
        "caller_id": "101",
        "source": "101",
        "destination": "102",
        "context": "from-internal",
        "duration": 180,
        "billable_seconds": 172,
        "disposition": "ANSWERED",
        "department": "Administration",
        "recording_url": "/recordings/rec-1042.wav"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_records": 1042,
      "total_pages": 53
    }
  },
  "timestamp": "2026-10-17T16:00:00Z"
}
```

---

### 3.9 Sauvegarde & Restauration (`POST /system/backups`)
*Exécute un script de snapshot archivant `/etc/asterisk`, la base MariaDB et `/var/spool/asterisk`.*
- **Body :**
```json
{
  "type": "full" // "full" | "config_only"
}
```
- **Réponse `201 Created` :**
```json
{
  "success": true,
  "data": {
    "id": "bak-20261017-01",
    "filename": "asterisk_appliance_full_2026-10-17.tar.gz",
    "size_mb": 142.8,
    "created_at": "2026-10-17 16:00:00",
    "type": "full",
    "status": "ready"
  },
  "message": "Archive créée avec succès",
  "timestamp": "2026-10-17T16:00:00Z"
}
```

