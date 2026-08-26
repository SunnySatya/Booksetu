# BookSetu

A hyper-local second-hand book marketplace where users can **buy, sell, rent, and exchange** books within their neighborhood. Built with the MERN stack and real-time chat support.

> "BookSetu" = Book + Setu (bridge) — bridging book buyers and sellers.

---

## Features

### Marketplace
- **4 listing types** — Sell (Single/Bundle), Rent, and Exchange books
- **Condition-based pricing** — Auto-discount calculated from book condition (50-90% off MRP)
- **Category browsing** — Textbooks, Competitive, Stories, Novels, Motivational
- **Book filters** — Medium (Hindi/English), Subject, Class level
- **Distance-based sorting** — Books sorted by proximity using geolocation
- **Search** — Search across all listings by title

### User Features
- **Email + OTP registration** with password strength validation
- **JWT authentication** with 30-day sessions
- **Shopping Cart & Wishlist** — synced to server on login
- **Real-time chat** — Buyer-seller messaging with price negotiation
- **Price offers** — Send, accept, or decline structured price offers
- **Notifications** — Bell icon with unread count, targeted + broadcast
- **Profile management** — Edit name, phone, city
- **Contact options** — In-app chat, phone call, WhatsApp

### Admin Dashboard
- **Overview** — Stats for listings, users, chats, cart items
- **Book management** — View, edit, delete all listings
- **User management** — View users, toggle admin, delete accounts
- **Chat management** — View all conversations, delete threads
- **Notification management** — Send broadcasts, delete notifications
- **Content Management (CMS)**:
  - Hero slider images (up to 8)
  - Category images (up to 4 per category)
  - Rotating inspirational quotes

### Real-Time
- Socket.IO for live chat messages, notifications, and content updates
- Polling fallback every 4-5 seconds

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, React Router 7, Vite 8, Tailwind CSS 3 |
| **Backend** | Node.js, Express 4, Socket.IO 4 |
| **Database** | MongoDB (Mongoose 8) |
| **Auth** | JWT, bcryptjs, OTP via email (Nodemailer) |
| **Geolocation** | Browser Geolocation API, Nominatim/OpenStreetMap reverse geocoding |
| **Deployment** | Render.com (free tier) |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas cluster)
- SMTP credentials (for OTP emails — optional for dev)

### Installation

```bash
# Clone the repo
git clone https://github.com/SunnySatya/Booksetu.git
cd Booksetu

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create `server/.env` with:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173

# Optional (OTP email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=BookSetu <your_email@gmail.com>
```

> If SMTP is not configured, OTP codes are logged to the console for development.

### Run Development

```bash
# Terminal 1 — Server
cd server
npm run dev

# Terminal 2 — Client
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Seed Sample Data

```bash
cd server
npm run seed
```

This creates:
- Admin account
- Demo user account
- Sample book listings
- Welcome notification

---

## Project Structure

```
Booksetu/
├── package.json              # Root scripts (build, start)
├── render.yaml               # Render deployment config
│
├── server/                   # Backend
│   └── src/
│       ├── server.js         # Entry point (Express + Socket.IO)
│       ├── seed.js           # Database seeder
│       ├── config/db.js      # MongoDB connection
│       ├── middleware/       # Auth, rate limiting
│       ├── models/          # User, Listing, Message, Notification, Otp, AppContent
│       ├── routes/          # auth, otp, users, listings, chat, notifications, content, cart, wishlist
│       └── services/        # OTP generation, email sending
│
├── client/                   # Frontend
│   └── src/
│       ├── App.jsx           # Router + providers
│       ├── api.js            # HTTP client with JWT
│       ├── socket.js         # Socket.IO client
│       ├── context/          # AuthContext, ShopContext
│       ├── pages/            # Home, Dashboard, Listing, Profile, Cart, Wishlist, Admin, Auth/
│       ├── components/       # BookCard, ContactModal, NotificationBell, CategorySlider, etc.
│       ├── hooks/            # useChat, useNotifications, useGeolocation
│       └── utils/            # Store helpers, geolocation, image resize, validation
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Register with OTP |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get profile |
| PATCH | `/api/auth/me` | Yes | Update profile |
| POST | `/api/auth/reset-password` | No | Reset password via OTP |
| POST | `/api/otp/send` | No | Send OTP email |
| POST | `/api/otp/verify` | No | Verify OTP |
| GET | `/api/listings` | No | List all (distance-sorted) |
| POST | `/api/listings` | Yes | Create listing |
| PATCH | `/api/listings/:id` | Yes | Update listing |
| DELETE | `/api/listings/:id` | Yes | Delete listing |
| GET | `/api/chat/conversations` | Yes | List conversations |
| GET | `/api/chat/messages` | Yes | Get messages |
| POST | `/api/chat/messages` | Yes | Send message/offer |
| PATCH | `/api/chat/messages/:id/status` | Yes | Accept/decline offer |
| GET | `/api/notifications` | Yes | Get notifications |
| POST | `/api/notifications` | Admin | Create notification |
| GET | `/api/content` | No | Get CMS content |
| PUT | `/api/content` | Admin | Update CMS content |
| GET/POST/PUT/DELETE | `/api/cart` | Yes | Cart CRUD |
| GET/POST/PUT/DELETE | `/api/wishlist` | Yes | Wishlist CRUD |
| GET | `/api/users` | Admin | List users |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## Deployment

The project includes a `render.yaml` blueprint for one-click deployment on Render.

### Environment Variables (Render)

| Key | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Random secret for JWT signing |
| `SMTP_HOST` | SMTP server (e.g., `smtp.gmail.com`) |
| `SMTP_PORT` | SMTP port (`587`) |
| `SMTP_USER` | Email address |
| `SMTP_PASS` | Email app password |
| `SMTP_FROM` | Sender display name |

---

## License

ISC
