import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import ticketRoutes from './routes/tickets.js';
import departmentRoutes from './routes/departments.js';
import chatRoutes from './routes/chats.js';
import Department from './models/Department.js';
import EmergencyChat from './models/EmergencyChat.js';
import { seedDepartments } from './config/departmentsConfig.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Configure Socket.io with CORS allowances and larger buffer for images
const io = new Server(server, {
  maxHttpBufferSize: 1e8, // 100 MB max payload size for camera Base64 payloads
  cors: {
    origin: '*', // Allow all origins for dev/simulation context
    methods: ['GET', 'POST']
  }
});

// Expose Socket.io instance to routers
app.set('io', io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/chats', chatRoutes);

// Root route for validation checks
app.get('/', (req, res) => {
  res.send('Hospital Queue Routing Backend is running (Mock Database Mode).');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Lỗi hệ thống:', err);
  res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống nghiêm trọng.' });
});

async function initializeDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB.');
    console.log('Syncing departments configurations...');
    await Department.deleteMany({});
    await Department.insertMany(seedDepartments);
    console.log('Successfully seeded and synchronized department sub-rooms.');
  } catch (error) {
    console.error('Database connection / initialization failed:', error);
    process.exit(1);
  }
}

// Websocket connection listeners
io.on('connection', (socket) => {
  console.log('Đã kết nối Socket Client:', socket.id);

  socket.on('emergency_chat_message', async (payload) => {
    try {
      const newMsg = new EmergencyChat({
         ticketId: payload.ticketId,
         sender: payload.sender,
         text: payload.text,
         isPhoto: payload.isPhoto,
         photoUrl: payload.photoUrl,
         timestamp: payload.timestamp
      });
      await newMsg.save();
    } catch (err) {
      console.error('Lỗi khi lưu tin nhắn chat vào Database:', err);
    }
    
    // Broadcast message to ALL connected clients (both Staff and Patient will filter by TicketId on their side)
    io.emit('emergency_chat_message', payload);
  });

  socket.on('emergency_chat_typing', (payload) => {
    io.emit('emergency_chat_typing', payload);
  });

  socket.on('emergency_chat_seen', (payload) => {
    io.emit('emergency_chat_seen', payload);
  });

  socket.on('disconnect', () => {
    console.log('Đã ngắt kết nối Socket Client:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

initializeDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
});
