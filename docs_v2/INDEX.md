# Documentation Index

Quick reference guide to all documentation files in this set.

## For New Developers

**Start Here**: [Setup Guide](setup-guide.md)
- Complete step-by-step setup from scratch
- Covers Supabase, backend, frontend, and Razorpay configuration
- Includes troubleshooting for common issues

**Then Read**: [Architecture](architecture.md)
- Understand system design and technology stack
- Learn security principles and data flow
- Review API structure and configuration management

## For Understanding Business Logic

**Core Flows**: [Core Flows](core-flows.md)
- Order processing from cart to delivery
- Shipping status management
- Returns and refunds workflow
- Invoicing process
- Price calculation and inventory management

**Admin Operations**: [Admin Operations](admin-operations.md)
- Admin responsibilities and access control
- Order management procedures
- Shipping and return handling
- Product management and SKU system
- System configuration

## For Testing and Quality Assurance

**Testing Guide**: [Testing Guide](testing-guide.md)
- 211 manual test cases across 10 test files
- Testing workflows and best practices
- Test execution procedures
- Local testing with test mode
- Razorpay testing procedures

## For Production Deployment

**Production Readiness**: [Production Readiness](production-readiness.md)
- Health checks and monitoring
- Error handling strategies
- Audit logging system
- Configuration management
- Backup strategy
- Troubleshooting common issues
- Deployment checklist

## For Planning Future Work

**Known Limitations**: [Known Limitations](known-limitations.md)
- Features not yet implemented
- Current state vs future plans
- Helps avoid duplicate work
- Guides architectural decisions

## Quick Navigation by Topic

### Setup and Configuration
- [Setup Guide](setup-guide.md) - Initial setup
- [Architecture](architecture.md) - Environment variables, migrations, storage setup

### Development
- [Architecture](architecture.md) - System design, API structure
- [Core Flows](core-flows.md) - Business logic flows
- [Admin Operations](admin-operations.md) - Admin features

### Testing
- [Testing Guide](testing-guide.md) - Complete testing framework
- [Production Readiness](production-readiness.md) - Troubleshooting

### Operations
- [Production Readiness](production-readiness.md) - Deployment, monitoring, backups
- [Admin Operations](admin-operations.md) - Day-to-day admin tasks

### Planning
- [Known Limitations](known-limitations.md) - What's not implemented

## Document Relationships

```
Setup Guide
    ↓
Architecture (understand the system)
    ↓
Core Flows (understand business logic)
    ↓
Admin Operations (understand admin tasks)
    ↓
Testing Guide (validate everything works)
    ↓
Production Readiness (deploy and maintain)
```

## File Locations

All documentation files are in `/docs_v2`:
- `README.md` - Overview and navigation
- `setup-guide.md` - Setup instructions
- `architecture.md` - System architecture
- `core-flows.md` - Business flows
- `admin-operations.md` - Admin procedures
- `testing-guide.md` - Testing framework
- `production-readiness.md` - Operations guide
- `known-limitations.md` - Unimplemented features
- `INDEX.md` - This file

Original documentation files remain in `/Documents` folder for reference.
