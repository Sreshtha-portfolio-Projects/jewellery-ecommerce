# Aldorado Jewells - Documentation

This documentation set provides comprehensive information about the Aldorado Jewells luxury jewelry e-commerce platform.

## Documentation Structure

### [Setup Guide](setup-guide.md)
Complete step-by-step setup instructions for local development and production deployment. Start here if setting up the platform for the first time.

### [Architecture](architecture.md)
System architecture, technology stack, security principles, data flow, and API structure. Read this to understand how the system is designed.

### [Core Flows](core-flows.md)
Complete documentation of order processing, shipping, returns, refunds, and invoicing flows. Essential for understanding business logic.

### [Admin Operations](admin-operations.md)
Admin responsibilities, order handling, shipping updates, return approvals, and system configuration. Reference for day-to-day admin tasks.

### [Testing Guide](testing-guide.md)
Manual testing framework with 211 test cases covering smoke tests, regression tests, happy paths, and negative scenarios. Use this for quality assurance.

### [Production Readiness](production-readiness.md)
Health checks, error handling, audit logging, configuration management, backup strategy, and troubleshooting. Essential for deployment and operations.

### [Known Limitations](known-limitations.md)
Explicit list of features not yet implemented to avoid ambiguity for future contributors. Review before planning new features.

### [Index](INDEX.md)
Quick reference guide for navigating all documentation files.

## Platform Overview

Aldorado Jewells is a full-stack luxury jewelry e-commerce platform built with:

- **Frontend**: React 19, Vite, Tailwind CSS
- **Backend**: Node.js, Express 5
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with Supabase Auth
- **Payments**: Razorpay integration
- **Storage**: Supabase Storage for images

## Key Principles

1. **Backend-First Architecture**: Frontend never directly accesses Supabase. All database operations go through the Node.js backend API for security and data consistency.

2. **Configuration-Driven**: Business rules (tax rates, shipping charges, state machines) are stored in the database and configurable via admin panel. No hardcoded business logic.

3. **Audit Trail**: All critical actions are logged in immutable audit logs for compliance and debugging.

4. **State Machine Enforcement**: Order, shipping, and return status transitions are enforced by configurable state machines to prevent invalid state changes.

5. **Inventory Safety**: Order intent system locks inventory before payment to prevent overselling.

## Quick Start

### Prerequisites

- Node.js v18 or higher
- npm
- Supabase account
- Razorpay account (for payments)

### Installation

1. **Clone the repository**
2. **Set up Supabase**:
   - Create Supabase project
   - Run migrations in order (see [Production Readiness](production-readiness.md))
   - Get credentials (URL and service role key)
3. **Backend setup**:
   - `cd backend && npm install`
   - Create `.env` file with Supabase credentials and JWT secret
   - Start: `npm run dev`
4. **Frontend setup**:
   - `cd frontend && npm install`
   - Create `.env` file with `VITE_API_BASE_URL=http://localhost:3000`
   - Start: `npm run dev`
5. **Configure Razorpay** (for payments):
   - Add Razorpay keys to backend `.env`
   - Set up webhook URL (see [Core Flows](core-flows.md))

For detailed step-by-step setup instructions, see the main [README.md](../README.md) in the project root.

## Documentation Conventions

- **Code blocks**: Used for configuration examples, API endpoints, and code snippets
- **Bullet points**: Used for lists and step-by-step instructions
- **Bold text**: Used for important concepts and key terms
- **Italic text**: Used for notes and optional information

## Getting Help

- Review the relevant documentation section for your question
- Check [Known Limitations](known-limitations.md) to see if a feature is planned
- Review [Testing Guide](testing-guide.md) for examples of how features work
- Check [Production Readiness](production-readiness.md) for deployment and operational concerns

## Document Maintenance

This documentation is maintained alongside the codebase. When adding features:

1. Update the relevant documentation file
2. Add test cases to [Testing Guide](testing-guide.md) if applicable
3. Update [Known Limitations](known-limitations.md) if removing limitations
4. Update [Production Readiness](production-readiness.md) for operational changes

