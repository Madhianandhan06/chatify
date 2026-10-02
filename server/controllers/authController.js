import 'dotenv/config'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/UserModel.js'
import Message from '../models/MsgModel.js'


const JWT_SECRET = process.env.JWT_SECRET_KEY
const isProduction = process.env.NODE_ENV === 'production'
const authCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

// protected route middleware
export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' })
        }

        const decoded = jwt.verify(token, JWT_SECRET)
        const user = await User.findById(decoded.userId).select('-password')

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        req.user = user
        next()
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' })
    }
}

export const getCurrentUser = async (req, res) => {
    try {
        // Read the token from the httpOnly cookie and verify its user ID.
        res.set('Cache-Control', 'no-store')
        const user = await User.findById(req.user._id).select('-password')

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        return res.status(200).json({ user })
    } catch (error) {
        return res.status(401).json({ message: 'Not authenticated' })
    }
}

export const getUsers = async (req, res) => {
  try {
    const users = await User
      .find({ _id: { $ne: req.user._id } })
      .select('_id name')

    res.json(users)
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch users'
    })
  }
}

export const register = async (req, res) => {
    const name = req.body.name?.trim()
    const email = req.body.email?.trim().toLowerCase()
    const { password } = req.body

    if(!name || !email || !password){
        return res.status(400).json({ message: `Please provide all required fields` })
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }
    const existiging = await User.findOne({email})

    if(existiging){
        return res.status(409).json({ message: `Account already exists try to login` })
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({ name, email, password: hashedPassword }) 

        const token = jwt.sign (
            { userId : user._id.toString() },
            JWT_SECRET,
            { expiresIn : '7d' } 
        )

        res.cookie('token', token, authCookieOptions)

        return res.status(201).json({
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export const login = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase()
    const { password } = req.body

    if(!email || !password){
        return res.status(400).json({ message: 'Invalid credentials' })
    }

    const user = await User.findOne({email})

    if(!user){
        return res.status(401).json({ message: 'User not found' })
    }
    try {
       const isMatch = await bcrypt.compare(password, user.password)
       
       if(!isMatch){
        return res.status(401).json({ message: 'Password was wrong' })
       }
        
        const token = jwt.sign (
            { userId : user._id.toString() },
            JWT_SECRET,
            { expiresIn : '7d' } 
        )

        res.cookie('token', token, authCookieOptions)

        return res.status(200).json({
            message: 'Logged in successfully!',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        })

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}