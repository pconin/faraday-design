# Design

## Source de vérité

| Fichier | Description |
|---------|-------------|
| `brand-identity.html` | Brandbook complet interactif (16 sections) |
| `social-banners.html` | Prévisualisation des bannières réseaux sociaux |
| `content-redaction.html` | Territoire éditorial, catchlines et guidelines de rédaction |
| `DESIGN_SYSTEM.md` | Guidelines pour les agents développeurs |

## Exports (`exports/`)

| Dossier | Contenu |
|---------|---------|
| `exports/logos/` | 10 SVG : LED mark (7 variantes) + 3 lockups |
| `exports/icons/` | 6 SVG : Box minimal/detailed + Flatline (ink & white) |
| `exports/app-icons/` | App icon 1024, favicon SVG |
| `exports/animations.css` | 12 animations LED CSS standalone |
| `exports/deliverables/` | Pack social complet : logos raster, bannières statiques, loops animés, manifest, ZIP |

## Tokens partagés

Les design tokens (couleurs, radius) sont dans `packages/tokens/`.
Ils sont synchronisés entre web (globals.css) et mobile (React Native).

## Archive de recherche

> Le dossier `research/` contient toutes les itérations de recherche.
> **Ne pas lire ni modifier** — ces fichiers ne sont pas la direction retenue.
> Seuls les fichiers à la racine de `design/` et dans `exports/` font autorité.
