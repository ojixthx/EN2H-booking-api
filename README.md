# EN2H Booking Platform REST API

A premium, production-ready NestJS and TypeScript backend REST API designed for managing service offerings and customer slot bookings. This project is structured following enterprise best practices, featuring dynamic database support (SQLite/PostgreSQL), secure JWT Authentication (with Access & Refresh token cycles), strict request validation, comprehensive unit testing, global error filtering, and automatic Swagger documentation.

---

## Technical Stack
- **Framework**: NestJS (v11+) & TypeScript
- **Database ORM**: TypeORM (with dual SQLite & PostgreSQL support)
- **Security**: JWT (Access Token + Refresh Token flow), bcrypt password hashing
- **Validation**: Class-Validator & Class-Transformer (global validation pipe)
- **Documentation**: Swagger API Specs (`/api/docs`)
- **Containerization**: Docker & Docker Compose

---

## Features & Implementation
- **JWT Session Cycle**: Full authentication suite including Registration, Login, Token Refreshing, and Logout.
- **Business Rules Enforcement**:
  - Bookings are strictly validated to belong to active, existing services.
  - Custom decorators prevent bookings scheduled in the past.
  - Cancelled bookings are locked down and cannot be transitioned to `COMPLETED`.
  - Duplicate booking checking stops overlapping bookings for the same service, date, and time slot (excluding cancelled bookings to allow slot re-allocation).
- **Aesthetic Enhancements**: Full pagination support, search parameters (fuzzy matches on name/email), and status filtering for list endpoints.
- **Global Error Handler**: Formats all HTTP and TypeORM database constraint exceptions into clean, standardised JSON error contracts.

---

## Installation & Setup

### Prerequisites
- Node.js (v24+ recommended)
- npm (v11+ recommended)
- Docker (optional, for PostgreSQL deployment)

### 1. Project Setup
Clone the repository and install the dependencies:
```bash
# Navigate to the workspace
cd booking-platform

# Install dependencies
npm install
```

### 2. Environment Configurations
The application is pre-configured to use SQLite out-of-the-box. Duplicate the template configuration file:
```bash
cp .env.example .env
```
Inside `.env`, configure your database selection:
- Use `DB_TYPE=sqlite` (default) for local file-based database execution.
- Use `DB_TYPE=postgres` to switch to PostgreSQL, and populate the corresponding `DB_*` database variables.

---

## Running the Application

### Local Development (SQLite)
To boot the NestJS application server locally:
```bash
# Start in development watch mode
npm run start:dev

# Start in production mode
npm run start:prod
```
The server starts on `http://localhost:3000`.

### Dockerized Deployment (PostgreSQL)
To build and run the entire multi-container service (App API + PostgreSQL Database):
```bash
docker-compose up --build
```
This runs PostgreSQL on port `5432` and mounts a local volume for persistence, then starts the NestJS API on port `3000`.

---

## Running Migrations
TypeORM schema synchronisation (`synchronize: true`) is enabled for easy initial setups. For production scenarios where schema history is required:
1. Ensure your `.env` database details are correct.
2. Run the migration tool commands:
```bash
# Generate a migration based on schema changes
npx typeorm-ts-node-commonjs migration:generate src/migrations/InitialMigration -d src/data-source.ts

# Execute pending migrations against the database
npx typeorm-ts-node-commonjs migration:run -d src/data-source.ts

# Revert the latest executed migration
npx typeorm-ts-node-commonjs migration:revert -d src/data-source.ts
```

---

## API Documentation
The API comes integrated with Swagger OpenAPI specs. Start the server and navigate to:
👉 **[http://localhost:3000/api/docs](http://localhost:3000/api/docs)**

### Authentication Endpoints
- `POST /api/auth/register` (Public) - Register managers/admins
- `POST /api/auth/login` (Public) - Obtain Access Token (JWT) & Refresh Token
- `POST /api/auth/refresh` (Public/Header Bearer) - Refresh access token using refresh token
- `POST /api/auth/logout` (Authenticated) - Invalidate current session refresh token

### Service Management Endpoints
- `GET /api/services` (Public) - List all services (paginated)
- `GET /api/services/:id` (Public) - Retrieve a specific service by ID
- `POST /api/services` (Authenticated) - Create new service
- `PUT /api/services/:id` (Authenticated) - Update service properties
- `DELETE /api/services/:id` (Authenticated) - Remove service

### Booking Management Endpoints
- `POST /api/bookings` (Public) - Book a slot (no login required for customers)
- `GET /api/bookings` (Authenticated) - Query all bookings (paginated, with search & status filters)
- `GET /api/bookings/:id` (Authenticated) - Get booking details
- `PATCH /api/bookings/:id/status` (Authenticated) - Transition booking status
- `PATCH /api/bookings/:id/cancel` (Public) - Cancel booking

---

## Testing

Unit tests cover the core business rules and mock database interactions for the services and bookings modules.
```bash
# Run unit tests
npm run test

# Run tests with coverage reporting
npm run test:cov
```

---

## Assumptions Made
1. **Public Bookings**: Customers do not require account logins to create booking reservations, but they must provide contact details (`customerName`, `customerEmail`, `customerPhone`).
2. **Public Service Catalogue**: The catalog of services (`GET /api/services` and `GET /api/services/:id`) is public so customers can find what to book, while altering endpoints (`POST`, `PUT`, `DELETE`) are guarded.
3. **Public Cancellations**: Bookings can be cancelled publicly (`PATCH /api/bookings/:id/cancel`) by providing the booking UUID, enabling customers to easily self-cancel bookings using a direct link from confirmation emails.

---

## Future Improvements
1. **Notification Triggers**: Integrate email/SMS notifications (e.g. via Nodemailer or Twilio) triggered upon booking creation, state confirmation, or cancellation.
2. **Role-Based Access (RBAC)**: Introduce roles (e.g. `CUSTOMER`, `STAFF`, `SUPER_ADMIN`) to granularly control resource permissions.
3. **Optimistic Locking**: Handle high-traffic concurrent bookings of identical slots by implementing database version/timestamp locking.
