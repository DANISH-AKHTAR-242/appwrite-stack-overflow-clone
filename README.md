# Appwrite Stack Overflow Clone

A production-focused Stack Overflow-style Q&A platform built with **Next.js 15**, **React 19**, **TypeScript**, and **Appwrite**.

Users can ask questions, post answers, vote, comment, and build reputation.

## Features

- Authentication with Appwrite sessions + JWT
- Questions, answers, comments, and voting
- Pagination, sorting, search, and tag filtering
- User profile stats and activity overview
- Document-level permissions (owner-only edit/delete)
- Rate limiting for anti-spam protection
- Server-side validation for all write operations
- Standardized API response format
- Loading, empty, and error UI states
- Performance optimizations (memoization, caching, lazy loading)

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI:** React, TailwindCSS, Radix UI, Tabler Icons
- **Backend/BaaS:** Appwrite (`appwrite`, `node-appwrite`)
- **State:** Zustand
- **Validation:** Zod + custom validators
- **Quality:** ESLint + Prettier

## Project Structure

```txt
src/
  app/
    api/
      answer/route.ts
      comment/route.ts
      question/route.ts
      vote/route.ts
    questions/
    users/
  components/
  lib/
    auth.ts
    validation.ts
    rateLimit.ts
    apiResponse.ts
  models/
    server/
    client/
    name.ts
  services/
    userService.ts
  store/
    Auth.ts
  app/env.ts
  middleware.ts
```

## Requirements

- Node.js 18+
- npm 9+
- Appwrite project (cloud or self-hosted)

## Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_server_api_key
```

Environment variables are validated at startup via `src/app/env.ts`.

## Getting Started

```bash
git clone <your-repo-url>
cd appwrite-stack-overflow-clone
npm install
npm run dev
```

Open: `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - Run lint checks

## API Overview

### `/api/question`
- `GET` list questions (pagination/sort/search/tag)
- `POST` create question (auth + validation + rate limit)
- `PUT` update question (owner only)
- `DELETE` delete question (owner only)

### `/api/answer`
- `GET` list answers (pagination/sort)
- `POST` create answer (auth + validation + rate limit)
- `DELETE` delete answer (owner only)

### `/api/comment`
- `POST` create comment (auth + validation + rate limit)
- `DELETE` delete comment (owner only)

### `/api/vote`
- `POST` vote on question/answer (auth + one vote per user per item + rate limit)

## Security Notes

- JWT required for all mutating actions
- Server-side validation for all payloads
- Duplicate vote prevention enforced server-side
- Appwrite document permissions restrict update/delete to owners
- Rate limiting implemented per user/action

> Current rate limiting is in-memory. For multi-instance production, replace with Redis/Upstash.

## Performance Notes

- Cached user lookups and heavy server queries
- Reusable vote and list counts stored on documents
- Memoized interactive components where useful
- Markdown editor/preview loaded lazily

## Linting & Formatting

- ESLint config: `eslint.config.mjs`
- Prettier config: `prettier.config.js`

Suggested workflow:

```bash
npm run lint
```

## Deployment

1. Set environment variables in your hosting platform.
2. Ensure Appwrite API key has required permissions.
3. Build and run:

```bash
npm run build
npm run start
```

## Troubleshooting

- **Invalid environment variables**: Check `.env.local` values and restart dev server.
- **Appwrite permission errors**: Verify API key scopes and document-level permissions.
- **Missing data/index behavior**: Ensure collections/indexes are created in Appwrite.

## License

MIT (see `LICENSE`)
