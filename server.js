const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = 4000; // Choose any port other than your React app's port

app.use(express.static(path.join(__dirname, 'build'))); // Serve React app build files

app.get('/poll', async (req, res) => {
    try {
        const response = await axios.get('http://database.techtalk.com:8080/poll');
        res.json(response.data);
    } catch (error) {
        console.error('Error connecting to Go server:', error.message);
        res.status(500).send('Failed to connect to Go server');
    }
});

// Fallback route to serve React's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
