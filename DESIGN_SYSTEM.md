# Faraday — Design System

> Source de vérité pour les agents développeurs du monorepo.
> Brandbook complet interactif : `design/brand-identity.html`

---

## 1. Couleurs

### Palette principale

| Nom | Hex | OKLCH (web) | Usage |
|-----|-----|-------------|-------|
| **Ink Charcoal** | `#151D2A` | `oklch(0.2 0.02 260)` | Texte principal, fond sombre, logo primary |
| **Porcelain** | `#F6F3EC` | `oklch(0.97 0.007 90)` | Fond clair principal |
| **Sage Mist** | `#C5CFBF` | `oklch(0.83 0.03 135)` | Accent nature, fond alternatif |
| **Lake** | `#4A8395` | `oklch(0.56 0.07 220)` | Accent froid, liens, éléments interactifs |
| **Ember** | `#FF9361` | `oklch(0.77 0.15 55)` | Accent chaud, LED core, CTA |
| **Muted** | `#69717a` | `oklch(0.52 0.01 250)` | Texte secondaire, labels |

### Combinaisons autorisées

| Fond | Texte/Accent | Usage |
|------|-------------|-------|
| Ink | Porcelain + Ember | ✅ Mode sombre, splash screen |
| Ink | Porcelain + Lake | ✅ Mode sombre alternatif |
| Porcelain | Ink + Ember | ✅ Mode clair, CTA |
| Porcelain | Ink + Lake | ✅ Mode clair, liens |
| Sage | Porcelain | ✅ Déclinaison nature |

### ⛔ Combinaison interdite

> **JAMAIS Sage Mist (#C5CFBF) + Ember (#FF9361) ensemble.**
> Cette combinaison est formellement interdite dans toute la marque.

### Gradients

| Nom | CSS | Usage |
|-----|-----|-------|
| Warm Walnut | `linear-gradient(135deg, rgba(138,122,104,.85), rgba(74,58,40,.9))` | Sur photo, stories |
| Morning Sage | `linear-gradient(135deg, rgba(197,207,191,.82), rgba(197,207,191,.88))` | Sur photo, ambiance nature |
| Deep Ink | `linear-gradient(160deg, rgba(21,29,42,.88), rgba(10,16,24,.92))` | Sur photo, ambiance nuit |
| Linen | `linear-gradient(135deg, #F6F3EC, #ece5d8)` | Fond de section |

---

## 2. Typographie

### Polices

| Police | Poids | Usage |
|--------|-------|-------|
| **Sora** | 300 (Light) | Logo "faraday", titres brand |
| **Sora** | 400 | Titres de section |
| **Sora** | 600 | Titres d'accent |
| **Inter** | 400 | Corps de texte |
| **Inter** | 500 | Labels, sous-titres |
| **Inter** | 600 | Emphasis |
| **Inter** | 700 | Titres UI, kickers |

### Tailles recommandées

| Élément | Taille | Line-height | Letter-spacing |
|---------|--------|-------------|---------------|
| H1 (page) | 28-36px | 1.15 | -0.03em |
| H2 (section) | 20-24px | 1.25 | -0.02em |
| H3 (sous-section) | 16-18px | 1.3 | 0 |
| Body | 14-16px | 1.6 | 0 |
| Small / Label | 10-12px | 1.4 | 0.05-0.1em |
| Kicker | 10px | 1.2 | 0.15em (uppercase) |

---

## 3. Logo — LED Mark

### SVG source de vérité

```svg
<!-- LED Mark complet (avec fond) -->
<svg viewBox="0 0 96 96" fill="none">
  <rect width="96" height="96" rx="26" fill="{BG}"/>
  <rect class="led-shell" x="31" y="14" width="34" height="68" rx="17" stroke="{SHELL}" stroke-width="2.5"/>
  <rect class="led-core" x="43" y="28" width="10" height="40" rx="5" fill="{CORE}"/>
</svg>
```

### Variantes

| Variante | BG | Shell | Core | Fichier |
|----------|----|-------|------|---------|
| **Primary** | Porcelain | Ink | Ember | `exports/logos/led-mark-primary.svg` |
| **Dark** | Ink | rgba(246,243,236,.22) | Ember | `exports/logos/led-mark-dark.svg` |
| **Sage** | Sage | rgba(246,243,236,.5) | Porcelain | `exports/logos/led-mark-sage.svg` |
| **Mono Ink** | transparent | Ink (stroke 4) | Ink | `exports/logos/led-mark-mono-ink.svg` |
| **Mono White** | transparent | White (stroke 4) | White | `exports/logos/led-mark-mono-white.svg` |

### Variantes additionnelles (LED)

| Variante | Fichier |
|----------|---------|
| Core seul Ember | `exports/logos/led-mark-core-ember.svg` |
| Core seul Lake | `exports/logos/led-mark-core-lake.svg` |

### Lockups (mark + texte)

| Fichier | Description |
|---------|-------------|
| `exports/logos/led-lockup-primary.svg` | Mark + "faraday" horizontal, fond clair |
| `exports/logos/led-lockup-dark.svg` | Mark + "faraday" horizontal, fond sombre |
| `exports/logos/led-lockup-stacked.svg` | Mark au-dessus + "faraday" en dessous |

### Règles d'utilisation

- **Taille minimum** : 24px (mark seul), 120px (lockup)
- **Zone de protection** : 25% de la largeur du mark autour
- **Fond minimum** : toujours un fond uni ou un gradient brand. Jamais sur une photo non traitée.
- **Ne jamais** : déformer, tourner, changer les proportions shell/core, ajouter d'ombre portée

---

## 4. Icônes

### Bibliothèque : Heroicons v2 (Tailwind)

- **ViewBox** : 24×24
- **Stroke** : 1.8px
- **Linecap / Linejoin** : round
- **Style par défaut** : Outline
- **Style actif** : Filled (pour nav bar, toggles)
- **Couleur** : Ink sur fond clair, Porcelain sur fond sombre

### Icônes custom Faraday

#### Box — Ultra Minimal (usage principal ★)
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#151D2A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <rect x="7" y="2" width="10" height="16" rx="2"/>
  <ellipse cx="12" cy="20" rx="4" ry="1"/>
  <ellipse cx="12" cy="15" rx=".5" ry="1.3" fill="#FF9361" stroke="none"/>
</svg>
```
Fichiers : `exports/icons/box-minimal.svg`, `exports/icons/box-minimal-white.svg`

#### Box — Détaillée (usage contextuel)
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#151D2A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="12" cy="21.5" rx="5.5" ry="1.5"/>
  <rect x="10.5" y="18" width="3" height="3.5" rx=".5"/>
  <rect x="5.5" y="3" width="13" height="15" rx="2"/>
  <path d="M5.5 5 Q5.5 3 7.5 3 M18.5 5 Q18.5 3 16.5 3"/>
  <rect x="7.5" y="5" width="9" height="11" rx="1.5" stroke-width="1" opacity=".3"/>
  <circle cx="12" cy="17" r=".8" fill="#FF9361" stroke="none"/>
</svg>
```
Fichiers : `exports/icons/box-detailed.svg`, `exports/icons/box-detailed-white.svg`

#### Flatline
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="#151D2A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 12 Q5 7 8 12 Q9.5 14.5 11 12 Q12 10.5 13 12 L22 12"/>
</svg>
```
Fichiers : `exports/icons/flatline.svg`, `exports/icons/flatline-white.svg`

---

## 5. Animations LED

12 animations CSS prêtes à l'emploi dans `exports/animations.css`.

| Classe | Nom | Durée | Usage |
|--------|-----|-------|-------|
| `.anim-breathe` | Breathe | 3.6s | État par défaut, idle |
| `.anim-rise` | Rise | 2.9s | Apparition, onboarding |
| `.anim-blink` | Blink | 4.2s | Notification légère |
| `.anim-morse` | Morse | 4s | Communication |
| `.anim-dim` | Dim | 5s | Mode silencieux |
| `.anim-heart` | Heart | 2.4s | Session en cours |
| `.anim-pendulum` | Pendulum | 4s | Attente |
| `.anim-flicker` | Flicker | 4s | Connexion |
| `.anim-slow` | Slow Fade | 5s | Transition douce |
| `.anim-glow-pulse` | Glow Pulse | 3s | État actif lumineux |
| `.anim-sos` | SOS | 6s | Alerte urgente |
| `.anim-notify` | Notify | 3s | Notification rapide |

Les éléments SVG doivent porter les classes `.led-core`, `.led-shell`, `.led-aura`.

---

## 6. App Icons

| Fichier | Usage |
|---------|-------|
| `exports/app-icons/app-icon-1024.svg` | iOS App Store / Android Play Store |
| `exports/app-icons/favicon.svg` | Favicon site web |

---

## 7. Composants UI

### Radius (source: `packages/tokens/src/radius.ts`)

| Token | Valeur | Usage |
|-------|--------|-------|
| `sm` | 7.2px | Badges, tags |
| `md` | 9.6px | Boutons, inputs |
| `lg` | 12px | Cards |
| `xl` | 16.8px | Modals |
| `2xl` | 21.6px | Sections |
| `3xl` | 26.4px | LED mark bg (rx=26) |

### Ombres

| Niveau | CSS | Usage |
|--------|-----|-------|
| Subtle | `0 2px 8px rgba(17,22,29,.04)` | Cards au repos |
| Medium | `0 8px 24px rgba(17,22,29,.06)` | Cards hover, photos |
| Strong | `0 20px 60px rgba(17,22,29,.1)` | Modals, menus |

---

## 8. Ton & Voix

- **Chaleureux** mais pas niais
- **Direct** mais pas agressif
- **On parle comme un ami** bienveillant qui a compris quelque chose avant les autres
- Vocabulaire : déposer, respirer, déconnecter, retrouver
- ⛔ Jamais : "digital detox", "addiction au téléphone", "respirez, vivez"
- Tagline : **"Déposez. Déconnectez."**

---

## 9. Bannières réseaux sociaux

Page de prévisualisation : `design/social-banners.html`

| Format | Dimensions | Usage |
|--------|-----------|-------|
| Instagram Post | 1080×1080 | Feed |
| Instagram Story | 1080×1920 | Stories |
| LinkedIn Banner | 1584×396 | Couverture profil |
| Twitter/X Header | 1500×500 | Header profil |
| OG Image | 1200×630 | Previews de liens (clair + sombre) |

Chaque bannière disponible en version statique et animée (LED breathe).

---

## ⚠️ Dossiers

| Chemin | Statut | Description |
|--------|--------|-------------|
| `design/brand-identity.html` | ✅ Source de vérité | Brandbook complet interactif |
| `design/DESIGN_SYSTEM.md` | ✅ Ce fichier | Guidelines agents |
| `design/exports/` | ✅ Livrables finaux | SVG, CSS, icônes |
| `design/social-banners.html` | ✅ Outil | Prévisualisation bannières |
| `design/research/` | ⛔ Archive | Ne pas lire ni modifier |
| `packages/tokens/` | ✅ Tokens partagés | Couleurs + radius web/mobile |
