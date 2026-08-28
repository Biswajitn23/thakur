# ThakurYograj
Live app: [thakuryograj.com](https://thakuryograj.com)

## Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (React 19) with [TanStack Router](https://tanstack.com/router) and [TanStack Query](https://tanstack.com/query)
- **Styling:** Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Backend / Data:** [Firebase](https://firebase.google.com/) (Firestore rules & indexes included)
- **Payments:** [Cashfree](https://www.cashfree.com/) via `@cashfreepayments/cashfree-js`
- **Forms & Validation:** React Hook Form + Zod
- **Build Tool:** Vite
- **Package Manager:** [Bun](https://bun.sh/) (bun.lock, bunfig.toml present)
- **Deployment:** Vercel
- **Scaffolded with:** [Lovable](https://lovable.dev/)

## Prerequisites

- [Bun](https://bun.sh/) installed (or npm/pnpm, since a `package-lock.json` is also present)
- A Firebase project (see `.firebaserc` and `firestore.rules` for existing config)
- Cashfree API credentials if working on payment features

## Getting Started

Clone the repo:

```bash
git clone https://github.com/Biswajitn23/thakur.git
cd thakur
```

Install dependencies:

```bash
bun install
# or
npm install
```

Run the dev server:

```bash
bun run dev
```

The app will be available at `http://localhost:3000` (default Vite dev port may vary — check terminal output).

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start the development server |
| `bun run build` | Build for production |
| `bun run build:dev` | Build in development mode |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run format` | Format code with Prettier |

## Project Structure

```
thakur/
├── src/                  # Application source code
├── public/               # Static assets
├── scratch/              # Scratch/inspection files
├── .lovable/              # Lovable scaffolding config
├── firebase.json          # Firebase hosting/config
├── firestore.rules        # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── vite.config.ts         # Vite configuration
└── package.json
```

## Firebase Setup

This project uses Firebase (see `.firebaserc` for the linked project ID). To deploy Firestore rules/indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Deployment

The app is deployed on Vercel at [thakuryograj.com](https://thakuryograj.com).
