`import MONGO_URI from "../../.env"`
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Fix for "querySrv ECONNREFUSED" which happens when the local DNS blocks or fails the SRV lookup (common on college WiFi/Windows)
        require('dns').setServers(['8.8.8.8', '8.8.4.4']);

        const conn = await mongoose.connect(process.env.MONGO_URI.replace(/"/g, ''), {
            serverSelectionTimeoutMS: 5000,
            family: 4 // Force IPv4 to prevent IPv6 routing issues
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB connection error: ${err.message}`);
        process.exit(1); // exit process on DB failure
    }
};

module.exports = connectDB;
