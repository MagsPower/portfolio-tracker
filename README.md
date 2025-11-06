## 🚀 Come Installare su Android

### Metodo 1: Da Chrome (Consigliato)

1. **Apri Chrome** su Android
2. Vai al sito dove hai ospitato l'app (es: il tuo server, Netlify, Vercel, ecc.)
3. Premi il **menu** (⋮ in alto a destra)
4. Seleziona **"Installa l'app"** o **"Aggiungi alla home"**
5. Conferma con **"Installa"**

L'app apparirà come icona sulla home screen!

### Metodo 2: Da Firefox

1. **Apri Firefox** su Android
2. Vai al sito dell'app
3. Premi il **menu** (≡ in basso)
4. Seleziona **"Installa"** o **"Aggiungi alla schermata home"**

### Metodo 3: Manuale (Se i metodi sopra non funzionano)

1. Apri il browser
2. Premi **menu** → **Aggiungi alla schermata home**
3. Dai un nome all'app
4. Conferma

## 📦 Files Necessari

Per il funzionamento completo, assicurati di avere:

```
index.html          ← File principale (aggiornato per mobile)
app.js              ← Logica app (identico al desktop)
style.css           ← Stili (ottimizzato per mobile)
manifest.json       ← Configurazione PWA (NEW)
service-worker.js   ← Funzionamento offline (NEW)
```

## 🌐 Come Ospitare l'App

Hai diverse opzioni gratuite:

### 1. **GitHub Pages** (Gratuito, facile)
- Crea repository su GitHub
- Carica i 5 files
- Abilita GitHub Pages nel repository
- Accedi tramite: `https://tuonome.github.io/portfolio-tracker`

### 2. **Netlify** (Gratuito, veloce)
- Vai su netlify.com
- Drag & drop della cartella con i files
- Ottieni URL automatico

### 3. **Vercel** (Gratuito, velocissimo)
- Vai su vercel.com
- Importa da GitHub o carica i files
- Deploy istantaneo

### 4. **Localhost (Solo local testing)**
```bash
# Se hai Python 3 installato:
python -m http.server 8000

# Se hai Python 2:
python -m SimpleHTTPServer 8000

# Se hai Node.js:
npx http-server
```

Poi accedi a: `http://localhost:8000`

## ✨ Caratteristiche della PWA

✅ **Funziona offline** - Una volta sincronizzati i prezzi, puoi usarla senza internet
✅ **Caching intelligente** - Carica le pagine velocissimo
✅ **Dati salvati localmente** - localStorage mantiene tutti i tuoi portfolio
✅ **Aggiornamenti automatici** - Il service worker si auto-aggiorna
✅ **Responsive design** - Perfetta su smartphone, tablet, desktop

## 🔧 Troubleshooting

### L'app non si installa
- Assicurati di usare **HTTPS** (non HTTP)
- Aspetta 30 secondi dopo il primo caricamento
- Prova con Chrome prima (è il più compatibile)

### I prezzi non si aggiornano offline
- È normale! Offline mostra i dati cacciati
- Connettiti a internet e clicca "Aggiorna Prezzi"

### I dati scompaiono
- I dati sono in localStorage, non sincronizzati su cloud
- Usa il pulsante **"Esporta"** per backup JSON
- Usa il pulsante **"Importa"** per ripristinare

## 📊 Funzionalità Disponibili su Mobile

✅ Dashboard con tutti i portfolio
✅ Creazione/modifica portfolio
✅ Aggiunta prodotti con ticker o valore manuale
✅ Aggiornamento prezzi real-time
✅ Grafico breakdown asset class
✅ Visualizzazione performance
✅ Export/Import dati JSON
✅ Formattazione europea (€1.234,56)
✅ Funzionamento offline

## 📝 Note Importanti

1. **RapidAPI API Key**
   - La API key è nel file app.js
   - Per privacy/sicurezza, considera di cambiarla su tipi di server

2. **HTTPS Obbligatorio**
   - PWA richiede HTTPS (tranne localhost)
   - GitHub Pages, Netlify, Vercel forniscono HTTPS automatico

3. **Backup Dati**
   - Usa "Esporta" regolarmente per backup locale
   - I dati sono salvati solo nello smartphone

## 🎯 Come Usare su Android

1. Installa l'app come descritto sopra
2. Apri l'app dalla home screen
3. Crea primo portfolio
4. Aggiungi investimenti
5. Clicca "Aggiorna Prezzi" per sincronizzare
6. Consulta dashboard, breakdown, performance

**L'app è completamente funzionante su Android come su desktop!** 📱✅

## ❓ Domande Frequenti

**D: Posso usarla offline?**
R: Sì! Una volta sincronizzati i dati, funziona senza internet. I prezzi vengono mostrati dalla cache.

**D: I miei dati sono sicuri?**
R: Sì, rimangono sul tuo dispositivo. Non vengono inviati a server (tranne le richieste API ai prezzi).

**D: Devo scaricare dall'App Store?**
R: No! Installi direttamente dal browser. È più veloce e diretto.

**D: Prende molto spazio?**
R: No! ~500KB. Molto leggero.

**D: Funziona su iPhone?**
R: Sì! Stesso processo, leggermente diverso il menu. Vai su Safari e cerca "Aggiungi a Schermata Home".

---

**Buon uso dell'app!** 📈💪
