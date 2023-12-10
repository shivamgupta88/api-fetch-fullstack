const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://tsg782:Kali404%40@cluster0.geky49y.mongodb.net/cryptodb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Create a mongoose schema and model
const cryptoDataSchema = new mongoose.Schema({
    name: String,
    last: Number,
    buy: Number,
    sell: Number,
    volume: Number,
    base_unit: String,
});

const CryptoData = mongoose.model('CryptoData', cryptoDataSchema);

// Fetch data from the WazirX API and store only specific properties of the top ten currencies in MongoDB
const fetchDataAndStoreTopTenPropertiesInMongoDB = async () => {
    try {
        const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
        const currencyData = response.data;

        // Convert the object into an array of currencies
        const currenciesArray = Object.values(currencyData);

        // Sort currencies based on volume in descending order
        const sortedCurrencies = currenciesArray.sort((a, b) => b.volume - a.volume);

        // Store only specific properties of the top ten currencies in MongoDB
        const topTenCurrencies = sortedCurrencies.slice(0, 10).map(currency => ({
            name: currency.name,
            last: parseFloat(currency.last),
            buy: parseFloat(currency.buy),
            sell: parseFloat(currency.sell),
            volume: parseFloat(currency.volume),
            base_unit: currency.base_unit,
        }));

        await CryptoData.insertMany(topTenCurrencies);

        console.log('Top ten currencies properties stored successfully in MongoDB!');
    } catch (error) {
        console.error('Error fetching or storing data:', error.message);
    }
};

// Call the function to fetch data and store only specific properties of the top ten currencies in MongoDB
fetchDataAndStoreTopTenPropertiesInMongoDB();

// Serve the HTML file when /get-stored-data route is accessed
app.get('/get-stored-data', async (req, res) => {
    try {
        // Retrieve stored data from MongoDB
        const storedCryptoData = await CryptoData.find({}).limit(10);
        console.log('Stored Crypto Data:', storedCryptoData); // Log the retrieved data
        res.json(storedCryptoData);
    } catch (error) {
        console.error('Error fetching stored data:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Enable CORS
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set up a default route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
