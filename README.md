# Look Closer

An interactive profile of Soniaa S., built by Sarvagya Singh for the i-SmokeStack Developer Challenge.
All content comes from her public LinkedIn profile.

## The five scenes

Each scene shows a different side of her.

| Scene | Shows how she… | What the visitor does |
|---|---|---|
| 01 Notice | sees | Moves a magnifying lens over noise; scrolling grows the lens until everything is clear |
| 02 Connecting the dots | thinks | Scrolls while scattered words settle into a map and connect (Brand → Revenue, …); noise turns into flowing dots |
| 03 From the root | grew | Scrolls while her journey grows as a tree: education as roots, roles as trunk, branches and canopy |
| 04 Make sense of it | helps | Types their own problem; a lens puts the words in order and a clarity card links it to one of her principles; can send it to her |
| 05 Pulse | measures | Sees the page's own visitors as a live funnel, with a dot for themselves |

## Run it on your computer

You need Node.js 18.18 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The site works without a database; the Pulse shows "resting" and sending a card asks people to use LinkedIn instead.

### Turn on the database (MongoDB Atlas)

1. Create a free cluster at mongodb.com/atlas.
2. Database Access → add a user with a password.
3. Network Access → allow `0.0.0.0/0` (Vercel's servers don't have fixed addresses; the password protects the data).
4. Connect → Drivers → copy the connection string.
5. Copy `.env.example` to `.env.local` and paste it as `MONGODB_URI`, with your password filled in.
6. Restart `npm run dev`.

### Read the cards people send (/inbox)

Every clarity card someone sends is saved in MongoDB. To read them, open `/inbox` (for example http://localhost:3000/inbox).
The browser asks you to sign in: type any username and the password you set as `INBOX_PASSWORD` in `.env.local`.
Without `INBOX_PASSWORD`, the inbox stays locked.

### Get an email for each card

Each card is saved first, then emailed to `NOTIFY_EMAIL`. Change that one line to send cards to anyone.
The email's Reply button answers the visitor directly. If the email settings are missing or wrong, the card is still saved and still shows in `/inbox`.

With Gmail as the sender:
1. Turn on 2-Step Verification for the Gmail account.
2. Create an App password at myaccount.google.com/apppasswords.
3. Set `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER` (the Gmail address) and `SMTP_PASS` (the 16-letter App password).

### About the Pulse numbers

The funnel numbers are always real. While there are fewer than 20 visitors, the drawing keeps a typical funnel shape and says "Early days · N visitors so far". A clearly labelled button, "See it with sample numbers", shows what the funnel looks like at scale. Sample numbers are never mixed into the real ones.

## Put it online (Vercel)

1. Push this folder to a new GitHub repository.
2. vercel.com → Add New → Project → pick the repository.
3. Under Environment Variables add `MONGODB_URI`, `INBOX_PASSWORD`, the email settings (`NOTIFY_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) and `NEXT_PUBLIC_SITE_URL` once you know the URL.
4. Deploy.

## How it is built

- **Next.js** (App Router): pages and the backend live in one project.
- **Plain CSS** in `app/globals.css`, with design tokens at the top. No UI kit, so nothing looks templated.
- **Canvas and SVG** for the animations, driven by scroll position in `requestAnimationFrame` loops. No animation library.
- **Lenis** for smooth scrolling.
- **MongoDB** for two collections: `events` (anonymous funnel steps) and `submissions` (clarity cards people chose to send).

### API routes

| Route | What it does |
|---|---|
| `POST /api/event` | Saves one anonymous event: `page_view`, `lens_used`, `pair_opened`, `chaos_submitted`, `contact_shared`, `linkedin_clicked` |
| `POST /api/connect` | Validates and saves a clarity card (needs an email and consent; a hidden field catches bots) |
| `GET /api/pulse` | Counts distinct visitors at each funnel step, plus the most explored connection and most common problem area |

### Privacy

Visitors get a random id kept in `sessionStorage` (no cookies). No IP addresses are stored. A name and email are saved only when someone ticks the consent box and sends their card.

### Accessibility

Real buttons and labels throughout, visible focus rings, and the hero quote is a real heading for screen readers. With "reduce motion" switched on, jitter, zoom and smooth scrolling are turned off.

## Files

```
app/layout.js              fonts, title, link-preview text
app/page.js                the five scenes in order
app/globals.css            design tokens and all styles
app/api/event/route.js     anonymous engagement events
app/api/connect/route.js   saving clarity cards
app/api/pulse/route.js     funnel totals
components/Hero.jsx        01 Notice
components/Connect.jsx     02 Connecting the dots
components/Root.jsx        03 From the root
components/MakeSense.jsx   04 Make sense of it
components/Pulse.jsx       05 Pulse
components/Closing.jsx     closing call to action
components/icons.jsx       line icons
lib/journey.js             what this visitor has done + tracking
lib/mongodb.js             database connection
```
