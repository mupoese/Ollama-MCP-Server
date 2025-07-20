# Ollama-MCP-Server

**Auteur/beheerder:** [Mupoese](https://github.com/mupoese)  
**Versie:** v1.0.0  
**Licentie:** GNU General Public License v2.0

---

## Overzicht

**Ollama-MCP-Server** is een eigen, uitbreidbare MCP (Model Context Protocol) server die een brug vormt tussen lokale of remote Ollama LLM-modellen en elke MCP-compatibele applicatie, zoals Claude Desktop.  
Dit project biedt maximale flexibiliteit, privacy, open source gebruik en professionele integratie.

---

## Changelog

### v1.0.0

- Eerste stabiele release.
- Volledige ondersteuning voor MCP-API endpoints.
- Docker-support voor Windows, Mac en Linux.
- Integratie-instructies voor Claude Desktop.
- Healthcheck endpoint.
- Volledige foutafhandeling en logging.

---

## Belangrijkste features

- Proxy tussen MCP-clients en Ollama.
- Endpoints: modellen-lijst, chat, model-details, model-pull.
- Docker-support: direct uitrolbaar als container.
- Omgevingsvariabelen via Docker `-e` of lokaal via `.env`.
- Volledige integratie met Claude Desktop (zie voorbeeld).
- Uitbreidbaar met eigen authenticatie, logging, dashboards, enz.
- Snel te bouwen en te deployen.

---

## Systeemeisen

- Node.js v18+ (voor lokaal testen)
- npm (voor lokaal testen)
- Ollama lokaal geïnstalleerd en draaiend, of remote Ollama API
- Docker (aanbevolen voor productie/desktop-integratie)
- Git

---

## Gebruik: lokaal vs. Docker

| Gebruik             | OLLAMA_API instellen                    | Start MCP-server                                                     | Toegankelijke URL         |
|---------------------|-----------------------------------------|---------------------------------------------------------------------|---------------------------|
| **Lokaal**          | `http://localhost:11434`                | `PORT=3456 OLLAMA_API=http://localhost:11434 npm start`             | `http://localhost:3456`   |
| **Docker (Win/Mac)**| `http://host.docker.internal:11434`     | Zie Docker-voorbeeld hieronder                                      | `http://localhost:3456`   |
| **Docker (Linux)**  | `http://172.17.0.1:11434` *(check IP)*  | Zie Docker-voorbeeld hieronder                                      | `http://localhost:3456`   |

---

## Gebruik met Docker

### **Windows / PowerShell**

Gebruik **alles op één regel** (géén backslashes of linebreaks):

```powershell
docker run --rm -p 3456:3456 -e PORT=3456 -e OLLAMA_API=http://host.docker.internal:11434 mupoese/ollama-mcp-server:1.0.0
````

> **Let op:** Powershell ondersteunt geen Unix-linebreak (`\`).
> Elk `-e` argument direct achter elkaar op dezelfde regel plaatsen.

**Alternatief (voor gevorderden, Powershell):**

```powershell
$env:PORT=3456
$env:OLLAMA_API="http://host.docker.internal:11434"
docker run --rm -p 3456:3456 mupoese/ollama-mcp-server:1.0.0
```

---

### **Linux/macOS (bash shell)**

Hier kun je wél met backslashes multi-line werken:

```bash
docker run --rm -p 3456:3456 \
  -e PORT=3456 \
  -e OLLAMA_API=http://172.17.0.1:11434 \
  mupoese/ollama-mcp-server:1.0.0
```

> **Let op:** Controleer op Linux je bridge IP met
> `ip addr show docker0` als het standaard IP niet werkt.

---

### Veelgemaakte fouten op Windows

* **Geen** backslash (`\`) of aparte regels gebruiken
* Alles op **één regel**
* Typ het commando exact zoals hierboven

---

### Samenvatting per platform

| Platform        | Aanbevolen commando                                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Windows/PS**  | `docker run --rm -p 3456:3456 -e PORT=3456 -e OLLAMA_API=http://host.docker.internal:11434 mupoese/ollama-mcp-server:1.0.0` |
| **Linux/macOS** | Zie bovenstaande Bash-voorbeeld                                                                                             |

---

### **Let op voor productiegebruik**

* Zet poort 3456 alleen open naar vertrouwde IP’s.
* Gebruik een Docker restart policy, bijv. `--restart unless-stopped`
* Monitoring en logging kun je uitbreiden met eigen middleware of tools.

---

## Installatie & gebruik (lokaal)

1. **Clone de repo**

   ```bash
   git clone https://github.com/mupoese/Ollama-MCP-Server.git
   cd Ollama-MCP-Server
   ```

2. **Installeer dependencies**

   ```bash
   npm install
   ```

3. **Start de server (voor lokale Ollama)**

   ```bash
   PORT=3456 OLLAMA_API=http://localhost:11434 npm start
   ```

   > Pas eventueel `OLLAMA_API` aan indien je Ollama op een ander IP draait.

4. **De server draait nu op:**
   [http://localhost:3456](http://localhost:3456)

---

## Integratie met Claude Desktop

1. Open Claude Desktop instellingen/configuratie.

2. Voeg deze regel toe aan je MCP server-config:

   ```json
   {
     "mcpServers": {
       "ollama-mcp": {
         "command": "docker",
         "args": [
           "run",
           "--rm",
           "-p", "3456:3456",
           "-e", "PORT=3456",
           "-e", "OLLAMA_API=http://host.docker.internal:11434",
           "mupoese/ollama-mcp-server:1.0.0"
         ]
       }
     }
   }
   ```

   *(Linux-gebruikers: pas `"OLLAMA_API=http://host.docker.internal:11434"` aan naar je host-bridge-IP.)*

3. Herstart Claude Desktop of voeg via het developer menu de nieuwe MCP-server toe.

**Je kunt nu in Claude Desktop je eigen lokale Ollama-modellen gebruiken!**

---

## API Endpoints

| Methode | Endpoint        | Functie                         |
| ------- | --------------- | ------------------------------- |
| GET     | `/models`       | Lijst alle beschikbare modellen |
| POST    | `/models/pull`  | Download een nieuw model        |
| GET     | `/models/:name` | Details van een specifiek model |
| POST    | `/chat`         | Chat met gekozen model          |
| GET     | `/health`       | Healthcheck endpoint            |

---

## Production deployment

* Deploy als Docker-container met je gewenste omgevingsvariabelen.
* Zet poort 3456 alleen open naar vertrouwde IP’s.
* Gebruik een Docker restart policy, bijvoorbeeld:
  `--restart unless-stopped`
* Monitoring en logging kun je uitbreiden met eigen middleware of tools.

---

## Projectstructuur

```
Ollama-MCP-Server/
├─ src/
│   └─ server.js
├─ package.json
├─ package-lock.json
├─ Dockerfile
├─ README.md
├─ .env.example
```

---

## Licentie

Dit project valt onder de GNU General Public License v2.0.
Zie LICENSE.md of gpl-2.0.txt voor de volledige tekst.

---

## Onderhoud & Support

* **Auteur/beheerder:** Mupoese
* **Issues/bugs:** via GitHub Issues
* **Feature requests:** via Pull Request of GitHub Issue

---

## FAQ / Troubleshooting

* **Q:** Mijn Docker MCP-server krijgt geen verbinding met Ollama.
  **A:** Controleer of je OLLAMA\_API juist is ingesteld. Gebruik `host.docker.internal` voor Windows/Mac, op Linux vaak `172.17.0.1`. Controleer of Ollama draait op poort 11434.

* **Q:** Poort 3456 is al bezet.
  **A:** Kies een andere poort in je MCP-server en pas dit aan in Docker/Claude Desktop config.

* **Q:** Claude Desktop geeft geen modellen weer.
  **A:** Controleer de verbinding met Ollama, check de logs van de MCP-server (`docker logs <container_id>`), en probeer het `/health`-endpoint in de browser.

* **Q:** Hoe voeg ik nieuwe functionaliteit toe?
  **A:** Fork de repo, werk in een nieuwe branch en open een Pull Request met duidelijke uitleg.

---

> **Let op:**
> Deze README is een levend document en wordt bij elke belangrijke update uitgebreid.

```
