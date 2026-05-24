const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Fix for "querySrv ECONNREFUSED" which happens when the local DNS blocks or fails the SRV lookup (common on college WiFi/Windows)
        require('dns').setServers(['8.8.8.8', '8.8.4.4']);

        const conn = await mongoose.connect(process.env.MONGO_URI.replace(/"/g, ''), {
            serverSelectionTimeoutMS: 2000,
            family: 4 // Force IPv4 to prevent IPv6 routing issues
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.warn(`⚠️ MongoDB Atlas connection failed: ${err.message}. Starting local fallback database...`);
        try {
            const localUri = 'mongodb://127.0.0.1:27017/FilmCircle';
            const conn = await mongoose.connect(localUri, {
                serverSelectionTimeoutMS: 2000,
                family: 4
            });
            console.log(`✅ Connected to Local Fallback MongoDB: ${conn.connection.host}`);
            
            // Seed a user and some clubs if the database is completely empty
            const User = require('../models/User');
            const Club = require('../models/Club');
            
            const userCount = await User.countDocuments();
            if (userCount === 0) {
                // Create a default admin user
                const admin = await User.create({
                    username: 'admin',
                    email: 'admin@example.com',
                    password: 'password123'
                });
                
                const DEFAULT_CLUBS = [
                    { name: 'Drama Circle', genre: 'Drama', description: 'For lovers of emotionally rich, character-driven stories.', logoUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=100', bannerUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500' },
                    { name: 'Horror Hideout', genre: 'Horror', description: 'If you enjoy the thrill of fear.', logoUrl: '', bannerUrl: '' },
                    { name: 'Sci-Fi Universe', genre: 'Sci-Fi', description: 'Exploring the cosmos.', logoUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100', bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500' },
                    { name: 'Action Junkies', genre: 'Action', description: 'High-octane sequences.', logoUrl: '', bannerUrl: '' },
                ];
                
                for (const c of DEFAULT_CLUBS) {
                    await Club.create({
                        ...c,
                        createdBy: admin._id,
                        members: [admin._id]
                    });
                }
                console.log('✅ Local database seeded successfully with mock clubs.');
            }
        } catch (localErr) {
            console.error(`❌ Critical error starting local MongoDB: ${localErr.message}`);
            process.exit(1);
        }
    }
};

module.exports = connectDB;
