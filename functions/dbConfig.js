const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB);

const headerSchema = new mongoose.Schema({
    headers: {},
    type: String
});

const Headers = mongoose.model('headers', headerSchema);
console.log('DB connected');
module.exports = Headers;