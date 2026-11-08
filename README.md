# CineVerse — 3D movie ticket booking

React · Three.js (React Three Fiber + drei) · GSAP (+ ScrollTrigger) · Zustand · Lenis · React Router · Vite

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in /dist
npm run preview    # serve the build locally
```

Deploy to **Vercel** or **Netlify** by importing the folder. The build command is `npm run build` and the output folder is `dist`. The `vercel.json` and `public/_redirects` files are already set up so page links work.

---

## Where to put your images and trailers

Put every file inside **`public/assets/`**. The file name must match the item's **id**, and each folder has a `_FILE_NAMES.txt` that lists the exact names it expects.
You don't need to change any code. Restart `npm run dev` (or just refresh the page) and your files replace the generated placeholder art automatically.

```
public/
└── assets/
    ├── posters/      <movieId>.jpg   portrait 2:3  (1000×1500)   → 3D ring, cards, movie page, search
    ├── backdrops/    <movieId>.jpg   wide 16:9     (1920×1080)   → ticket header, trailer cover image
    ├── trailers/     <movieId>.mp4   MP4 H.264     (720p/1080p)  → full-screen movie page + 3D cinema screen
    ├── snacks/       <snackId>.jpg   4:3           (800×600)     → snacks step
    ├── events/       <eventId>.jpg   16:10         (960×600)     → events / plays / sports cards
    └── brand/        favicon.png                                 → browser tab icon
```

Examples:

| What | File |
|---|---|
| Jailer 2 poster | `public/assets/posters/jailer2.jpg` |
| Jailer 2 trailer | `public/assets/trailers/jailer2.mp4` |
| Jailer 2 wide still | `public/assets/backdrops/jailer2.jpg` |
| Salted popcorn photo | `public/assets/snacks/p1.jpg` |
| Improv Jam banner | `public/assets/events/improv-jam.jpg` |

* `.jpg`, `.jpeg`, `.webp` and `.png` all work for images.
* Trailers must be **.mp4** files with H.264 video so they play on iPhone Safari. Keep each one under about 30 MB. To shrink a large trailer:
  `ffmpeg -i in.mov -vf scale=-2:1080 -c:v libx264 -preset veryfast -crf 24 -c:a aac -movflags +faststart jailer2.mp4`
* If a file is missing, the site uses the generated art (or an emoji for snacks), so nothing breaks.

### All movie ids
`vikram, leo, coolie, varanasi, toxic, jailer2, ramayana, war2, animal, kantara, pushpa2, empuraan, kalki, manjummel, stree2, kgf2`

### All snack ids
`c1 c2 c3` (combos) · `p1 p2 p3` (popcorn) · `s1 … s6` (snacks) · `b1 … b4` (beverages). The full list is in `public/assets/snacks/_FILE_NAMES.txt`.

---

## Editing content

| Change | File |
|---|---|
| Movies (title, cast, rating, language, status `now` / `prebook`, synopsis) | `src/data/movies.js` |
| Order of screens in the home 3D ring | `FEATURED` in `src/data/movies.js` |
| Add a movie | Add an object to `MOVIES` with a new `id`, then add `posters/<id>.jpg` etc. |
| Snacks & prices | `src/data/snacks.js` |
| Events / plays / sports | `src/data/events.js` |
| Cities & theatre names | `src/data/cities.js` |
| Seat classes & prices | `src/data/seatClasses.js` |
| Colours, fonts, layout | `src/styles/global.css` (variables at the top) |

A movie can also point at a file with a custom name or location:
`{ id: 'leo', poster: '/assets/posters/leo-final.webp', trailer: 'https://cdn.example.com/leo.mp4', ... }`

---

## Project map

```
src/
├── App.jsx                  routes, Lenis smooth scroll, GSAP page transitions
├── pages/
│   ├── Home.jsx             3D hero ring + Now Showing 3D carousel + sections
│   ├── MoviePage.jsx        full-screen trailer, details, showtimes
│   ├── Seats.jsx            3D seat selection UI (panel, best seats, views)
│   ├── Snacks.jsx · Review.jsx · Pay.jsx · Ticket.jsx · MyTickets.jsx
│   ├── Movies.jsx · Events.jsx
├── three/
│   ├── HeroRing.jsx         R3F ring of screens (drag, GSAP snap, autoplay)
│   └── hall/
│       ├── Hall.jsx         R3F cinema hall: room, instanced seats, screen, camera rig
│       └── layout.js        rows/seat positions, best-seat finder, occupancy
├── components/              Nav, cards, trailer player, order summary, overlays
├── lib/media.js             finds your files in public/assets (with fallbacks)
├── lib/posterArt.js         generated placeholder art
├── store/useStore.js        Zustand store (city, user, booking, tickets → localStorage)
└── data/                    all editable content
```

## Booking flow
Movie → Theatre & time → 3D seat pick → Snacks → Review → Pay → ticket ID + QR code → saved to "My tickets"

## Going live (what's still demo)
* **Payment:** `src/pages/Pay.jsx` fakes a payment with a timeout. Replace it with Razorpay, Stripe, PhonePe or another gateway.
* **Sign-in:** `SignModal` in `src/components/Nav.jsx` stores the name and phone locally. Connect it to your OTP or auth service.
* **Showtimes and occupancy:** generated from a seed in `src/lib/util.js` (`getShows`) and `src/three/hall/layout.js` (`soldSeats`). Replace them with your API.
* **Tickets:** stored in the visitor's browser (localStorage). Save them to your backend to keep them across devices.
