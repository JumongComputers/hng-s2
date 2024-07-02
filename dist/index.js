var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware to get client's IP address
app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ipResponse = yield fetch('https://httpbin.org/ip');
        const ipData = yield ipResponse.json();
        req.clientIp = ipData.origin;
    }
    catch (error) {
        console.error('Failed to fetch public IP:', error);
        req.clientIp = null;
    }
    next();
}));
// Function to get geolocation data
function getGeolocation(ip) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`http://ip-api.com/json/${ip}`);
        if (!response.ok) {
            throw new Error('Failed to fetch geolocation data');
        }
        const data = (yield response.json());
        return data;
    });
}
// Function to get weather data
function getWeather(lat, lon) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.OPENWEATHERMAP_API_KEY;
        const response = yield fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        if (!response.ok) {
            const errorData = (yield response.json());
            throw new Error(`Failed to fetch weather data: ${errorData.message}`);
        }
        const data = (yield response.json());
        return data;
    });
}
// API endpoint to get weather data based on client's IP address
app.get('/api/hello', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const visitorName = req.query.visitor_name;
    const ip = req.clientIp;
    if (!ip) {
        res.status(500).json({ error: 'Failed to determine public IP address' });
        return;
    }
    try {
        const geoData = yield getGeolocation(ip);
        if (geoData.status !== 'success') {
            throw new Error(geoData.message || 'Failed to fetch geolocation data');
        }
        const weatherData = yield getWeather(geoData.lat, geoData.lon);
        const temperature = weatherData.main.temp;
        const location = geoData.city;
        res.json({
            client_ip: ip,
            location: location,
            greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celsius in ${location}`
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
