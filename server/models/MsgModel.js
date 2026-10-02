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
})
export default mongoose.model('Message', msgSchema)