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
    { name: 'Thriller Addicts', genre: 'Thriller', description: 'Edge-of-your-seat suspense, twists, and mysteries. No spoilers without warnings!' },
    { name: 'Sci-Fi Universe', genre: 'Sci-Fi', description: 'Exploring the cosmos, dystopias, AI, and everything beyond human imagination.' },
    { name: 'Comedy Corner', genre: 'Comedy', description: 'Because sometimes you just need a good laugh. All styles of comedy welcome.' },
    { name: 'Action Junkies', genre: 'Action', description: 'High-octane sequences, car chases, fight choreography — the works.' },
    { name: 'Romance Reels', genre: 'Romance', description: 'Love stories, heartbreaks, and everything in between.' },
    { name: 'Indie Spotlight', genre: 'Independent', description: 'Celebrating independent filmmakers and hidden gems from around the world.' },
    { name: 'Documentary Hub', genre: 'Documentary', description: 'Real stories, real impact. From nature docs to political exposés.' },
    { name: 'Animation Station', genre: 'Animation', description: 'Anime, Pixar, Studio Ghibli, and everything animated under the sun.' },
    { name: 'Bollywood Buzz', genre: 'Bollywood', description: 'Song, dance, drama — the magic of Indian cinema lives here.' },
    { name: 'World Cinema', genre: 'International', description: 'French new wave, Korean thrillers, Japanese dramas — no language barrier here.' },
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
    let created = 0;
    let skipped = 0;

    for (const clubData of DEFAULT_CLUBS) {
        const exists = await Club.findOne({ name: clubData.name });
        if (exists) {
            console.log(`  ⏩  Skipping "${clubData.name}" (already exists)`);
            skipped++;
            continue;
        }
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

    console.log(`\n🎉  Done! Created ${created} clubs, skipped ${skipped} existing ones.`);
    await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
