# Implementation Guide - Using New Fixes

## 🎯 How to Use the New Security & Validation Features

---

## 1. Input Validation in Routes

### Before (No validation):
```javascript
// routes/auth.js
router.post('/register-owner', registerOwner);
```

### After (With validation):
```javascript
const { authValidators } = require('../middleware/validators');

router.post('/register-owner', authValidators.registerOwner, registerOwner);
```

### Available Validators

#### Auth Routes
```javascript
authValidators.registerOwner
authValidators.login
authValidators.register
```

#### Patient Routes
```javascript
patientValidators.create
patientValidators.update
```

#### Case Routes
```javascript
caseValidators.create
caseValidators.update
```

### Example Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid value"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

---

## 2. Error Handling

### Automatic Error Catching
All unhandled errors are now caught by the global error handler:

```javascript
// In any controller
async function someHandler(req, res, next) {
  try {
    const result = await db.query('SELECT * FROM users');
    res.json(result);
  } catch (err) {
    next(err); // Caught by error handler
  }
}
```

### Creating Custom Errors
```javascript
const err = new Error('Custom error message');
err.status = 400; // HTTP status code
next(err);
```

### Error Response Format
```json
{
  "success": false,
  "error": "Error message displayed to client",
  "details": "Full stack trace (development only)"
}
```

---

## 3. Rate Limiting

### Global Rate Limit
- **100 requests per 15 minutes** per IP address
- Applied to all routes

### Auth-Specific Rate Limit
- **5 requests per 15 minutes** per IP address
- Only for `/api/auth` routes
- Doesn't count successful requests

### How to Apply Custom Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const strictLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 requests max
  message: 'Too many attempts',
});

router.post('/sensitive-action', strictLimiter, handler);
```

### Testing Rate Limiting
```bash
# Make 6 requests to auth (5th will fail)
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"pass"}'
done
```

---

## 4. CORS Configuration

### Current Settings
```
Allowed Origins: http://localhost:3000, http://localhost:5000
Credentials: true
```

### Update for Production
In `.env`:
```
ALLOWED_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com
```

### Code
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || defaults,
  credentials: true,
};
app.use(cors(corsOptions));
```

---

## 5. Security Headers (Helmet)

### Automatically Added Headers:
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Strict-Transport-Security: max-age=31536000` - HTTPS enforcement
- `Content-Security-Policy: ...` - Script/content restrictions

### Verify Headers
```bash
curl -I http://localhost:5000/health
```

Look for:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
```

---

## 6. Request Logging

### Log Format
Each request logs:
```
IP - - [Date] "METHOD URL HTTP/VERSION" Status Size "Referrer" "User-Agent" ResponseTime
```

Example:
```
::1 - - [26/May/2026:12:30:45] "POST /api/auth/login HTTP/1.1" 200 - "http://localhost:3000" "Mozilla/5.0" 45.3 ms
```

### View Logs
```bash
npm run dev 2>&1 | tee server.log
```

---

## 7. Health Check Endpoint

### Purpose
- Load balancer health checks
- Monitoring systems
- Readiness probes (Kubernetes)

### Usage
```bash
curl http://localhost:5000/health
```

### Response
```json
{
  "status": "ok",
  "timestamp": "2026-05-26T12:30:45.123Z",
  "uptime": 3600.5
}
```

### Status Codes
- `200` - Server healthy
- `500` - Server error

---

## 8. Environment Validation

### What Gets Checked
On server startup, these variables are required:
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

### If Missing
```
Configuration Error: Missing required environment variables: DB_HOST, JWT_SECRET
Server exiting with code 1
```

### Setup
```bash
cp .env.example .env
# Edit .env and fill in all values
npm run dev
```

---

## 9. Compression

### Automatic Gzip
All responses > 1KB are automatically gzipped.

### Verify
```bash
curl -i http://localhost:5000/api/patients \
  -H "Accept-Encoding: gzip"
```

Look for:
```
Content-Encoding: gzip
```

### Performance Impact
- Typical 70% size reduction for JSON
- CPU cost negligible for modern servers

---

## 10. Database Connection Management

### Connection Pool Settings
```javascript
connectionLimit: 10       // Max 10 connections
queueLimit: 0             // Unlimited wait queue
acquireTimeoutMillis: 30000  // 30 sec timeout per connection
enableKeepAlive: true     // Reuse connections
```

### Monitoring Pool
```javascript
pool.on('error', (err) => {
  // Logs: PROTOCOL_CONNECTION_LOST, ER_CON_COUNT_ERROR, etc.
});
```

### Connection Retry Logic
- 3 retries on startup failure
- 5-second delay between attempts
- Clear error message if all retries fail

---

## 11. Adding New Validators

### Pattern
```javascript
// middleware/validators.js

const newValidators = {
  createAppointment: [
    body('patient_id').isInt().withMessage('Valid patient ID required'),
    body('doctor_id').isInt().withMessage('Valid doctor ID required'),
    body('appointment_time').isISO8601().withMessage('Valid datetime required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    handleValidationErrors,
  ],
};

module.exports = { newValidators };
```

### Use in Route
```javascript
const { newValidators } = require('../middleware/validators');

router.post('/appointments', newValidators.createAppointment, createAppointment);
```

---

## 12. Troubleshooting

### Issue: "Missing required environment variables"
**Solution:** Copy `.env.example` to `.env` and fill in all values
```bash
cp .env.example .env
nano .env  # Edit with your values
```

### Issue: Rate limit errors (429)
**Solution:** Wait 15 minutes or change IP, or adjust rate limit settings

### Issue: CORS errors
**Solution:** Add your frontend URL to `ALLOWED_ORIGINS` in `.env`

### Issue: Database connection failed
**Solution:** 
1. Check DB credentials in `.env`
2. Verify MySQL is running
3. Check network connectivity

### Issue: "stack trace" in error response
**This is expected in development.** In production, set:
```
NODE_ENV=production
```

---

## 📚 API Response Standards

All responses now follow this format:

### Success Response
```json
{
  "data": { /* actual data */ },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message for client",
  "details": "Stack trace (dev only)"
}
```

### Validation Error
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ]
}
```

---

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use strong `JWT_SECRET` (32+ characters)
- [ ] Set `ALLOWED_ORIGINS` to production domains only
- [ ] Use external MySQL (not localhost)
- [ ] Enable HTTPS on load balancer
- [ ] Set up monitoring for `/health` endpoint
- [ ] Configure log aggregation (ELK, Splunk, etc.)
- [ ] Set up database backups
- [ ] Test rate limiting doesn't block legitimate users
- [ ] Verify all required env vars are set

---

**For questions, see FIXES_APPLIED.md and API_DOCS.md**
