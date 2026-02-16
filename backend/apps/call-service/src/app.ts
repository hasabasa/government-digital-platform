import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { callRoutes } from './routes/call.routes';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic auth middleware (simplified)
app.use((req, res, next) => {
  // In real implementation, verify JWT token
  req.user = { id: 'user-123', email: 'test@example.com', role: 'admin' };
  next();
});

// Routes
app.use('/api/v1/calls', callRoutes);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'call-service',
    timestamp: new Date().toISOString(),
  });
});

// WebSocket for real-time communication
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });
  
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    socket.to(roomId).emit('user-left', socket.id);
  });
  
  socket.on('webrtc-signal', (data) => {
    socket.to(data.to).emit('webrtc-signal', {
      from: socket.id,
      signal: data.signal
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

export { app, server, io };
