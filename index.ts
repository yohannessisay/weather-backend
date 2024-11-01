import express, { Request, Response } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.WEATHER_API_KEY;
const BASE_URL = process.env.WEATHER_API_BASE_URL;

const allowedIPs = ["192.250.229.83"];

const checkIP = (req: Request, res: Response, next: Function) => {
  const requestIP = req.ip || req.socket.remoteAddress;
  if (!allowedIPs.includes(requestIP ? requestIP : "")) {
    return res.status(403).json({ error: "Access denied" });
  }

  next();
};

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
);
app.use(checkIP);
app.use(bodyParser.json());

app.post("/api/weather", (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude are required" });
  }

  const path = `current.json?key=${API_KEY}&q=${latitude},${longitude}`;

  const request = http.request(BASE_URL + path, (response) => {
    let data = "";

    response.on("data", (chunk) => {
      data += chunk;
    });

    response.on("end", () => {
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (error) {
        console.error("Error parsing response:", error);
        res.status(500).json({ error: "Failed to parse weather data" });
      }
    });
  });

  request.on("error", (error) => {
    console.error("Request error:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  });

  request.end();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
