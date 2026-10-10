import mongoose from 'mongoose'
import Message from '../models/MsgModel.js'


export const getConversation = async (req, res) => {
  const otherUserId = req.params.userId

  if (!mongoose.isValidObjectId(otherUserId)) {
    return res.status(400).json({ message: 'Invalid user ID' })
  }

  const requestedLimit = Number(req.query.limit ?? 50)
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1) {
    return res.status(400).json({ message: 'Limit must be a positive integer' })
  }

  const limit = Math.min(requestedLimit, 100)
  const beforeId = req.query.before
  if (beforeId && !mongoose.isValidObjectId(beforeId)) {
    return res.status(400).json({ message: 'Invalid message cursor' })
  }

  try {
    const currentUserId = req.user._id
    const conversationFilter = {
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
    }
    let query = conversationFilter

    if (beforeId) {
      const cursor = await Message.findOne({
        _id: beforeId,
        ...conversationFilter,
      }).select('createdAt')

      if (!cursor) {
        return res.status(400).json({ message: 'Message cursor is not in this conversation' })
      }

      query = {
        $and: [
          conversationFilter,
          {
            $or: [
              { createdAt: { $lt: cursor.createdAt } },
              { createdAt: cursor.createdAt, _id: { $lt: cursor._id } }
            ]
          }
        ]
      }
    }

    const results = await Message.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean()

    const hasMore = results.length > limit
    const messages = results.slice(0, limit).reverse()

    res.json({ messages, hasMore })

  } catch (error) {
    console.error('Failed to fetch conversation:', error)

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
      },{
        $lookup: {
          from: 'messages',
          let: { otherUserId: '$userId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$sender', '$$otherUserId'] },
                    { $eq: ['$receiver', currentUserId] },
                    { $eq: ['$read', false] }
                  ]
                }
              }
            },
            {
              $count: 'count'
            }
          ],
          as: 'unread'
        }
      },
      {
        $project: {
          userId: 1,
          text: 1,
          sender: 1,
          createdAt: 1,
          unreadCount: {
            $ifNull: [
              { $arrayElemAt: ['$unread.count', 0] },
              0
            ]
          }
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

export const markMessagesAsRead = async (req, res) => {
  try {
    const currentUserId = req.user._id
    const otherUserId = req.params.userId

    await Message.updateMany(
      {
        sender: otherUserId,
        receiver: currentUserId,
        read: false
      },
      {
        $set: { read: true }
      }
    )

    res.json({ message: 'Messages marked as read' })
  } catch (error) {
    console.error('Failed to mark messages as read:', error)

    res.status(500).json({
      message: 'Failed to mark messages as read'
    })
  }
}