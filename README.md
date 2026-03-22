# Virtual.GYM - Gym Instructor Platform

A B2B SaaS gym management platform that allows gym owners to provide a mobile-first workout experience to their members via QR-code access.

## Features

- **Member Experience**: Mobile-first interface for workout tracking and session history.
- **Gym Admin**: Dashboard for gym owners to manage workouts and members.
- **Super Admin**: Platform-wide management and multi-tenant isolation.

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS v4
- **Auth & Database**: Supabase
- **UI Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion

## Local Development

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Set up environment variables in `.env.local` (see `.env.example`).
4.  Run the development server: `npm run dev`.

## Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components.
- `src/lib`: Shared utilities, constants, and Supabase client configuration.
- `free-exercise-db`: Integrated exercise database.
