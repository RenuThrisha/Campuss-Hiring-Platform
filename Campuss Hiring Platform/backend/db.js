const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sphp';

mongoose.connect(mongoUri);

const db = mongoose.connection;
db.on('connected', () => {
    console.log('MongoDB connected');
});
db.on('disconnected', () => {
    console.log('MongoDB disconnected');
});
db.on('error', (err) => {
    console.error(err);
});

module.exports = { db };