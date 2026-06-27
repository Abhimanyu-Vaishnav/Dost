# Dost - Modern Social Media Platform

**Dost** (meaning *Friend* in Hindi) is a premium, full-featured social media web application designed to connect people. Built with **Next.js (App Router)**, **React 19**, **Prisma**, and **SQLite**, it replicates core functionalities of modern social networking sites such as stories with custom sticker overlays, real-time messaging, detailed engagement metrics, and custom user relationships.

---

## 🚀 Features

### 1. User Profiles & Social Graph
* **Custom Profiles**: Usernames, bios, avatars, cover images, gender, date of birth, and account types (Person, Business, Government).
* **Social Relations**: Follow/unfollow mechanics, user blocking (prevents interaction), and muting (hides user posts/stories).
* **Close Friends**: Curate a custom list of close friends for exclusive content sharing.

### 2. Interactive Posts & Feed
* **Multi-Format Posts**: Create posts containing text, images, videos, and external links.
* **Engagement**: Like posts, add comments, and like individual comments.
* **Reposts**: Share another user's post to your own feed.
* **Bookmarks & Hiding**: Save posts for later using Bookmarks, or hide posts you don't wish to see in your feed.

### 3. Rich Stories (Instagram Style)
* **Ephemeral Media**: Post 24-hour stories with support for text, images, and video.
* **Custom Overlays**: Add text, stickers, and customize their positions/styles via interactive overlays.
* **Interactive Story Elements**: Background music tracks and custom background colors.
* **Granular Privacy**: Restrict story visibility to Public, Friends, Close Friends, or a specific whitelist of users.

### 4. Direct Messaging & Conversations
* **Chat System**: Personal conversation threads between users.
* **Multi-type Messages**: Send text, images, videos, stickers, or share location coordinates.
* **Status Tracking**: Message read receipts (`isRead`) and online status (`lastSeen`).

### 5. Detailed Analytics
* **Post Performance**: Interactive charts visualizing views.
* **Demographics**: Tracks viewer regions (e.g., North America, Europe, Asia), devices (Mobile, Desktop, Tablet), genders, and relationship status (Follower vs. Non-follower).

### 6. Notifications
* Instant notification tray for user actions including Likes, Comments, Reposts, and new Followers.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16.2.6 (App Router) & React 19
* **Database & ORM**: SQLite & Prisma ORM
* **Authentication**: Cookie-based JWT tokens (`jose`) and password hashing (`bcryptjs`)
* **Styling & UI**: Vanilla CSS (Modern CSS variables, flexbox, grid, glassmorphism, smooth animations) & Lucide Icons
* **Data Visualization**: Recharts (for post view demographics and stats)
* **Development Utilities**: `@faker-js/faker` for generating realistic seed data

---

## 📂 Project Structure

* `src/app/`: Next.js pages and API route handlers.
* `src/features/`: Component-driven feature folders (Auth, Messages, Notifications, Posts, Profile, Search, Stories, Users).
* `src/components/`: Reusable global UI components.
* `src/lib/`: Database configuration, authentication helpers, and utility functions.
* `prisma/`: Prisma database schema (`schema.prisma`) and development database seed script (`seed.ts`).

---

## 🏁 Getting Started

Follow these steps to set up and run the project locally on your machine:

### 1. Prerequisites
Ensure you have **Node.js** (v18.x or higher) and **npm** installed.

### 2. Clone and Setup Environment
Create a `.env` file in the root of the project and add the database URL configuration:
```env
DATABASE_URL="file:./dev.db"
```

### 3. Install Dependencies
Run the following command to install all required packages:
```bash
npm install
```

### 4. Setup Database
Push the Prisma schema to create the SQLite database file and generate the client:
```bash
npx prisma db push
npx prisma generate
```

### 5. Seed the Database (Optional but Recommended)
Populate your local database with **100 mock users**, multiple posts, random comments, likes, and follows to simulate a fully active platform:
```bash
npm run seed
```
> [!NOTE]  
> All seeded users share the password: `password123`.

### 6. Run the Development Server
Start the Next.js development server:
```bash
npm run dev
```

Now, open [http://localhost:3000](http://localhost:3000) in your browser to experience the app!
