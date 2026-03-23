const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Can be an OMDb imdbID (string) or a MongoDB ObjectId string for independent films
    movieId: { type: String, required: [true, 'Movie ID is required'] },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    opinion: {
        type: String,
        required: [true, 'Opinion is required'],
        enum: {
            values: ['skip', 'considerable', 'goForIt', 'excellent'],
            message: 'Opinion must be one of: skip, considerable, goForIt, excellent',
        },
    },
    comment: { type: String, maxlength: 500, default: '' },
}, { timestamps: true });


// Enforce one review per user per movie at the database level
reviewSchema.index({ movieId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
