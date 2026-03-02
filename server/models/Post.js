const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: [300, 'Comment cannot exceed 300 characters'] },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Post content is required'],
        maxlength: [500, 'Post cannot exceed 500 characters'],
        trim: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Optional reference to either an imdbID or MongoDB movie ObjectId string
    movieRef: { type: String, default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
