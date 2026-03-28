# PracticeFlow

PracticeFlow is a distraction-free, production-ready video learning application built with Next.js, React, and Tailwind CSS. The app focuses on a "learning by doing" mechanism that empowers users to internalize knowledge faster through forced practice sessions.

## 🚀 Key Features

- **Learning by Doing:** Automatically pauses videos at customizable intervals, enforcing practice sessions so you actually apply what you learn.
- **Multiple Learning Modes:**
  - *Normal:* Gentle reminders to practice.
  - *Strict:* Enforces practice before you can continue.
  - *Always Strict:* The ultimate focus mode for serious learners.
- **Persistent Local Video Folders:** Seamlessly loads your local video libraries without a backend. Utilizing the File System Access API, PracticeFlow remembers your selected folders and re-authenticates automatically across sessions.
- **Modern, Distraction-Free UI:** Clean aesthetics built to keep you completely focused on the material.
- **Persistent State Management:** Safely remembers your settings, preferences, and progress.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **UI Library:** React
- **Styling:** Tailwind CSS
- **Local Storage:** IndexedDB & File System Access API (No backend required)
- **Animations:** Framer Motion

## 💻 Running Locally

To run the development server locally, you will first need to install the project dependencies:

```bash
npm install
# or yarn install / pnpm install
```

Then, run the development server:

```bash
npm run dev
# or yarn dev / pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to experience PracticeFlow.

## 🚀 Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
