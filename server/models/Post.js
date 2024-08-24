const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.Types.ObjectId, // Reference to the User model
        ref: 'User', // Model name to reference
        required: true
    }
});

module.exports = mongoose.model('Post', PostSchema);