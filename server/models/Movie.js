const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: [true, 'Title is required'], trim: true },
    // imdbID is null/absent for independent films
    imdbID: { type: String, sparse: true, unique: true },
    year: { type: String },
    genre: { type: String },
    director: { type: String },
    actors: { type: String },
    plot: { type: String },
    posterUrl: { type: String, default: '' },
    streamingLinks: [{
        platform: { type: String },   // e.g. "Netflix", "YouTube"
        url: { type: String },
    }],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isIndependent: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
