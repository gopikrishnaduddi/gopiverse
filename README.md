<div align="center">

# 🎬 GopiVerse

### Book movies in 3D. Pick your seat inside a real cinema hall before you go.

A premium movie, events, plays and sports ticket-booking web app, inspired by BookMyShow and rebuilt with immersive 3D.
It covers Tamil, Telugu, Kannada, Malayalam and Hindi cinema, from a drag-to-explore ring of screens on the home page to a fully navigable 3D auditorium.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r169-000000?logo=three.js&logoColor=white)
![React Three Fiber](https://img.shields.io/badge/React_Three_Fiber-8-black)
![GSAP](https://img.shields.io/badge/GSAP-3-88CE02?logo=greensock&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-4-443E38)

</div>

---

## 📸 Screenshots

<!-- Save your screenshots in docs/screenshots/ with these names and they will show up here -->

| Home — 3D ring of screens | Now showing |
|---|---|
| ![Home](docs/screenshots/home.png) | ![Now showing](docs/screenshots/now-showing.png) |

| Movie page | 3D seat selection |
|---|---|
| ![Movie page](docs/screenshots/movie.png) | ![3D hall](docs/screenshots/seats.png) |

| View from your seat | M-ticket |
|---|---|
| ![Seat view](docs/screenshots/seat-view.png) | ![Ticket](docs/screenshots/ticket.png) |

---

## ✨ Features

### 🏠 Home
- **Film-leader intro.** A 3 · 2 · 1 projector countdown and logo reveal, once per visit. Tap or press any key to skip. It's skipped automatically when the device asks for reduced motion.
- **3D panorama hero.** A curved ring of cinema screens rendered in WebGL with reflections. Drag to spin (with inertia), and it snaps to the nearest screen. The camera follows your mouse slightly, and a hovered screen lifts towards you. It auto-rotates every 5.2 seconds.
- **Now showing.** A 3D spinning carousel. Drag to spin, hover to pause, filter by language.
- **Offers for you** with one-tap *Copy code*, a **Continue booking** banner while seats are on hold, coming soon / pre-book and live events.

### 🎞️ Movie page
- Full-screen **trailer** autoplays (muted) and pauses itself when scrolled away.
- **Theatre mode:** the trailer plays full screen like a real cinema, with the picture's colours glowing onto the room, a reflection on the floor and a row of seats in front of you. Space pauses, M mutes, Esc closes.
- **Showtimes** for 7 days with language, format and time-of-day filters (Morning · Afternoon · Evening · Night) on a bar that stays at the top while you scroll. Times that have already started today are hidden.
- **Hover a showtime** (desktop) to see every seat class's price and how full it is. Button colours come from the real seats left.
- **♥ Favourite theatres** always show first. Plus *I'm interested* for pre-book films, Share, and **You might also like**.

### 💺 3D seat selection (the main feature)
- A realistic **3D auditorium**: curved stadium rows with half-step aisle lights, a curved screen behind velvet curtains that open when you walk in, a balcony with a glass rail, quilted acoustic walls with wall-washer lights, surround speakers, EXIT doors, a starlight ceiling with downlights and a projector beam. **The screen's colours light up the room** as the film plays.
- **Realistic seats**: fabric seats with cupped backs, headrests and cup-holders; leather couple recliners with consoles; row-letter plates on every aisle seat; and **people sitting in booked seats** (some with popcorn and drinks).
- **How many seats?** picker first (BookMyShow-style), then **tap one seat and the rest of your tickets fill in side by side**.
- **2D seat map** next to the 3D hall, showing where the camera is standing.
- **View quality** for your seats: stars, distance to the screen, how much of your view it fills, and the angle.
- **"See the screen from your seat"**, then drag to look around.
- **✦ Best N seats**, four camera views and an automatic **Tour**, house lights on/off, audience on/off, sound on/off and HD on/off.
- **Adapts to the device**: a full-quality version with ambient occlusion and glow on strong computers, and a lighter version (fewer polygons and lights) on phones and slower devices.

### 🍿 Checkout
- **Seats are held for 10 minutes** with a countdown. When it runs out, you're asked to pick seats again.
- **Snacks** with Regular/Large sizes, Bestseller tags, a veg-only filter, delivery to your seat or counter pickup, and a mobile cart bar.
- **Review** with offer codes (`CINE10`, `GOPI50`, `SNACK20`, each with its own rules) and optional **cancellation protection**.
- **Payment** (demo) with UPI, card, net banking and wallet options and a 3-step confirmation.

### 🎟 After booking
- **M-ticket** with QR code, a holographic tilt and a countdown to the show.
- **Download** the ticket as an image, **Add to calendar** (with a 1-hour reminder), **View my seat in 3D**, and **Cancel booking** with a refund (100% with protection, otherwise 80%).
- **My tickets** with Upcoming / Past / Cancelled tabs.

### 🔎 Everywhere
- **Search** across movies, people, theatres and events, with grouped results, highlighted matches, arrow-key navigation, recent searches and trending. Press **Ctrl + K** (or **/**) from any page.
- A theatre's page shows everything playing there today.
- **Mobile bottom navigation**, city picker with 9 cities, sign-in (demo) with an account summary.
- Smooth scrolling (Lenis), GSAP page transitions, scroll reveals and keyboard focus outlines. Fully **responsive**.

---

## 🛠 Tech stack

| Area | Tools |
|---|---|
| UI | React 18, React Router 6 |
| 3D | Three.js, React Three Fiber, drei, @react-three/postprocessing (bloom) |
| Animation | GSAP 3 + ScrollTrigger, Lenis smooth scroll |
| State | Zustand (saved to localStorage) |
| Build | Vite 5 |
| Extras | qrcode.react, html-to-image (ticket download) |

---

## 🚀 Getting started

**You need:** Node.js 18 or newer.

```bash
git clone https://github.com/<your-username>/gopiverse.git
cd gopiverse
npm install
npm run dev
```

Open **http://localhost:5173**.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build in `dist/` |
| `npm run preview` | Preview the production build |

---

## 🖼 Adding posters, trailers and photos

Every image and video lives in **`public/assets/`**, and each file is **named after the item's id**. No code changes are needed: add a file, refresh, and it appears everywhere it's used.
Anything missing falls back to generated artwork, so the app always works.

```
public/assets/
├── posters/     <movieId>.jpg    portrait 2:3  (1000×1500)  → 3D ring, cards, movie page, search
├── backdrops/   <movieId>.jpg    wide 16:9     (1920×1080)  → ticket header, trailer cover
├── trailers/    <movieId>.mp4    MP4 H.264     (720p/1080p) → movie page + 3D cinema screen
├── cast/        <name>.jpg       square        (400×400)    → cast & crew circles
├── snacks/      <snackId>.jpg    4:3           (800×600)    → snacks step
├── events/      <eventId>.jpg    16:10         (1920×1200)  → events / plays / sports
├── cities/      <city>.png       square, transparent        → city picker icons
├── payments/    upi.png · card.png · netbanking.png · wallet.png  → payment logos
└── brand/       favicon.png                                 → browser tab icon
```

Each folder contains a **`_FILE_NAMES.txt`** that lists the exact file names it expects.

**Movie ids:**
`vikram` · `leo` · `coolie` · `varanasi` · `toxic` · `jailer2` · `ramayana` · `war2` · `animal` · `kantara` · `pushpa2` · `empuraan` · `kalki` · `manjummel` · `stree2` · `kgf2`

**Examples:**

| What | File |
|---|---|
| Jailer 2 poster | `public/assets/posters/jailer2.jpg` |
| Jailer 2 trailer | `public/assets/trailers/jailer2.mp4` |
| Yash (cast photo) | `public/assets/cast/yash.jpg` |
| Salted popcorn | `public/assets/snacks/p1.jpg` |
| Delhi NCR icon | `public/assets/cities/delhi-ncr.png` |

**Tips:**
- `.jpg`, `.jpeg`, `.webp` and `.png` all work for images.
- Trailers must be **MP4 (H.264 + AAC)** to play on iPhone. To convert one:
  `ffmpeg -i input.mkv -vf scale=-2:1080 -c:v libx264 -crf 24 -c:a aac -movflags +faststart jailer2.mp4`
- On Windows, turn on *File name extensions* in File Explorer so you don't end up with `jailer2.jpg.jpg`.

> ⚠️ **Before pushing to a public repo:** official posters, trailers and cast photos belong to their studios and photographers, so think about keeping them out of the repository. Also, **GitHub rejects files over 100 MB**. To keep trailers local only, add this to `.gitignore`:
> ```
> public/assets/trailers/*.mp4
> ```

---

## ✏️ Editing content

| Change | File |
|---|---|
| Movies (title, cast, rating, languages, `now` / `prebook`, synopsis) | `src/data/movies.js` |
| Order of screens in the home 3D ring | `FEATURED` in `src/data/movies.js` |
| Snacks and prices | `src/data/snacks.js` |
| Events, plays and sports | `src/data/events.js` |
| Cities and theatre names | `src/data/cities.js` |
| Seat classes and prices | `src/data/seatClasses.js` |
| Offer codes and their rules | `src/data/offers.js` |
| Payment methods (and logo links) | `src/data/payments.js` |
| How curved the rows / screen are | `CZ` and `SCREEN.curve` in `src/three/hall/layout.js` |
| Colours, fonts, layout | `src/styles/global.css` (variables at the top) |

**To add a new movie,** add an object to `MOVIES` with a new `id`, then add `posters/<id>.jpg` (and optionally a trailer, backdrop and cast photos).

---

## 🗂 Project structure

```
src/
├── App.jsx                   routes, Lenis smooth scroll, GSAP page transitions
├── main.jsx
├── pages/
│   ├── Home.jsx              3D hero ring + Now Showing carousel + sections
│   ├── MoviePage.jsx         full-screen trailer, cast, showtimes, language dropdown
│   ├── Seats.jsx             3D seat-selection UI (classes, best seats, views, view quality)
│   ├── Snacks.jsx · Review.jsx · Pay.jsx · Ticket.jsx · MyTickets.jsx
│   └── Movies.jsx · Events.jsx
├── three/
│   ├── HeroRing.jsx          R3F ring of screens (drag, GSAP snap, autoplay)
│   └── hall/
│       ├── Hall.jsx          R3F auditorium: room, seats, curved screen, lights, camera rig
│       └── layout.js         curved rows, seat positions, best-seat finder, occupancy
├── components/
│   ├── Nav.jsx               search (Ctrl+K), city, sign-in, account, theatre page
│   ├── BottomNav.jsx         phone bottom bar
│   ├── Intro.jsx             3·2·1 film-leader intro
│   ├── TheatreMode.jsx       full-screen trailer with ambient light
│   ├── QtyModal.jsx          "How many seats?" + seat availability per class
│   ├── SeatMap.jsx           2D map beside the 3D hall
│   ├── HoldTimer.jsx         10-minute seat hold
│   └── Cards, Order, Trailer, Overlays, useTilt, useReveal …
├── lib/
│   ├── media.js              finds your files in public/assets (with fallbacks)
│   ├── posterArt.js          generated placeholder art
│   ├── util.js               showtimes generator, dates, currency
│   └── audio.js              ambient sound when no trailer exists
├── store/useStore.js         Zustand: city, user, booking, tickets
├── data/                     all editable content
└── styles/global.css
```

---

## 🧠 How it works

Simplified pseudo-code showing the main ideas.

**1. Best seats finder (✦ Best 2 seats)**
```
for each row (optionally one class only):
    for each window of `quantity` side-by-side seats inside one block:
        skip if any seat is sold, crosses an aisle, or splits a couple recliner
        score = distanceFromCentre × 1.2 + distanceFromSweetSpotRow   (balcony weighted lower)
return the window with the lowest score
```

**2. Camera that never goes through walls**
```
every frame:
    move camera along a STRAIGHT line to the target (GSAP)
    clamp position inside walls, below ceiling, above seats and balcony
```

**3. Curved rows**
```
every row is an arc around a point behind the screen
seat position = (r·sin(u/r), rowHeight, centreZ + r·cos(u/r)),  rotation = u/r   → every seat faces the screen
```

**4. Panorama hero**
```
angle += drag velocity → on release GSAP snaps to the nearest screen
every 5.2 s → rotate to the next screen
side screens darker by angle; sky colour = front poster colour
click side screen → bring to front; click front screen → open movie
```

**5. Showtimes (demo data)**
```
seed = hash(movie + city + day + language)    → same input, same result
for each theatre: pick formats and times; shows fill up towards the evening
```

**6. Tap one seat, fill the rest**
```
you need N seats and tap seat S:
    take S, then the free seats next to it in the same block (right side first, then left)
    recliners always come as couple pairs
```

**7. View quality**
```
distance to the screen + how many degrees of your view the screen fills + angle from the centre
→ 1 to 5 stars (Perfect / Great / Good / Okay view)
```

**8. Booking flow**
```
Movie → Theatre & time → How many seats? → 3D seat pick (held 10 min) → Snacks → Review → Pay
→ ticket ID + QR → My tickets (download · calendar · view seat in 3D · cancel)
```

---

## 🌍 Deploy

**Vercel**
1. Push the repo to GitHub.
2. On vercel.com, click **Add New → Project** and import the repo.
3. Framework: **Vite**. Build command: `npm run build`. Output folder: `dist`. Then click **Deploy**.

**Netlify**
- Build command: `npm run build`. Publish directory: `dist`.

`vercel.json` and `public/_redirects` are already included, so links like `/movie/jailer2` work after refreshing the page.

---

## 🔌 Going live (what's still demo)

- [ ] **Payments.** `src/pages/Pay.jsx` simulates payment. Connect Razorpay, Stripe or PhonePe.
- [ ] **Sign-in.** The sign-in form in `src/components/Nav.jsx` saves locally. Connect an OTP or auth provider.
- [ ] **Showtimes and occupancy.** Generated in `src/lib/util.js` and `src/three/hall/layout.js`. Replace them with your API.
- [ ] **Tickets.** Stored in localStorage. Save them to a backend so they sync across devices.

---

## 🩺 Troubleshooting

| Problem | Fix |
|---|---|
| `Failed to resolve import "@react-three/postprocessing"` | Run `npm install` in the folder that contains `package.json` |
| Image doesn't show | Check the name is lowercase and matches the id, and isn't `name.jpg.jpg`. Then hard-refresh with Ctrl + Shift + R |
| Trailer doesn't play | It must be MP4 (H.264) and saved in `public/assets/trailers/` |
| No sound in the 3D hall | Click **🔇 Sound** (bottom-right of the hall) to turn it on |
| 3D hall feels slow | Turn **HD** off (bottom-right of the hall). Slow devices also switch to the lighter version by themselves |
| Payment logos show emojis | Add `upi.png`, `card.png`, `netbanking.png`, `wallet.png` to `public/assets/payments/`, or paste links into `logo` in `src/data/payments.js` |
| Want to see the intro again | It plays once per browser session. Open the site in a new tab |

---

## 📄 Disclaimer

GopiVerse is a **demo / portfolio project**. Movie titles, cast names, logos, posters and trailers belong to their respective owners and are used for demonstration only. Showtimes, prices, ratings and seat availability are sample data. No real payments are processed.

---

<div align="center">

**GopiVerse** · Your seat is waiting. Lights down. Phones off. 🍿

Designed and built by Gopi, with help from Claude (Anthropic's AI assistant).

</div>
