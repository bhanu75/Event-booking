import React, { useState, useEffect, createContext, useContext } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users, Plus, Edit2, Trash2, LogOut, AlertCircle, CheckCircle, Loader, Search, ChevronDown, X, DollarSign, Ticket } from 'lucide-react';

// ============================================================================
// BACKEND SIMULATION & INFRASTRUCTURE
// ============================================================================

class Logger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const requestId = meta.requestId || `req_${Math.random().toString(36).substr(2, 9)}`;
    const latency = meta.latency || Math.floor(Math.random() * 100) + 50;
    console.log(`[${timestamp}] [${level}] [${requestId}] [${latency}ms]`, message, meta);
  }
  static info(msg, meta) { this.log('INFO', msg, meta); }
  static error(msg, meta) { this.log('ERROR', msg, meta); }
  static warn(msg, meta) { this.log('WARN', msg, meta); }
}

class BackgroundQueue {
  static async enqueue(job) {
    Logger.info('Job enqueued', { jobType: job.type, jobId: job.id });
    setTimeout(() => this.process(job), 500);
  }

  static async process(job) {
    Logger.info('Job processing started', { jobType: job.type, jobId: job.id });
    await new Promise(r => setTimeout(r, 1000));
    
    if (job.type === 'BOOKING_CONFIRMATION') {
      console.log(`📧 EMAIL: Booking confirmed for ${job.data.userName}
To: ${job.data.userEmail}
Event: ${job.data.eventTitle}
Tickets: ${job.data.tickets}
Date: ${job.data.eventDate}`);
    } else if (job.type === 'EVENT_UPDATE') {
      console.log(`📧 NOTIFICATION: Event "${job.data.eventTitle}" updated
Notifying ${job.data.affectedUsers} customer(s)
Changes: ${job.data.changes}`);
    }
    
    Logger.info('Job completed', { jobType: job.type, jobId: job.id });
  }
}

class Database {
  constructor() {
    this.initializeData();
  }

  initializeData() {
    this.users = [
      { id: '1', name: 'Alex', email: 'customer@test.com', password: 'pass123', role: 'customer' },
      { id: '2', name: 'Sarah', email: 'organizer@test.com', password: 'pass123', role: 'organizer' }
    ];

    this.events = [
      {
        id: '1', title: 'Music Fest 2024', description: 'Annual music festival featuring top artists',
        date: '2024-05-20T18:00:00Z', location: 'New York, NY', totalTickets: 300, availableTickets: 10,
        organizerId: '2', status: 'active', price: 50,
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop'
      },
      {
        id: '2', title: 'Tech Conference', description: 'Latest in technology and innovation',
        date: '2024-06-05T09:00:00Z', location: 'San Francisco, CA', totalTickets: 200, availableTickets: 200,
        organizerId: '2', status: 'active', price: 150,
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=300&fit=crop'
      },
      {
        id: '3', title: 'Art Expo', description: 'Contemporary art exhibition',
        date: '2024-07-12T10:00:00Z', location: 'Los Angeles, CA', totalTickets: 150, availableTickets: 0,
        organizerId: '2', status: 'active', price: 25,
        image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=300&fit=crop'
      },
      {
        id: '4', title: 'Business Summit', description: 'Leadership and business strategies',
        date: '2024-06-15T08:00:00Z', location: 'Chicago, IL', totalTickets: 200, availableTickets: 50,
        organizerId: '2', status: 'active', price: 200,
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop'
      },
      {
        id: '5', title: 'Summer Music Fest', description: 'Outdoor summer concert series',
        date: '2024-05-20T16:00:00Z', location: 'Austin, TX', totalTickets: 300, availableTickets: 20,
        organizerId: '2', status: 'active', price: 75,
        image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=300&fit=crop'
      },
      {
        id: '6', title: 'Art Showcase', description: 'Local artists exhibition',
        date: '2024-07-05T11:00:00Z', location: 'Portland, OR', totalTickets: 150, availableTickets: 60,
        organizerId: '2', status: 'active', price: 30,
        image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=400&h=300&fit=crop'
      },
      {
        id: '7', title: 'Dream Theater Live', description: 'Progressive rock concert',
        date: '2024-05-20T19:00:00Z', location: 'Seattle, WA', totalTickets: 250, availableTickets: 248,
        organizerId: '2', status: 'active', price: 85,
        image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=300&fit=crop'
      }
    ];

    this.bookings = [
      { id: '1', userId: '1', eventId: '7', tickets: 2, createdAt: new Date().toISOString(), idempotencyKey: 'book_1' },
      { id: '2', userId: '1', eventId: '5', tickets: 2, createdAt: new Date(Date.now() - 1800000).toISOString(), idempotencyKey: 'book_2' }
    ];
  }

  query(table) {
    return this[table];
  }

  findOne(table, predicate) {
    return this[table].find(predicate);
  }

  insert(table, data) {
    this[table].push(data);
    return data;
  }

  update(table, id, updates) {
    const index = this[table].findIndex(item => item.id === id);
    if (index !== -1) {
      this[table][index] = { ...this[table][index], ...updates };
      return this[table][index];
    }
    return null;
  }

  delete(table, id) {
    const index = this[table].findIndex(item => item.id === id);
    if (index !== -1) {
      this[table].splice(index, 1);
      return true;
    }
    return false;
  }
}

const db = new Database();

// API Simulation
const API = {
  async auth(endpoint, data) {
    await new Promise(r => setTimeout(r, 500));
    Logger.info(`POST /auth/${endpoint}`, { email: data.email });
    
    if (endpoint === 'login') {
      const user = db.findOne('users', u => u.email === data.email && u.password === data.password);
      if (!user) throw new Error('Invalid credentials');
      const token = `jwt_${user.id}_${Date.now()}`;
      return { user: { ...user, password: undefined }, token };
    }
    
    if (endpoint === 'register') {
      if (db.findOne('users', u => u.email === data.email)) {
        throw new Error('Email already exists');
      }
      const user = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'customer'
      };
      db.insert('users', user);
      const token = `jwt_${user.id}_${Date.now()}`;
      return { user: { ...user, password: undefined }, token };
    }
  },

  async getEvents() {
    await new Promise(r => setTimeout(r, 300));
    Logger.info('GET /events');
    return db.query('events').filter(e => e.status === 'active');
  },

  async getEvent(id) {
    await new Promise(r => setTimeout(r, 200));
    Logger.info('GET /events/:id', { eventId: id });
    const event = db.findOne('events', e => e.id === id);
    if (!event) throw new Error('Event not found');
    return event;
  },

  async createEvent(data, userId) {
    await new Promise(r => setTimeout(r, 400));
    Logger.info('POST /events', { title: data.title });
    
    const event = {
      id: Date.now().toString(),
      ...data,
      organizerId: userId,
      status: 'active',
      availableTickets: data.totalTickets
    };
    db.insert('events', event);
    return event;
  },

  async updateEvent(id, data, userId) {
    await new Promise(r => setTimeout(r, 400));
    Logger.info('PUT /events/:id', { eventId: id });
    
    const event = db.findOne('events', e => e.id === id);
    if (!event) throw new Error('Event not found');
    if (event.organizerId !== userId) throw new Error('Unauthorized');
    
    const bookings = db.query('bookings').filter(b => b.eventId === id);
    const bookedTickets = bookings.reduce((sum, b) => sum + b.tickets, 0);
    
    if (data.totalTickets && data.totalTickets < bookedTickets) {
      throw new Error(`Cannot reduce tickets below ${bookedTickets} (already booked)`);
    }
    
    const updated = db.update('events', id, {
      ...data,
      availableTickets: data.totalTickets ? data.totalTickets - bookedTickets : event.availableTickets
    });
    
    BackgroundQueue.enqueue({
      id: `job_${Date.now()}`,
      type: 'EVENT_UPDATE',
      data: {
        eventTitle: updated.title,
        affectedUsers: bookings.length,
        changes: Object.keys(data).join(', ')
      }
    });
    
    return updated;
  },

  async deleteEvent(id, userId) {
    await new Promise(r => setTimeout(r, 300));
    Logger.info('DELETE /events/:id', { eventId: id });
    
    const event = db.findOne('events', e => e.id === id);
    if (!event) throw new Error('Event not found');
    if (event.organizerId !== userId) throw new Error('Unauthorized');
    
    const hasBookings = db.query('bookings').some(b => b.eventId === id);
    if (hasBookings) {
      db.update('events', id, { status: 'cancelled' });
      Logger.warn('Event soft deleted (has bookings)', { eventId: id });
    } else {
      db.delete('events', id);
    }
    return true;
  },

  async createBooking(data, userId) {
    await new Promise(r => setTimeout(r, 500));
    Logger.info('POST /bookings', { eventId: data.eventId, tickets: data.tickets });
    
    if (db.findOne('bookings', b => b.idempotencyKey === data.idempotencyKey)) {
      throw new Error('Duplicate booking detected');
    }
    
    const event = db.findOne('events', e => e.id === data.eventId);
    if (!event) throw new Error('Event not found');
    if (event.status !== 'active') throw new Error('Event is not available');
    if (new Date(event.date) < new Date()) throw new Error('Cannot book past events');
    if (event.availableTickets < data.tickets) throw new Error('Not enough tickets available');
    
    db.update('events', data.eventId, {
      availableTickets: event.availableTickets - data.tickets
    });
    
    const booking = {
      id: Date.now().toString(),
      userId,
      eventId: data.eventId,
      tickets: data.tickets,
      createdAt: new Date().toISOString(),
      idempotencyKey: data.idempotencyKey
    };
    db.insert('bookings', booking);
    
    const user = db.findOne('users', u => u.id === userId);
    BackgroundQueue.enqueue({
      id: `job_${Date.now()}`,
      type: 'BOOKING_CONFIRMATION',
      data: {
        userName: user.name,
        userEmail: user.email,
        eventTitle: event.title,
        tickets: data.tickets,
        eventDate: event.date
      }
    });
    
    Logger.info('Booking success', { bookingId: booking.id, eventId: data.eventId });
    return booking;
  },

  async getMyBookings(userId) {
    await new Promise(r => setTimeout(r, 300));
    Logger.info('GET /bookings/my', { userId });
    const bookings = db.query('bookings').filter(b => b.userId === userId);
    return bookings.map(b => ({
      ...b,
      event: db.findOne('events', e => e.id === b.eventId)
    }));
  },

  async getEventBookings(eventId, userId) {
    await new Promise(r => setTimeout(r, 300));
    Logger.info('GET /bookings/event/:id', { eventId });
    
    const event = db.findOne('events', e => e.id === eventId);
    if (event.organizerId !== userId) throw new Error('Unauthorized');
    
    const bookings = db.query('bookings').filter(b => b.eventId === eventId);
    return bookings.map(b => ({
      ...b,
      user: db.findOne('users', u => u.id === b.userId)
    }));
  }
};

// ============================================================================
// AUTH CONTEXT
// ============================================================================

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    const result = await API.auth('login', { email, password });
    setUser(result.user);
  };

  const register = async (name, email, password) => {
    const result = await API.auth('register', { name, email, password });
    setUser(result.user);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// ============================================================================
// COMPONENTS - LOGIN
// ============================================================================

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Event Booking</h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Login to your account' : 'Create a new account'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Processing...
              </>
            ) : (
              isLogin ? 'Login' : 'Sign Up'
            )}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm">
          <p className="font-medium text-gray-700 mb-2">Test Accounts:</p>
          <p className="text-gray-600">Customer: customer@test.com / pass123</p>
          <p className="text-gray-600">Organizer: organizer@test.com / pass123</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTS - CUSTOMER INTERFACE
// ============================================================================

const CustomerInterface = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: API.getEvents,
    refetchInterval: 30000
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => API.getMyBookings(user.id)
  });

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-800">Event Explorer</h1>
              <nav className="flex gap-6">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`pb-1 border-b-2 transition ${
                    activeTab === 'home'
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`pb-1 border-b-2 transition ${
                    activeTab === 'bookings'
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-1 border-b-2 transition ${
                    activeTab === 'profile'
                      ? 'border-blue-600 text-blue-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  My Profile
                </button>
              </nav>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Logout
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'home' && (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome, {user.name}</h2>

            <div className="flex gap-4 mb-8 mt-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search events"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button className="px-6 py-3 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
                All Categories
                <ChevronDown size={16} />
              </button>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Events</h3>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="animate-spin text-blue-600" size={40} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => setSelectedEvent(event)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">My Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-20">
                <Ticket size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">My Profile</h2>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={user.name}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={user.email}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                    value="Customer"
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};

const EventCard = ({ event, onClick }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isLowStock = event.availableTickets > 0 && event.availableTickets <= 50;
  const isSoldOut = event.availableTickets === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
      <div className="h-48 overflow-hidden">
        <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
      </div>
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{event.location}</span>
          </div>
        </div>

        {isLowStock && (
          <div className="mb-3">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full">
              {event.availableTickets} Tickets Left
            </span>
          </div>
        )}

        {isSoldOut ? (
          <button className="w-full bg-red-500 text-white py-3 rounded-lg font-medium" disabled>
            Sold Out
          </button>
        ) : (
          <button
            onClick={onClick}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {isLowStock ? 'Book Now' : 'View Details'}
          </button>
        )}
      </div>
    </div>
  );
};

const BookingCard = ({ booking }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isSoldOut = booking.event.availableTickets === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition">
      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
        <img src={booking.event.image} alt={booking.event.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-800">{booking.event.title}</h3>
        <p className="text-sm text-gray-600">{formatDate(booking.event.date)}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-gray-800">{booking.tickets}</p>
        <p className="text-sm text-gray-600">Tickets</p>
        {isSoldOut && (
          <span className="inline-block mt-2 bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full">
            Sold Out
          </span>
        )}
      </div>
      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
        View Booking
      </button>
    </div>
  );
};

const EventDetailsModal = ({ event, onClose }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const queryClient = useQueryClient();

  const bookingMutation = useMutation({
    mutationFn: (data) => API.createBooking(data, user.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['events']);
      queryClient.invalidateQueries(['myBookings']);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  });

  const handleBook = () => {
    bookingMutation.mutate({
      eventId: event.id,
      tickets,
      idempotencyKey: `book_${user.id}_${event.id}_${Date.now()}`
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {showSuccess ? (
          <div className="p-12 text-center">
            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600">Check your email for confirmation details</p>
          </div>
        ) : (
          <>
            <div className="relative h-64">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{event.title}</h2>
              <p className="text-gray-600 mb-6">{event.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar size={20} className="text-blue-600" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Clock size={20} className="text-blue-600" />
                  <span>{formatTime(event.date)}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <MapPin size={20} className="text-blue-600" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <Users size={20} className="text-blue-600" />
                  <span>{event.availableTickets} / {event.totalTickets} tickets available</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <DollarSign size={20} className="text-blue-600" />
                  <span>${event.price} per ticket</span>
                </div>
              </div>

              {bookingMutation.isError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} />
                  <span>{bookingMutation.error.message}</span>
                </div>
              )}

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Number of Tickets</label>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setTickets(Math.max(1, tickets - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-xl"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-gray-800 w-12 text-center">{tickets}</span>
                  <button
                    onClick={() => setTickets(Math.min(event.availableTickets, tickets + 1))}
                    className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center text-xl"
                  >
                    +
                  </button>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-800">${event.price * tickets}</p>
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={bookingMutation.isPending || event.availableTickets === 0}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bookingMutation.isPending ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTS - ORGANIZER DASHBOARD
// ============================================================================

const OrganizerDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const { data: events = [] } = useQuery({
    queryKey: ['organizerEvents'],
    queryFn: API.getEvents
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: async () => {
      const bookingsPromises = events.map(e => API.getEventBookings(e.id, user.id).catch(() => []));
      const results = await Promise.all(bookingsPromises);
      return results.flat();
    },
    enabled: events.length > 0
  });

  const myEvents = events.filter(e => e.organizerId === user.id);
  const totalTicketsSold = allBookings.reduce((sum, b) => sum + b.tickets, 0);
  const totalRevenue = allBookings.reduce((sum, b) => {
    const event = myEvents.find(e => e.id === b.eventId);
    return sum + (event ? event.price * b.tickets : 0);
  }, 0);

  const recentBookings = allBookings
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="bg-slate-800 bg-opacity-50 backdrop-blur-sm border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-white">Organizer Dashboard</h1>
              <nav className="flex gap-6">
                {['Dashboard', 'My Events', 'Bookings', 'Notifications'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                    className={`pb-1 border-b-2 transition text-sm ${
                      activeTab === tab.toLowerCase().replace(' ', '')
                        ? 'border-blue-400 text-blue-400 font-medium'
                        : 'border-transparent text-gray-300 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white border border-slate-600 rounded-lg hover:bg-slate-700"
            >
              Logout
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'dashboard' && (
          <>
            <h2 className="text-3xl font-bold text-white mb-8">Welcome, {user.name}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard title="Total Events" value={myEvents.length} />
              <StatCard title="Total Bookings" value={allBookings.length} />
              <StatCard title="Tickets Sold" value={totalTicketsSold.toLocaleString()} />
              <StatCard title="Revenue" value={`$${totalRevenue.toLocaleString()}`} />
            </div>

            <div className="bg-white rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Manage Your Events</h3>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={20} />
                  Create New Event
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="pb-3 text-sm font-medium text-gray-600">Event</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Date</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Tickets</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="pb-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myEvents.map(event => (
                      <EventRow
                        key={event.id}
                        event={event}
                        onEdit={() => setEditingEvent(event)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Recent Bookings</h3>
              <div className="space-y-4">
                {recentBookings.slice(0, 5).map(booking => (
                  <RecentBookingCard key={booking.id} booking={booking} events={myEvents} />
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'myevents' && (
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800">My Events</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={20} />
                Create New Event
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map(event => (
                <EventCard key={event.id} event={event} onClick={() => setEditingEvent(event)} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">All Bookings</h2>
            <div className="space-y-4">
              {allBookings.map(booking => (
                <RecentBookingCard key={booking.id} booking={booking} events={myEvents} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Notifications</h2>
            <div className="text-center py-20">
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No new notifications</p>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <EventFormModal onClose={() => setShowCreateModal(false)} />
      )}

      {editingEvent && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm">
    <p className="text-sm text-gray-600 mb-2">{title}</p>
    <p className="text-3xl font-bold text-gray-800">{value}</p>
  </div>
);

const EventRow = ({ event, onEdit }) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => API.deleteEvent(event.id, event.organizerId),
    onSuccess: () => {
      queryClient.invalidateQueries(['organizerEvents']);
    }
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = () => {
    const ticketsLeft = event.availableTickets;
    if (ticketsLeft === 0) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Sold Out</span>;
    } else if (ticketsLeft < 50) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Upcoming</span>;
    }
    return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Active</span>;
  };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-4 font-medium text-gray-800">{event.title}</td>
      <td className="py-4 text-gray-600">{formatDate(event.date)}</td>
      <td className="py-4 text-gray-600">{event.availableTickets} / {event.totalTickets}</td>
      <td className="py-4">{getStatusBadge()}</td>
      <td className="py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Edit
          </button>
          <button
            onClick={() => {
              if (window.confirm('Delete this event?')) {
                deleteMutation.mutate();
              }
            }}
            className="p-2 bg-slate-700 text-white rounded hover:bg-slate-800"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const RecentBookingCard = ({ booking, events }) => {
  const event = events.find(e => e.id === booking.eventId);
  if (!event) return null;

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
        {booking.user?.name?.charAt(0) || 'U'}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-800">{booking.user?.name || 'Unknown User'}</p>
        <p className="text-sm text-gray-600">
          {booking.tickets} Ticket{booking.tickets > 1 ? 's' : ''} for <span className="font-medium">{event.title}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500">{timeAgo(booking.createdAt)}</p>
      </div>
    </div>
  );
};

const EventFormModal = ({ event, onClose }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(event || {
    title: '',
    description: '',
    date: '',
    location: '',
    totalTickets: 100,
    price: 50,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop'
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      if (event) {
        return API.updateEvent(event.id, data, user.id);
      }
      return API.createEvent(data, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['organizerEvents']);
      queryClient.invalidateQueries(['events']);
      onClose();
    }
  });

  const handleSubmit = () => {
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              {event ? 'Edit Event' : 'Create New Event'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>

          {mutation.isError && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{mutation.error.message}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.date ? new Date(formData.date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Tickets</label>
                <input
                  type="number"
                  value={formData.totalTickets}
                  onChange={(e) => setFormData({ ...formData, totalTickets: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Saving...
                </>
              ) : (
                event ? 'Update Event' : 'Create Event'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryClientProvider>
  );
};

const AppRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return user.role === 'customer' ? <CustomerInterface /> : <OrganizerDashboard />;
};

export default App;
