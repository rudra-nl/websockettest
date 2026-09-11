// server.js
const http = require('http');
const crypto = require('crypto');
const StompServer = require('stomp-broker-js');

// Store the last 50 events for the REST API
const recentEvents = [];

const server = http.createServer((req, res) => {
  // Add a simple REST endpoint just in case you need to fetch historical data
  if (req.url === '/api/detections' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.writeHead(200);
    res.end(JSON.stringify(recentEvents));
    return;
  }
  
  // Basic health check for Render
  res.writeHead(200);
  res.end('ANPR WebSocket & REST API is running.');
});

const stompServer = new StompServer({ server, path: '/ws' });
server.listen(process.env.PORT || 8080);

// Mock data generators
const vehicleClasses = ["CAR", "TRUCK", "BIKE", "BUS", "OTHER"];
const directions = ["NORTH", "SOUTH", "EAST", "WEST"];
const plates = ["ABC-1234", "XYZ-9876", "LMN-4567", "QWE-1122", "RTY-9988", "UNKNOWN"];
let idCounter = 1;

// Generate and send a detailed ANPR event every 3 seconds
setInterval(() => {
  const now = new Date();
  // Simulate the vehicle being tracked for a few seconds before detection
  const firstSeen = new Date(now.getTime() - Math.random() * 4000); 
  
  const anprEvent = {
    id: idCounter++,
    eventId: crypto.randomUUID(),
    localTrackId: Math.floor(Math.random() * 10000),
    plateNumber: plates[Math.floor(Math.random() * plates.length)],
    vehicleType: vehicleClasses[Math.floor(Math.random() * vehicleClasses.length)], 
    cameraId: "CAM01",
    detectedAt: now.toISOString(),
    firstSeen: firstSeen.toISOString(),
    lastSeen: now.toISOString(),
    speedKmh: parseFloat((30 + Math.random() * 80).toFixed(1)), // 30.0 to 110.0
    direction: directions[Math.floor(Math.random() * directions.length)],
    vehicleConfidence: parseFloat((0.70 + Math.random() * 0.29).toFixed(2)), // 0.70 to 0.99
    plateConfidence: parseFloat((0.50 + Math.random() * 0.49).toFixed(2))    // 0.50 to 0.99
  };

  // Keep the array size manageable for the REST endpoint
  recentEvents.unshift(anprEvent);
  if (recentEvents.length > 50) recentEvents.pop();

  // Broadcast to all connected WebSocket clients
  stompServer.send('/topic/detections', {}, JSON.stringify(anprEvent));
  
  console.log(`Sent ANPR Event: ${anprEvent.eventId} (${anprEvent.plateNumber})`);
}, 3000);