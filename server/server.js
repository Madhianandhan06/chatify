import express from 'express'
import http from 'http'
import { WebSocket, WebSocketServer } from 'ws'
import dotenv from 'dotenv'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import connectDB from './db.js'
import authRouter from './routers/authRoutes.js'
import Message from './models/MsgModel.js'
import User from './models/UserModel.js'
import messageRouter from './routers/messageRoutes.js'
dotenv.config()
const app = express()

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''))
  .filter(Boolean)

await connectDB() // Ensure you call the connectDB function to connect to the database
app.use(cors({
  // cors callback function checks whether browser's headers or allowedOrigins array contains credible client request
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    // rejects if url is invalid
    return callback(new Error('Origin is not allowed by CORS'))
  },
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

  
app.use('/auth', authRouter)
app.use('/messages', messageRouter) // Add this line to use the messageRouter for /messages route

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const PORT = process.env.PORT || 3000

const server = http.createServer(app)

const wss = new WebSocketServer({
  server
})

const onlineUsers = new Map()

function sendSocketError(socket, message) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'error', message }))
  }
}

wss.on('connection', (socket, request) => {
  try {
    const cookies = request.headers.cookie

    const token = cookies
      ?.split('; ')
      .find(cookie => cookie.startsWith('token='))
      ?.split('=')[1]

    if (!token) {
      socket.close()
      return
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    )

    socket.userId = decoded.userId

    function broadcastOnlineUsers() {
      const onlineUserIds = [...onlineUsers.keys()]

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'onlineUsers',
            users: onlineUserIds
          }))
        }
      })
    }

    onlineUsers.set(socket.userId, socket)
    broadcastOnlineUsers()
    
    console.log(`Online users:` , [...onlineUsers.keys()])
    console.log('Authenticated user:', socket.userId)

    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString())
        const receiverId = data?.receiverId
        const text = typeof data?.text === 'string' ? data.text.trim() : ''

        if (data?.type !== 'chat' || !mongoose.isValidObjectId(receiverId)) {
          sendSocketError(socket, 'Invalid chat recipient.')
          return
        }
        if (!text || text.length > 500) {
          sendSocketError(socket, 'Message must be between 1 and 500 characters.')
          return
        }

        const receiver = await User.findById(receiverId).select('_id')
        if (!receiver) {
          sendSocketError(socket, 'Recipient not found.')
          return
        }

        const savedMessage = await Message.create({
          sender: socket.userId,
          receiver: receiver._id,
          text
        })
        const serializedMessage = JSON.stringify({
          type: 'chat',
          message: savedMessage
        })

        const receiverSocket = onlineUsers.get(receiver._id.toString())
        if (receiverSocket?.readyState === WebSocket.OPEN) {
          receiverSocket.send(serializedMessage)
        }
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(serializedMessage)
        }
      } catch (error) {
        console.error('Failed to process WebSocket message:', error)
        sendSocketError(socket, 'Message could not be sent. Please try again.')
      }
    })

    socket.on('close', () => {
    onlineUsers.delete(socket.userId)
    broadcastOnlineUsers()
    console.log('User disconnected:', socket.userId)
  })

  } catch (error) {
    console.log('WebSocket authentication failed')
    onlineUsers.delete(socket.userId)
    socket.close()
  }
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})