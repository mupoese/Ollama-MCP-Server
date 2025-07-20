# INSTRUCTIE.md

## Project: Ollama-MCP-Server

**Beheerder:** [Mupoese](https://github.com/mupoese)  
**Doel:** Eigen, uitbreidbare MCP-server voor lokale en remote Ollama LLM’s, geschikt voor Claude Desktop en andere MCP-applicaties.

---

## 1. Doel en Features

- Proxy tussen MCP-clients en Ollama.
- Ondersteunt: modellen-lijst, chat, model-details, model-pull.
- Docker- en .env-support voor eenvoudige deployment.
- Uitbreidbaar: authenticatie, logging, monitoring, eigen endpoints.
- Beheer en ontwikkeling via GitHub.

---

## 2. Systeemeisen

- Node.js v18 of hoger (LTS aanbevolen)
- npm
- Ollama geïnstalleerd en draaiend (lokaal of remote)
- (Optioneel) Docker en docker-compose
- Git

---

## 3. Installatie (development)

### a. Repository klonen

```bash
git clone https://github.com/mupoese/Ollama-MCP-Server.git
cd Ollama-MCP-Server
````

### b. Dependencies installeren

```bash
npm install
```

### c. .env instellen

```bash
cp .env.example .env
# Pas OLLAMA_API aan indien Ollama niet lokaal draait
```

### d. Server starten

```bash
npm start
```

* Standaardpoort: **3456**
* URL: `http://localhost:3456`

---

## 4. Gebruik met Claude Desktop

* Open Claude Desktop:
  Ga naar **Developer → Add MCP Server**
* Voeg toe:

  ```
  http://localhost:3456
  ```

---

## 5. Docker Deployment

### a. Build en run

```bash
docker-compose build
docker-compose up -d
```

* Service bereikbaar op poort 3456.

### b. .env gebruik

Alle omgevingsvariabelen worden automatisch uit `.env` geladen.

---

## 6. Endpoints (API)

| Methode | Endpoint        | Functie                         |
| ------- | --------------- | ------------------------------- |
| GET     | `/models`       | Lijst alle beschikbare modellen |
| POST    | `/models/pull`  | Download een nieuw model        |
| GET     | `/models/:name` | Details van een specifiek model |
| POST    | `/chat`         | Chat met gekozen model          |

---

## 7. Ontwikkeling en uitbreiden

* Hoofdcode in `src/`
* API-handlers in `src/`, uitbreidbaar per endpoint
* Logging/authenticatie toevoegen via middleware
* Tests in `test/`
* Nieuwe features:

  1. Nieuwe branch maken
  2. Commit met duidelijke omschrijving
  3. Pull Request (PR) openen met toelichting

---

## 8. Deployment in productie

* Gebruik Docker met eigen `.env`
* Open poort 3456 alleen naar vertrouwde IP’s
* Docker-compose restart policy: `unless-stopped`
* Logging/monitoring waar nodig toevoegen

---

## 9. Support & beheer

* **Beheer:** [Mupoese](https://github.com/mupoese)
* **Issues/bugs:** [GitHub issues](https://github.com/mupoese/Ollama-MCP-Server/issues)
* **Feature requests:** Via PR of e-mail

---

## 10. Licentie & eigendom

* **Licentie:** (LICENSE.md)
* **Eigendom:** mupoese.nl, Den Haag, Nederland
