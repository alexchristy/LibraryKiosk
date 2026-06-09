# Library Kiosk — Setup Guide

## First-time setup

### 1. Generate an APP_KEY for Snipe-IT

```bash
docker run --rm snipe/snipe-it php artisan key:generate --show
```

Copy the output (starts with `base64:`) — you'll need it in the next step.

### 2. Create your .env file

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `MYSQL_ROOT_PASSWORD` — a strong password
- `MYSQL_PASSWORD` — a strong password for the app DB user
- `APP_KEY` — the key you generated above
- `APP_URL` — `http://localhost:8080` for local, or your server's IP/hostname for production
- `TZ` — your timezone (e.g. `America/Chicago`)
- Leave `SNIPEIT_API_TOKEN` blank for now

### 3. Start the stack

```bash
docker compose up -d
```

Wait ~60 seconds for Snipe-IT to finish its first-run migration.

### 4. Complete Snipe-IT initial setup

Open http://localhost:8080 and follow the setup wizard:
- Create your admin account
- Set your organization name, currency, etc.

### 5. Configure Snipe-IT for your school

In the Snipe-IT admin panel:
1. **Add asset categories** — e.g. "Laptop", "Book", "Charger"
2. **Add status labels** — ensure you have a "Ready to Deploy" label with type "Deployable"
3. **Import students** as Users — set each student's **Employee Number** to their admission number (integer)
4. **Add assets** — each item gets a unique asset tag matching what's on the physical barcode/QR label
5. Go to your **Profile → API Tokens** and generate a new token

### 6. Add the API token

Edit `.env` and set `SNIPEIT_API_TOKEN` to the token you just created, then restart:

```bash
docker compose restart kiosk
```

### 7. Access the kiosk

Open http://localhost:3000 in a browser, set it to full-screen (F11), and you're ready.

---

## Running the kiosk in kiosk/lockdown mode (recommended for production)

On Windows (the kiosk machine):
- Use Chrome's kiosk flag: `chrome.exe --kiosk http://localhost:3000`
- Or create a scheduled task that launches Chrome at startup in kiosk mode

On Linux:
- `chromium-browser --kiosk --no-sandbox http://localhost:3000`

---

## Updating

```bash
docker compose pull
docker compose build kiosk
docker compose up -d
```

---

## Useful commands

| Command | What it does |
|---------|--------------|
| `docker compose up -d` | Start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f kiosk` | Watch kiosk logs |
| `docker compose logs -f snipeit` | Watch Snipe-IT logs |
| `docker compose restart kiosk` | Restart just the kiosk (after .env changes) |

---

## Student enrollment in Snipe-IT

Students must exist as **Users** in Snipe-IT with their admission number in the **Employee Number** field. The kiosk looks them up by this field when they scan their QR code or type their number.

The student QR code should encode just their admission number as a plain integer string.
