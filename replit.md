# Internal Medicine Handover Application

## Overview

This is a full-stack web application for managing patient handovers in an internal medicine department. The application provides a digital solution for tracking patient information, managing medications, tasks, and notes during shift changes. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence.

The system allows medical staff to:
- View patient summaries in a dashboard format
- Add new patients with comprehensive medical information
- Update patient medications, tasks, and notes
- Archive patients when they're discharged or transferred
- Restore patients from archive when needed

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript for type safety
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for robust form handling
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety across the entire stack
- **API Design**: RESTful API with standardized endpoints for patient operations
- **Validation**: Zod schemas shared between frontend and backend for consistent data validation
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Development**: Hot reloading with Vite integration for seamless development experience

### Data Storage
- **Database**: PostgreSQL for reliable relational data storage
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Connection**: Neon Database serverless PostgreSQL for cloud hosting
- **Schema Management**: Drizzle Kit for database migrations and schema updates
- **Fallback Storage**: In-memory storage implementation for development/testing scenarios

### Patient Data Model
The application centers around a comprehensive patient schema including:
- Basic demographics (name, MRN, age, sex)
- Medical information (diagnosis, admission date, status)
- Location tracking (bed assignment)
- Clinical data (medications, tasks, notes)
- Soft deletion system for archiving patients
- Audit trails with creation and update timestamps

### Authentication & Authorization
Currently implements a session-based approach with:
- Express session management
- PostgreSQL session store for persistence
- CSRF protection considerations
- Middleware-based request logging and monitoring

### UI/UX Design System
- **Component Library**: shadcn/ui built on Radix UI primitives
- **Design Tokens**: CSS custom properties for consistent theming
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Accessibility**: ARIA-compliant components from Radix UI
- **Icons**: Lucide React for consistent iconography

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connect-pg-simple**: PostgreSQL session store for Express sessions

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives including dialogs, forms, navigation, and data display components
- **shadcn/ui**: Pre-styled components built on top of Radix UI
- **Lucide React**: Modern icon library for consistent visual elements

### Development Tools
- **Drizzle Kit**: Database schema management and migration tools
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Performant form library with minimal re-renders
- **Zod**: Runtime type validation and schema definition
- **Class Variance Authority**: Utility for managing component variants

### Build & Development
- **Vite**: Fast build tool with HMR for development
- **TypeScript**: Static type checking across the entire application
- **ESBuild**: Fast JavaScript/TypeScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

### Hosting & Deployment
- **Replit**: Development and hosting platform integration
- **Replit Vite Plugins**: Runtime error overlay and cartographer for enhanced development experience