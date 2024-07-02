import express, { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

interface RequestWithClientIp extends Request {
  clientIp?: string | null;
}

interface IpData {
  origin: string;
}

interface GeoData {
  lat: number;
  lon: number;
  city: string;
  query: string;
  status: string;
  message?: string;
}

interface WeatherData {
  weather: {
    description: string;
    icon: string;
  }[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  name: string;
}

interface WeatherApiError {
    message: string;
  }
  
// Middleware to get client's IP address
app.use(async (req: RequestWithClientIp, res: Response, next: NextFunction) => {
  try {
    const ipResponse = await fetch('https://httpbin.org/ip');
    const ipData = await ipResponse.json() as IpData;
    req.clientIp = ipData.origin;
  } catch (error) {
    console.error('Failed to fetch public IP:', error);
    req.clientIp = null;
  }
  next();
});

// Function to get geolocation data
async function getGeolocation(ip: string): Promise<GeoData> {
  const response = await fetch(`http://ip-api.com/json/${ip}`);
  if (!response.ok) {
    throw new Error('Failed to fetch geolocation data');
  }
  const data = (await response.json()) as GeoData;
  return data;
}

// Function to get weather data
async function getWeather(lat: number, lon: number): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
  if (!response.ok) {
    const errorData = (await response.json()) as WeatherApiError;
    throw new Error(`Failed to fetch weather data: ${errorData.message}`);
  }
  const data = (await response.json()) as WeatherData;
  return data;
}

// API endpoint to get weather data based on client's IP address
app.get('/api/hello', async (req, res) => {
  const visitorName = req.query.visitor_name as string;
  const ip = (req as RequestWithClientIp).clientIp;

  if (!ip) {
    res.status(500).json({ error: 'Failed to determine public IP address' });
    return;
  }

  try {
    const geoData = await getGeolocation(ip);
    if (geoData.status !== 'success') {
      throw new Error(geoData.message || 'Failed to fetch geolocation data');
    }
    const weatherData = await getWeather(geoData.lat, geoData.lon);
    const temperature = weatherData.main.temp;
    const location = geoData.city;

    res.json({
      client_ip: ip,
      location: location,
      greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celsius in ${location}`
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
