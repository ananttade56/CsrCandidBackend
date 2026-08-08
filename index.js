const express = require('express');
const cors = require('cors');

const app = express();

const clientUrls = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map(url => url.trim())
    : [];

const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://csrcandid.in/',
    ...clientUrls
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            // callback(null, false) prevents Express from throwing a 500 Internal Server Error
            callback(null, false);
        }
    },
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
