import express from 'express'
import {
  getConversation,
  getRecentConversations
} from '../controllers/messageController.js'
import { protect } from '../controllers/authController.js'

const messageRouter = express.Router()

messageRouter.get('/recent', protect, getRecentConversations)
messageRouter.get('/:userId', protect, getConversation)

export default messageRouter