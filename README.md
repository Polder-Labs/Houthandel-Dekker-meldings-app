# 🌲 HoutVeilig - Meldingsapp Houtbranche

Een mobiele webapp (PWA) voor het melden van gevaarlijke situaties en schades in de houtbranche.

## ✨ Functies

- **📷 Foto's maken** - Maak direct foto's met de camera of kies uit de galerij (max 5)
- **📝 Meldingsformulier** - Kies type melding, prioriteit en beschrijf de situatie
- **📍 GPS Locatie** - Automatische locatiebepaling met Google Maps link
- **📧 E-mail verzending** - Verstuur het rapport met alle gegevens via e-mail
- **💾 Lokaal opslaan** - Bewaar meldingen op het apparaat
- **📱 PWA** - Installeerbaar als app op telefoon, werkt offline

## 🏗️ Meldingstypes

| Type | Beschrijving |
|------|-------------|
| ⚠️ Gevaarlijke situatie | Situaties die direct gevaar opleveren |
| 🔨 Schade | Beschadigingen aan materiaal of omgeving |
| 🚨 Bijna ongeval | Situaties die net goed afliepen |
| 🖐️ Onveilige handeling | Onveilig gedrag geconstateerd |
| 🔧 Defect materiaal | Kapot of slecht functionerend materiaal |
| 📌 Overig | Overige meldingen |

## 🚀 Gebruik

### Optie 1: Direct openen
1. Open `index.html` in een browser op uw telefoon
2. Of host de bestanden op een webserver

### Optie 2: Als PWA installeren (aanbevolen)
1. Host de bestanden op een HTTPS webserver
2. Open de URL in Chrome/Safari op uw telefoon
3. Tik op "Toevoegen aan beginscherm" / "Installeren"
4. De app werkt nu als een native app

### Optie 3: Lokaal testen
```bash
# Met Python
python -m http.server 8080

# Met Node.js
npx serve .

# Met PHP
php -S localhost:8080
```

## 📋 Hoe een melding maken

1. **Selecteer type** - Kies het type melding
2. **Maak foto's** - Neem foto's van de situatie
3. **Vul beschrijving in** - Naam, locatie, prioriteit en beschrijving
4. **GPS locatie** - Wordt automatisch opgehaald
5. **Verzend** - Stuur via e-mail of sla lokaal op

## 🎨 App iconen genereren

1. Open `generate-icons.html` in een browser
2. Klik op "Genereer & Download Alle Iconen"
3. Plaats de gedownloade PNG bestanden in de `icons/` map

## 📁 Bestandsstructuur

```
├── index.html              # Hoofdpagina
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker (offline)
├── generate-icons.html     # Icoon generator
├── css/
│   └── style.css          # Styling
├── js/
│   └── app.js             # Applicatie logica
└── icons/
    └── icon.svg           # App icoon (SVG)
```

## 📱 Technische Details

- **Pure HTML/CSS/JS** - Geen frameworks nodig
- **Responsive** - Geoptimaliseerd voor mobiel
- **PWA** - Installeerbaar, offline beschikbaar
- **Camera API** - Direct foto's nemen
- **Geolocation API** - GPS coördinaten
- **Web Share API** - Delen met foto's (op ondersteunde apparaten)
- **LocalStorage** - Lokale opslag van meldingen

## 🔒 Privacy

- Alle data blijft op het apparaat (localStorage)
- Foto's worden niet naar een server gestuurd
- Locatie wordt alleen opgehaald met toestemming
- E-mail wordt via het standaard e-mailprogramma verstuurd

## 🌐 Browser Ondersteuning

| Browser | Ondersteuning |
|---------|--------------|
| Chrome (Android) | ✅ Volledig |
| Safari (iOS) | ✅ Volledig |
| Firefox | ✅ Volledig |
| Samsung Internet | ✅ Volledig |
| Edge | ✅ Volledig |

---

*Gemaakt voor de houtbranche - Veiligheid voorop! 🌲*
