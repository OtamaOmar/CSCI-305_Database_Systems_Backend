# PulseED - Emergency Department Management System Backend

A comprehensive backend API for managing emergency department operations including patient triage, case management, staff scheduling, and hospital resource allocation.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ 
- MySQL 8.0+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/OtamaOmar/CSCI-305_Database_Systems_Backend.git
cd CSCI-305_Database_Systems_Backend
```

2. Install dependencies:
```bash
npm install
```

3. Setup environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Initialize database:
```bash
npm run db:init
```

5. Start development server:
```bash
npm run dev
```

Server runs on `http://localhost:5000`

## 📋 Environment Variables

See `.env.example` for all required variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | MySQL host | localhost |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | password |
| `DB_NAME` | Database name | emergency_dept |
| `PORT` | Server port | 5000 |
| `JWT_SECRET` | JWT signing secret | your-secret-key |
| `NODE_ENV` | Environment | development/production |

## 🔐 Security Features

- **Helmet.js** - HTTP security headers
- **JWT Authentication** - Token-based auth with 1-day expiry
- **CORS Protection** - Configurable origin whitelist
- **Rate Limiting** - 100 req/15min global, 5 req/15min for auth
- **Password Hashing** - bcryptjs with salt rounds
- **Parameterized Queries** - SQL injection protection
- **Role-Based Access Control** - Owner, Admin, Doctor, Nurse roles

## 📡 API Routes

### Authentication (`/api/auth`)
- `POST /register-owner` - Create new hospital tenant
- `POST /register` - Register staff (invitation-based)
- `POST /login` - Login with email/password
- `GET /invitation-details` - Get invitation info
- `GET /invitation` - Get pending invitation (authenticated)
- `POST /invitation/accept` - Accept invitation
- `POST /invitation/reject` - Reject invitation

### Patients (`/api/patients`)
- `GET /` - List all patients
- `POST /` - Create new patient
- `GET /:id` - Get patient details
- `PUT /:id` - Update patient
- `DELETE /:id` - Delete patient

### Cases (`/api/cases`)
- `GET /` - List emergency cases
- `POST /` - Create new case
- `GET /:id` - Get case details
- `PUT /:id` - Update case status

### Appointments (`/api/appointments`)
- `GET /` - List appointments
- `POST /` - Schedule appointment
- `PUT /:id` - Update appointment
- `DELETE /:id` - Cancel appointment

### Triage (`/api/triage`)
- `GET /` - List triage records
- `POST /` - Create triage assessment
- `GET /:id` - Get triage details

### Rooms (`/api/rooms`)
- `GET /` - List available rooms
- `POST /` - Create room
- `PUT /:id` - Update room

### Room Reservations (`/api/room-reservations`)
- `GET /` - List reservations
- `POST /` - Reserve room
- `DELETE /:id` - Cancel reservation

### Prescriptions (`/api/prescriptions`)
- `GET /` - List prescriptions
- `POST /` - Issue prescription
- `PUT /:id` - Update prescription

### Ambulances (`/api/ambulances`)
- `GET /` - List ambulances
- `POST /` - Create ambulance
- `PUT /:id` - Update ambulance status

### Staff Schedule (`/api/staff-schedule`)
- `GET /` - View schedules
- `POST /` - Create schedule
- `PUT /:id` - Update schedule

### Dashboard (`/api/dashboard`)
- `GET /` - Get dashboard metrics

### Reports (`/api/reports`)
- `GET /` - Generate reports

### Other Endpoints
- `POST /api/contact` - Contact form submission
- `GET /api/doctors` - List doctors
- `GET /api/departments` - List departments
- `GET /api/locations` - List hospital locations
- `GET /api/medical-files` - Medical file management
- `GET /api/hospital-files` - Hospital file management
- `GET /api/notifications` - Notifications system
- `GET /api/users` - User management
- `GET /api/roles` - Role management
- `GET /api/invitations` - Invitation management

## 🔍 Health Check

```bash
curl http://localhost:5000/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-26T12:00:00.000Z",
  "uptime": 1234.56
}
```

## 📦 Project Structure

```
├── controllers/        # Request handlers
├── routes/            # Express route definitions
├── middleware/        # Custom middleware
├── db/                # Database connection & init
├── utils/             # Utility functions
├── server.js          # Main server file
├── package.json       # Dependencies
└── .env.example       # Environment template
```

## 🛠️ Available Scripts

```bash
npm start          # Run production server
npm run dev        # Run with nodemon (development)
npm run db:init    # Initialize database
npm run lint       # Lint code (when configured)
npm test           # Run tests (when configured)
```

## 🔑 Authentication

Include JWT token in request header:
```
Authorization: Bearer <token>
```

Tokens expire after 1 day. Re-login to get new token.

## 👥 Role Permissions

### Owner
- Full system access (*)

### Admin
- User management
- All resource CRUD operations
- Report generation
- System configuration

### Doctor
- Patient records read/write
- Appointments management
- Prescriptions management
- Triage records read

### Nurse
- Patient triage (full access)
- Emergency case management
- Room reservations
- Ambulance dispatch

## 🐛 Error Handling

Standard error response format:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Stack trace (development only)"
}
```

HTTP status codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

## 📝 Logging

Requests logged to console using Morgan:
```
::1 - - [26/May/2026:12:00:00 +0300] "GET /health HTTP/1.1" 200 - "-" "curl/7.68.0" 2.345 ms
```

## 🚀 Deployment

1. Set `NODE_ENV=production` in .env
2. Update `ALLOWED_ORIGINS` for production domain
3. Use strong `JWT_SECRET`
4. Configure external database
5. Use process manager (PM2, systemd, etc.)

Example PM2:
```bash
npm install -g pm2
pm2 start server.js --name "pulsed-api" --instances max
```

## 📄 License

MIT

## 👨‍💻 Author

Database Systems Course - CSCI 305
