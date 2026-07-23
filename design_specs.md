# TuneBox UI/UX Design System & Component Specifications

This document serves as the master design style guide and component specification for TuneBox (Spotify Clone).

---

## 🎨 1. Design Tokens & Color Palette

| Token Name | Hex / Value | Usage Description |
| :--- | :--- | :--- |
| `--background` | `#121212` | App main view container background |
| `--surface-base` | `#000000` | Sidebar and Player Bar solid dark base |
| `--surface-card` | `#181818` | Default background for album cards & quick grid pills |
| `--surface-card-hover` | `#282828` | Hover state for cards, track rows, and list items |
| `--surface-elevated` | `#242424` | Popovers, context menus, and tooltips |
| `--spotify-green` | `#1DB954` | Primary brand action color (Play buttons, active indicators) |
| `--spotify-green-hover` | `#1ED760` | Hover state for primary action buttons (bright energetic green) |
| `--text-primary` | `#FFFFFF` | Track titles, headlines, primary navigation |
| `--text-secondary` | `#B3B3B3` | Artist names, album names, timestamp labels |
| `--text-muted` | `#727272` | Inactive icons, subtle table header text |
| `--border-subtle` | `rgba(255,255,255,0.1)` | Top border for player bar and section dividers |

---

## 📐 2. Layout Architecture

The overall app layout uses a fixed 3-pane responsive grid structure:

```
+-----------------------------------------------------------------------+
|  [Sidebar]  |  [Top Bar / Header]                                     |
|  - Logo     |  - Navigation (Back/Forward)  - Profile Pill            |
|  - Home     |---------------------------------------------------------|
|  - Search   |  [Main Content View Area - Scrollable]                  |
|  - Library  |  - Hero Banner / Greetings                              |
|  - Playlists|  - Horizontal Carousels / Card Grids                    |
|             |  - Track Tables                                         |
+-----------------------------------------------------------------------+
|  [Player Bar - Fixed Bottom (Height: 90px)]                           |
|  (Track Info)          (Playback Controls & Seek Bar)    (Volume & Extra) |
+-----------------------------------------------------------------------+
```

---

## 🧩 3. Component Specs

### A. `<PlayerBar />` (Fixed Bottom Bar)
- **Dimensions**: `height: 90px`, `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `z-index: 50`.
- **Layout**: `flex justify-between items-center px-4 bg-black border-t border-[#282828]`.
- **Left (Now Playing)**:
  - Album cover: `56px x 56px`, `rounded-md`.
  - Title: `text-sm font-medium text-white hover:underline`.
  - Artist: `text-xs text-[#b3b3b3] hover:underline`.
  - Heart icon button (`#b3b3b3` -> `#1db954` when liked).
- **Center (Playback Controls)**:
  - Row 1: Action buttons (`Shuffle`, `Prev`, `Play/Pause` [40px circular `#1db954` button with black icon], `Next`, `Repeat`).
  - Row 2: Seek bar (`text-xs text-[#b3b3b3]` timestamp, scrub bar with background `#4d4d4d` and filled progress `#ffffff` with hover `#1db954` handle).
- **Right (Volume & Utility)**:
  - Queue icon, Connect device icon, Volume icon (`Mute`/`Unmute`), Volume slider track (`width: 96px`).

### B. `<Card />` (Media / Playlist Item)
- **Container**: `p-4 bg-[#181818] hover:bg-[#282828] transition-all duration-300 rounded-lg group cursor-pointer relative`.
- **Cover Image Container**: `aspect-square w-full rounded-md shadow-lg overflow-hidden relative mb-4`.
- **Hover Play Button**: `48px x 48px` circular green button with play icon, positioned bottom-right of image, animated from `translate-y-2 opacity-0` to `translate-y-0 opacity-100 group-hover:opacity-100`.
- **Title**: `font-bold text-white text-base truncate mb-1`.
- **Subtitle**: `text-sm text-[#b3b3b3] line-clamp-2`.

### C. `<TrackRow />` (Playlist Table Item)
- **Grid Layout**: `grid grid-cols-[16px_4fr_3fr_2fr_minmax(120px,1fr)] items-center gap-4 px-4 py-2 rounded-md hover:bg-[#ffffff10] text-[#b3b3b3] text-sm group`.
- **Col 1 (Index / Play)**: Track number `group-hover:hidden`; Play icon `hidden group-hover:block text-white`.
- **Col 2 (Title & Artist)**: Flex container with 40x40 album art thumbnail, title in `text-white font-medium hover:underline`, artist in `text-[#b3b3b3] hover:underline`.
- **Col 3 (Album)**: Album title in `hover:underline`.
- **Col 4 (Date Added)**: Relative or formatted date string (`3 days ago`).
- **Col 5 (Duration & Heart)**: Duration formatted `M:SS`, heart icon revealed on hover.

### D. `<GenreCard />` (Search Page Categories)
- **Container**: `aspect-square p-4 rounded-xl overflow-hidden relative font-bold text-2xl text-white cursor-pointer hover:scale-[1.02] transition-transform`.
- **Angled Image**: Cover thumbnail rotated `-20deg`, offset bottom-right `-15px`, `w-24 h-24 shadow-2xl`.
- **Gradients**: Diverse vibrant background gradients (e.g. `from-pink-600 to-rose-700`, `from-indigo-600 to-purple-800`, `from-emerald-600 to-teal-800`).

---

## 📱 4. Responsive Breakpoints
- **Desktop (`>= 1024px`)**: Full 3-pane layout, 5-6 cards per carousel row, full track table (Index, Title, Album, Date Added, Duration).
- **Tablet (`768px - 1023px`)**: 3-4 cards per carousel row, simplified track table (Index, Title, Duration).
- **Mobile (`< 768px`)**: Collapsible sidebar, mobile navigation header, 2 cards per row.

---

## 🚀 Phase 1 Completion Output
Design specifications, layout architecture, and color tokens defined. Ready for Phase 2 frontend skeleton construction!
