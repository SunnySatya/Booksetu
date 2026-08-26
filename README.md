# BookSetu — MERN Full Stack

Buy/Sell/Exchange/Rent used books marketplace.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS, Socket.IO client
- **Backend:** Node.js + Express (ESM), JWT auth (bcrypt), Mongoose
- **Realtime:** Socket.IO — live chat sync, instant notifications, content updates
- **Database:** MongoDB

## Project structure

```
Booksetu/
├── client/          # React frontend (Vite)
│   └── src/
│       ├── api.js           # fetch wrapper + token helpers
│       ├── socket.js        # socket.io client (chat/notif/content events)
│       ├── context/         # AuthContext (JWT), ShopContext (cart/wishlist)
│       ├── utils/           # listingStore, chatStore, notificationStore,
│       │                    # contentStore, userStore  (API-backed)
│       └── pages/           # Home, Listing, Cart, Wishlist, Profile,
│                            # Dashboard, Admin, Auth/*
└── server/          # Express API
    └── src/
        ├── models/   # User, Listing, Message, Notification, AppContent
        ├── routes/   # auth, users(admin), listings, chat, notifications, content
        ├── middleware/auth.js  # JWT verify + admin guard
        └── server.js # express + socket.io bootstrap
```

## Setup & Run

### 1. Backend

```bash
cd server
npm install
copy .env.example .env        # phir JWT_SECRET edit karein
node src/seed.js              # admin user + sample listings (ek baar)
npm run dev                   # http://localhost:5000
```

MongoDB locally chal raha hona chahiye (`mongodb://127.0.0.1:27017`) ya `.env`
me Atlas URI daalein.

**Seed se banta hai:** `admin@booksetu.com` / `admin123` (isAdmin) — is email se
login karne par seedha Admin Dashboard khulta hai (location popup skip hota hai).

### 2. Frontend

```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```

Alag port/backend URL ke liye `client/.env` me:

```
VITE_API_URL=http://localhost:5000/api
```

## Features

- JWT auth (register/login/me/update profile), role-based admin
- Listings CRUD (photos base64-resized client side, max 4)
- Real-time chat per book conversation + **price offers** (accept/decline)
- Notifications (auto: offer/deal/listing + admin broadcast) — live bell dropdown
- Admin dashboard: books/users/chats/notifications manage + hero slider &
  quotes content management + danger-zone reset
- Cart & wishlist (device-local by design), search, categories, responsive UI

## Notes / Next steps

- Cart/wishlist abhi device-local hain; multi-device sync chahiye to User model
  me embed karke `/api/cart` `/api/wishlist` endpoints add karein.
- Production me: `JWT_SECRET` strong rakhein, CORS origin lock karein, images
  ke liye S3/Cloudinary use karein, rate-limit lagayein.
