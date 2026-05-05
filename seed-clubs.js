/**
 * seed-clubs.js
 * Run once to create default genre clubs in MongoDB.
 * Usage: node server/seed-clubs.js
 */
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');

const DEFAULT_CLUBS = [
    { name: 'Drama Circle', genre: 'Drama', description: 'For lovers of emotionally rich, character-driven stories that move the soul.' },
    { name: 'Horror Hideout', genre: 'Horror', description: 'If you enjoy the thrill of fear — from slashers to slow-burn psychological horror.' },
    { name: 'Sci-Fi Universe', genre: 'Sci-Fi', description: 'Exploring the cosmos, dystopias, AI, and everything beyond human imagination.' },
    { name: 'Action Junkies', genre: 'Action', description: 'High-octane sequences, car chases, fight choreography — the works.' },
    { name: 'Indie Spotlight', genre: 'Independent', description: 'Celebrating independent filmmakers and hidden gems from around the world.' },
    { name: 'Bollywood Buzz', genre: 'Bollywood', description: 'Song, dance, drama — the magic of Indian cinema lives here.' },
];

async function seed() {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('❌  MONGO_URI is not set in .env');
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('✅  Connected to MongoDB');

    // Dynamically require models after connection
    const User = require('./server/models/User');
    const Club = require('./server/models/Club');

    // Try to find a system/admin user; if none, use the first user
    let systemUser = await User.findOne({ username: 'admin' });
    if (!systemUser) systemUser = await User.findOne().sort({ createdAt: 1 });
    if (!systemUser) {
        console.error('❌  No users in the database. Register at least one user first, then run this script.');
        process.exit(1);
    }

    console.log(`🎬  Seeding clubs as user: ${systemUser.username}`);
    
    // Clear existing clubs to avoid clutter
    await Club.deleteMany({});
    console.log('🧹 Cleared all existing clubs.');

    let created = 0;

    for (const clubData of DEFAULT_CLUBS) {

        await Club.create({
            name: clubData.name,
            genre: clubData.genre,
            description: clubData.description,
            createdBy: systemUser._id,
            members: [systemUser._id],
        });
        console.log(`  ✓  Created "${clubData.name}"`);
        created++;
    }

    console.log(`\n🎉  Done! Created ${created} clubs.`);
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
