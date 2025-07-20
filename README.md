# Ollama-MCP-Server

**Auteur/beheerder:** [Mupoese](https://github.com/mupoese)  
**Licentie:** GNU General Public License v2.0

---

## Overzicht

**Ollama-MCP-Server** is een eigen, uitbreidbare MCP (Model Context Protocol) server die een brug vormt tussen lokale of remote Ollama LLM-modellen en elke MCP-compatible applicatie, zoals Claude Desktop.  
Dit project is gericht op maximale flexibiliteit, privacy, open source gebruik en professionele integratie.

---

## Belangrijkste features

- **Proxy tussen MCP-clients en Ollama**  
- **Endpoints:** modellen-lijst, chat, model-details, model-pull  
- **Docker-support:** direct uitrolbaar als container  
- **Omgevingsvariabelen via Docker `-e`** (geen .env nodig)  
- **Volledige integratie met Claude Desktop (zie voorbeeld)**  
- **Makkelijk uitbreidbaar met eigen authenticatie, logging, dashboards enz.**  
- **Snel te bouwen en te deployen**

---

## Systeemeisen

- Node.js v18+ (voor lokaal testen)
- npm (voor lokaal testen)
- Ollama lokaal geïnstalleerd en draaiend, of remote Ollama API
- Docker (aanbevolen voor productie/desktop integratie)
- Git

---

## Installatie (development/lokaal testen)

1. **Clone de repo**
    ```bash
    git clone https://github.com/mupoese/Ollama-MCP-Server.git
    cd Ollama-MCP-Server
    ```

2. **Installeer dependencies**
    ```bash
    npm install
    ```

3. **Start de server**
    ```bash
    PORT=3456 OLLAMA_API=http://host.docker.internal:11434 npm start
    ```
    > Pas eventueel de OLLAMA_API aan indien je Ollama op een ander IP draait.

4. **De server draait nu op**  
   [http://localhost:3456](http://localhost:3456)

---

## Gebruik met Docker

**Docker-image bouwen en starten (zonder .env):**

```bash
docker build -t mupoese/ollama-mcp-server:latest .
docker run --rm -p 3456:3456 \
  -e PORT=3456 \
  -e OLLAMA_API=http://host.docker.internal:11434 \
  mupoese/ollama-mcp-server:latest
````

* Je MCP server is nu bereikbaar op poort **3456**.
* Vervang het OLLAMA\_API-adres als je Ollama niet lokaal op de host draait.
* Voor Linux-hosts kan het `OLLAMA_API=http://172.17.0.1:11434` zijn.

---

## Integratie met Claude Desktop

1. Open je Claude Desktop instellingen/configuratie.

2. Voeg deze regel toe aan je MCP server-config:

   ```json
   {
     "mcpServers": {
       "ollama-mcp": {
         "command": "docker",
         "args": [
           "run",
           "--rm",
           "-p",
           "3456:3456",
           "-e", "PORT=3456",
           "-e", "OLLAMA_API=http://host.docker.internal:11434",
           "mupoese/ollama-mcp-server:latest"
         ]
       }
     }
   }
   ```

3. Herstart Claude Desktop of voeg via de developer menu de nieuwe MCP-server toe.

4. Je kunt nu in Claude Desktop je eigen lokale Ollama-modellen gebruiken!

---

## API endpoints

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
```

---

## Licentie

Dit project valt onder de **GNU General Public License v2.0**.
Zie `LICENSE.md` of [gpl-2.0.txt](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) voor de volledige tekst.

---

## Onderhoud & support

* **Auteur/beheerder:** [Mupoese](https://github.com/mupoese)
* **Issues/bugs:** [GitHub Issues](https://github.com/mupoese/Ollama-MCP-Server/issues)
* **Feature requests:** via PR of GitHub Issue

---

> **Let op:**
> Deze README is een levend document en wordt bij elke belangrijke update uitgebreid.

```
