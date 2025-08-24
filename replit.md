# Overview

This is a TSU (Trade Settlement Unit) digital wallet application built as a full-stack web application. TSU is a reserve-backed digital currency designed for Africa-BRICS trade settlements, aimed at reducing USD dependence. The application provides user authentication, wallet management, transaction processing, and administrative features for managing the digital currency ecosystem.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built with **React** using **TypeScript** and **Vite** as the build tool. The UI framework leverages **shadcn/ui** components with **Tailwind CSS** for styling, providing a modern and responsive interface. State management is handled through **TanStack Query** for server state and caching. The application uses **Wouter** for client-side routing and follows a component-based architecture with reusable UI components.

## Backend Architecture
The server is an **Express.js** application written in **TypeScript** that serves both API endpoints and static files. The architecture follows a RESTful API pattern with middleware for authentication, logging, and error handling. The server handles user authentication through Replit's OIDC system and manages all business logic for transactions, user management, and administrative functions.

## Database Layer
The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The database schema includes tables for users, transactions, coin supply tracking, content management, and session storage. The schema is designed to support role-based access control with user, admin, and super_admin roles.

## Authentication System
Authentication is implemented using **Replit's OpenID Connect (OIDC)** system with **Passport.js**. The system supports session-based authentication using **express-session** with PostgreSQL session storage. User sessions are managed securely with configurable TTL and HTTPS-only cookies.

## Key Features
- **Wallet Management**: Users can view balances, purchase TSU tokens, and manage transactions
- **Transaction Processing**: Support for various transaction types including purchases, sales, transfers, and exchanges
- **Admin Dashboard**: Administrative interface for managing users, creating coin supplies, and content management
- **Content Management**: Dynamic content editing system for landing page customization
- **Role-Based Access**: Three-tier permission system (user/admin/super_admin)

## Data Models
The core entities include:
- **Users**: Profile information, TSU balance, and role assignments
- **Transactions**: Complete transaction history with type categorization
- **Coin Supply**: Tracking of total and circulating supply with reserve backing details
- **Content**: Dynamic content management for public-facing pages

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service accessed via `@neondatabase/serverless`
- **PostgreSQL**: Primary database engine with connection pooling

## Authentication Services
- **Replit OIDC**: OpenID Connect authentication provider
- **Session Storage**: PostgreSQL-based session management with `connect-pg-simple`

## UI Component Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for consistent iconography

## Development Tools
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Drizzle Kit**: Database migration and schema management tool

## Runtime Libraries
- **TanStack Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema validation
- **date-fns**: Date manipulation and formatting utilities