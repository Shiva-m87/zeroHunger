# 🍲 ZeroHunger — Food Donation & Delivery Platform

A MERN stack web app that tackles **UN Sustainable Development Goal 2 (Zero Hunger)** by connecting people who have **surplus food** with **NGOs** who can serve it, before it goes to waste.

Donors list extra food → nearby verified NGOs claim it → the NGO's own delivery person picks it up using the **shortest road route** → donor and NGO **track the delivery live** → **OTPs** confirm the hand-over at pickup and drop.

---

## ✨ Features

| Role | What they can do |
|---|---|
| **Donor** (restaurant, household, caterer) | Add food with details (veg/non-veg, cooked/raw/packaged, quantity, safe-till time, notes, pickup location on map) · see status of every donation · share pickup OTP · track delivery live · impact stats |
| **NGO** | Must be verified by admin · see available food **within X km, most urgent first** (map + list) · claim food (race-safe, only one NGO can win) · create logins for its own delivery staff · assign delivery · share delivery OTP · track live |
| **Delivery person** (belongs to an NGO) | See assigned tasks · **shortest route** me → donor → NGO (OSRM) · one-tap Google Maps navigation · shares **live GPS location** · confirms pickup & delivery with OTPs |
| **Admin** | Verify / revoke NGOs · platform statistics |

Other things handled:
- **Auto-expiry**: unclaimed food is marked expired automatically when its safe time is over.
- **Real-time updates** (Socket.IO): dashboards refresh by themselves when food is added, claimed, picked up or delivered.
- **Role-based access** on every API route (JWT + middleware).
- **Privacy**: each OTP is only visible to the person who should give it.

---

## 🔄 Workflow

```
 Donor adds food ──► AVAILABLE ──(NGO claims)──► CLAIMED ──(NGO assigns its delivery person)──► ASSIGNED
                        │                                                                           │
               (time over / donor cancels)                                      (pickup OTP from donor)
                        ▼                                                                           ▼
                EXPIRED / CANCELLED                     DELIVERED ◄──(delivery OTP from NGO)── PICKED_UP
```

---

## 🛠 Tech Stack

- **Frontend:** React (Vite), React Router, Axios, React-Leaflet (OpenStreetMap), Socket.IO client
- **Backend:** Node.js, Express 5, Socket.IO, JWT, bcrypt
- **Database:** MongoDB + Mongoose (with a **2dsphere geospatial index** for "food near me")
- **Routing:** [OSRM](https://project-osrm.org/) public API, free with no API key

---

## 🚀 Run it locally

**Requirements:** Node.js 18+ and MongoDB (local install or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster).

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # then edit .env (MONGO_URI, JWT_SECRET)
npm run seed              # optional: adds demo users + food (deletes existing data!)
npm run dev               # starts on http://localhost:5000
```

### 2. Frontend (new terminal)

```bash
cd client
npm install
npm run dev               # opens on http://localhost:5173
```

### Demo logins (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | admin@zerohunger.test | admin123 |
| Donor | donor@zerohunger.test | donor123 |
| NGO (verified) | ngo@zerohunger.test | ngo123 |
| NGO (not verified) | ngo2@zerohunger.test | ngo123 |
| Delivery (works for the verified NGO) | delivery@zerohunger.test | delivery123 |

**Try the full flow:** log in as NGO → claim food → assign Ravi → log in as delivery in another browser (or incognito) → open the task → enter the donor's pickup OTP → enter the NGO's delivery OTP.

> Live GPS needs location permission in the browser. On a laptop the browser uses Wi-Fi-based location.

---

## 🌍 Deploy (free) on Render

The repo includes a `render.yaml` blueprint that creates both the backend and the frontend.

1. In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0` (Render's IP address changes).
2. Push this project to GitHub.
3. On [render.com](https://render.com): **New + → Blueprint** → choose the repo.
4. Fill in `MONGO_URI` (Atlas connection string), `CLIENT_URL` (the web URL) and `VITE_API_URL` (the api URL) → **Apply**.
5. Wait for both services to go live, then open the `zerohunger-web` URL.

> Free Render services sleep after 15 minutes without visitors; the first request after that takes ~50 seconds to wake up.

---

## 📁 Project Structure

```
zeroHunger/
├── server/
│   ├── server.js              # Express app + Socket.IO + expiry job
│   ├── socket.js              # live location tracking
│   ├── seed.js                # demo data
│   ├── config/db.js
│   ├── models/                # User, Donation (schemas)
│   ├── middleware/auth.js     # protect + allowRoles
│   ├── controllers/           # business logic
│   ├── routes/                # URL → controller
│   └── utils/helpers.js       # token, OTP, distance, permissions
└── client/
    └── src/
        ├── App.jsx            # all routes
        ├── api.js, socket.js  # backend connection
        ├── context/           # logged-in user (AuthContext)
        ├── components/        # Navbar, maps, badges...
        ├── utils/             # formatting, routing (OSRM), live refresh hook
        └── pages/             # donor/, ngo/, delivery/, admin/, Login, Register, Track
```

---

## 📡 API Endpoints

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Sign up as donor / NGO |
| POST | `/api/auth/login` | public | Log in, returns JWT |
| GET | `/api/auth/me` | any | Current user |
| POST | `/api/donations` | donor | Add food |
| GET | `/api/donations/my` | donor | My donations |
| PATCH | `/api/donations/:id/cancel` | donor | Cancel unclaimed food |
| GET | `/api/donations/nearby?radius=10` | NGO | Available food nearby |
| PATCH | `/api/donations/:id/claim` | NGO | Claim food |
| GET | `/api/donations/claimed` | NGO | My claimed food |
| PATCH | `/api/donations/:id/assign` | NGO | Assign delivery person |
| GET/POST | `/api/ngo/staff` | NGO | List / add delivery staff |
| GET | `/api/donations/tasks` | delivery | My delivery tasks |
| PATCH | `/api/donations/:id/pickup` | delivery | Confirm pickup with OTP |
| PATCH | `/api/donations/:id/deliver` | delivery | Confirm delivery with OTP |
| GET | `/api/donations/:id` | involved users | Donation details |
| GET | `/api/admin/ngos` · PATCH `/api/admin/ngos/:id/verify` · GET `/api/admin/stats` | admin | Verification & stats |

**Socket events:** `track:join`, `location:update` → `location:changed`, `donation:updated`, `donations:changed`

---

## 🌱 Future Ideas

- Food photos (Cloudinary)
- Email / push notifications to nearby NGOs
- Multi-stop route optimisation for several pickups
- Ratings & feedback between donors and NGOs
