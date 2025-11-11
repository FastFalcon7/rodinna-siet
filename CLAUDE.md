# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "Rodinna Sieť" (Family Network) - a private family social media application built with React 19 and deployed on Firebase Hosting. The application is designed for Slovak-speaking users and includes features for family communication, photo sharing, event planning, and member management.

## Development Commands

### Core Development
- `npm start` - Start development server on localhost:3000
- `npm run build` - Build production bundle to `build/` directory
- `npm test` - Run tests in interactive watch mode
- `npm run deploy` - Build and deploy to Firebase Hosting in one command

### Firebase Deployment
The project uses Firebase Hosting with the live URL: https://rodinna-siet.web.app
- Ensure `firebase.json` points to `build` directory (not `public`)
- Always run `npm run build` before `firebase deploy`
- The deploy script handles both build and deployment automatically

## Architecture & Technology Stack

### Core Stack
- **React 19.1.1** with functional components and hooks
- **React Router DOM 7.8.2** for client-side routing
- **Firebase 12.1.0** for authentication, Firestore, and hosting
- **Tailwind CSS 3.4.17** for styling with dark mode support
- **Font Awesome 6.5.1** for icons

### Context Architecture
The application uses React Context API for global state management:

1. **AuthContext** (`src/contexts/AuthContext.js`)
   - Manages user authentication state
   - Provides demo user for development (`NODE_ENV === 'development'`)
   - Integrates with Firebase Auth for production
   - Exports `useAuth()` hook

2. **ThemeContext** (`src/contexts/ThemeContext.js`)
   - Manages dark/light mode toggle
   - Persists theme preference in localStorage
   - Exports `useTheme()` hook

### Component Structure
- **App.js** - Main app with nested context providers and conditional rendering
- **Layout** (`src/components/Shared/Layout.jsx`) - Main layout with sidebar, header, mobile navigation
- **Feature Components** - Each main feature has its own directory:
  - `Feed/` - Social media posts and interactions
  - `Chat/` - Real-time family messaging
  - `Calendar/` - Family events and scheduling
  - `Albums/` - Photo sharing and management
  - `FamilyMembers/` - Member profiles and status
  - `Settings/` - User preferences and configuration
  - `Auth/` - Login/registration screens

### Routing Structure
- `/` - Feed (home page)
- `/chat` - Family chat
- `/calendar` - Event calendar
- `/albums` - Photo albums
- `/family` - Family members
- `/settings` - User settings
- All routes redirect to `/` if user is not authenticated

### Firebase Configuration
- **Authentication** - Email/password with demo mode for development
- **Hosting** - Configured to serve from `build/` directory with SPA rewrites
- **Project ID** - `rodinna-siet`

### Styling Approach
- **Tailwind CSS** with custom configuration in `tailwind.config.js`
- **Dark mode** implemented via `class` strategy
- **Responsive design** with mobile-first approach
- **Custom animations** defined in `src/index.css`

## Development Notes

### Authentication Flow
- Development mode automatically logs in a demo user
- Production uses Firebase Auth with email/password
- AuthContext handles authentication state across the app
- All routes are protected and redirect unauthenticated users to login

### Language & Localization
- Primary language is Slovak
- UI text, error messages, and content are in Slovak
- Date/time formatting uses Slovak locale (`'sk-SK'`)

### Mobile Responsiveness
- Desktop: Sidebar navigation with main content area
- Mobile: Bottom navigation bar with hamburger menu overlay
- Responsive design breaks at `md` breakpoint (768px)

### State Management
- Local component state for UI interactions
- Context providers for global state (auth, theme)
- No external state management library (Redux, Zustand) used

### Testing Setup
- Jest and React Testing Library configured via react-scripts
- Testing files should follow `*.test.js` or `*.spec.js` pattern
- Tests run in watch mode during development

