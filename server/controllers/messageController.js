import mongoose from 'mongoose'
import Message from '../models/MsgModel.js'


export const getConversation = async (req, res) => {

    console.log('Current user:', req.user._id)
    console.log('Other user:', req.params.userId)
  const otherUserId = req.params.userId

  if (!mongoose.isValidObjectId(otherUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  try {
    const currentUserId = req.user._id

    const messages = await Message.find({
      $or: [
        {
          sender: currentUserId,
          receiver: otherUserId
        },
        {
          sender: otherUserId,
          receiver: currentUserId
        }
      ]
    }).sort({ createdAt: 1 })

    res.json(messages)

  } catch (error) {
    console.error(error)

    res.status(500).json({
      message: 'Failed to fetch conversation'
    })
  }
}

export const getRecentConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ]
        }
      },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $addFields: {
          conversationUserId: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          }
        }
      },
      {
        $group: {
          _id: '$conversationUserId',
          latestMessage: { $first: '$$ROOT' }
        }
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          text: '$latestMessage.text',
          sender: '$latestMessage.sender',
          createdAt: '$latestMessage.createdAt'
        }
      }
    ])

    res.json(conversations)
  } catch (error) {
    console.error('Failed to fetch recent conversations:', error)
    res.status(500).json({
      message: 'Failed to fetch recent conversations'
    })
  }
}