import mongoose from 'mongoose'

const msgSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {  
        type: String,
        required: true,
        maxlength: 500,
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

msgSchema.index({ sender: 1, receiver: 1, createdAt: -1, _id: -1 })
msgSchema.index({ receiver: 1, sender: 1, createdAt: -1, _id: -1 })

export default mongoose.model('Message', msgSchema)