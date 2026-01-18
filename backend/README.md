# Rolla Backend

Express + MongoDB backend for accessibility reporting.

## Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Update `MONGODB_URI` with your MongoDB connection string
   - For local development, you can use MongoDB Atlas (free tier) or local MongoDB

3. **Start the server:**
   ```bash
   npm run dev   # Development with hot reload
   # or
   npm start     # Production
   ```

The server runs on port 3000 by default.

## API Endpoints

- `GET /api/reports` - Fetch nearby reports (query: longitude, latitude, radius)
- `GET /api/reports/:id` - Get single report
- `POST /api/reports` - Create new report (multipart: type, longitude, latitude, photo)
- `POST /api/reports/:id/confirm` - Confirm a report exists
- `POST /api/reports/:id/remove` - Report that feature is removed
- `POST /api/reports/:id/report-photo` - Report inappropriate photo

## Report Lifecycle

- Reports expire in 48 hours by default
- Each confirmation extends expiry by 12 hours (up to 7 days)
- 10+ confirmations make a report permanent
- 10+ removal reports remove a report
- 5+ photo reports hide a photo
