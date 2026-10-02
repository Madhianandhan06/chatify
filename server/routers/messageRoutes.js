import express from 'express'
import { getConversation } from '../controllers/messageController.js'
import { protect } from '../controllers/authController.js'

const messageRouter = express.Router()

messageRouter.get('/:userId', protect, getConversation)

export default messageRouter