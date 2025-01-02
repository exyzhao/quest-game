# Quest (Director's Cut) Monorepo

Welcome to Don Eskridge's [Quest](https://quest-game-eta.vercel.app/) — a newer social deduction game inspired by _The Resistance: Avalon_, designed for 4–10 players. This contains the Director's Cut variant, featuring unique character roles and a new ruleset.

---

## Technical Details

This app is built on a monorepo architecture using **Turborepo**.  
The project is divided into two main packages:

- **Client**: Built with [Next.js](https://nextjs.org/) for server-side rendering and [React](https://reactjs.org/) for the user interface. Styled using [Tailwind CSS](https://tailwindcss.com/).
- **Server**: A lightweight backend using [Express.js](https://expressjs.com/) with real-time communication via [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API).

## Prerequisites

- **Node.js** (v16 or later)
- **npm** (v7 or later)

---

## Installation

### 1. Clone the Repository:

```bash
git clone https://github.com/your-username/quest-game.git
cd quest-game
```

### 2. Install Dependencies:

```bash
npm install
```

## Running the Development Environment

```bash
npm run dev
```

---

## Usage and Attribution

This was built by [Ethan Zhao](https://ethanxyzhao.com).

This project is inspired by Don Eskridge's Quest.
