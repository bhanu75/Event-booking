
# 🎫 Event Booking System

Production-ready event booking system with role-based access, background jobs, and observability.

## 🚀 Features

- **Role-Based Access**: Customer & Organizer dashboards
- **Real-time Updates**: TanStack Query with optimistic updates
- **Background Jobs**: Email notifications simulation
- **Edge Cases**: Overbooking prevention, idempotency, validation
- **Monitoring**: Structured logging with request IDs

## 🏃‍♂️ Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🧪 Test Accounts

**Customer:**
- Email: `customer@test.com`
- Password: `pass123`

**Organizer:**
- Email: `organizer@test.com`
- Password: `pass123`

## 📊 Tech Stack

- **Frontend**: React 18 + Vite
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## 🎯 API Endpoints (Simulated)

### Auth
- `POST /auth/login`
- `POST /auth/register`

### Events
- `GET /events`
- `GET /events/:id`
- `POST /events` (Organizer)
- `PUT /events/:id` (Organizer)
- `DELETE /events/:id` (Organizer)

### Bookings
- `POST /bookings` (Customer)
- `GET /bookings/my` (Customer)
- `GET /bookings/event/:id` (Organizer)

## 📈 Observability

Check browser console for:
- API request logs with request IDs
- Background job execution
- Email notifications
- Performance metrics

## 🔒 Security Features

- JWT authentication simulation
- Role-based middleware
- Input validation
- Idempotency keys
- Rate limiting ready

## 📝 License

MIT
