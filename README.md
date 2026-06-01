# ChatLoop — MERN Real-Time Chat Application

<div align="center">

![MongoDB](https://img.shields.io/badge/MongoDB-%2347A248.svg?style=flat&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-%23000000.svg?style=flat&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React%2019-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/Node.js-%23339933.svg?style=flat&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-%23000000.svg?style=flat&logo=socket.io&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-%2306B6D4.svg?style=flat&logo=tailwindcss&logoColor=white)
![Amazon S3](https://img.shields.io/badge/Amazon%20S3-FF9900?style=flat&logo=amazons3&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=flat&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=flat&logo=docker&logoColor=white)

A real-time MERN stack chat application with authentication, one-on-one messaging, image sharing, AI chatbot support, email verification, and offline notifications.

</div>

---

## Screenshots

![Mockup screen](screenshots/ChatLoop.png)

### Authentication

![Login screen](screenshots/login.png)
![Sign up screen](screenshots/signup.png)

### Chat Experience

![Chat screen](screenshots/chat.png)
![Dark chat screen](screenshots/chat-dark.png)
![Mobile chat screen](screenshots/chat-mobile.png)

### AI Chatbot

![Gemini chat screen](screenshots/gemini.png)
![Dark Gemini chat screen](screenshots/gemini-dark.png)

### Media & Profile

![Upload image screen](screenshots/upload-image.png)
![Chat image screen](screenshots/chat-img.png)
![Profile screen](screenshots/profile.png)

## Features

- Email/password authentication with JWT
- OTP login and email verification
- Real-time messaging with Socket.IO
- Text, image, reply, delete, clear chat, and starred messages
- Online/offline status, typing indicators, seen receipts, unread counts
- AI chatbot powered by Google Gemini with streaming responses
- Profile management and password updates
- Block/unblock users
- Email notifications for offline users
- Dark/light theme and responsive UI
- Docker support for easy setup

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
**Backend:** Node.js, Express.js
**Database:** MongoDB, Mongoose
**Real-time:** Socket.IO
**Auth:** JWT, bcrypt
**AI:** Google Gemini
**Email:** Nodemailer / Gmail SMTP
**Storage:** Cloudinary / S3
**Deployment:** Docker, Docker Compose

## Project Structure

```bash
ChatLoop/
├── backend/
│   ├── Controllers/
│   ├── Models/
│   ├── Routes/
│   ├── socket/
│   ├── middleware/
│   ├── utils/
│   └── index.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── lib/
│
├── docker-compose.yml
└── .env.example
```

## Environment Variables

Create a `.env` file from `.env.example` and add:

```env
MONGO_URI=
MONGO_DB_NAME=
JWT_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=

EMAIL=
PASSWORD=

CORS_ORIGIN=
FRONTEND_URL=
VITE_API_URL=
```

## Getting Started

### Docker

```bash
git clone https://github.com/your-username/ChatLoop.git
cd ChatLoop
cp .env.example .env
docker compose up --build -d
```

Frontend: `http://localhost`
Backend: `http://localhost:5500`

### Manual Setup

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

## Main API Routes

```bash
/auth
/conversation
/message
/user
```

Protected routes require:

```bash
auth-token: <JWT>
```

## Socket.IO

The app uses Socket.IO for:

- Sending and receiving messages
- Typing indicators
- Online/offline presence
- Seen receipts
- AI streaming responses
- Real-time notifications

Socket connections are authenticated using JWT.

## Security

- Passwords and OTPs are hashed with bcrypt
- JWT is required for protected REST routes and sockets
- Server validates conversation membership
- Client-supplied user IDs are not trusted
- Blocked users cannot send messages
- Deleted accounts are anonymized

## License

MIT
