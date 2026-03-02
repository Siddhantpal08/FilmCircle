const mongoose = require('mongoose');

const clubPostSchema = new mongoose.Schema({
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: [500, 'Club post cannot exceed 500 characters'] },
}, { timestamps: true });

const clubSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Club name is required'],
        unique: true,
        trim: true,
        maxlength: [60, 'Club name cannot exceed 60 characters'],
    },
    description: { type: String, default: '', maxlength: [400, 'Description cannot exceed 400 characters'] },
    genre: { type: String, default: 'General' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posts: [clubPostSchema],
}, { timestamps: true });

module.exports = mongoose.model('Club', clubSchema);
