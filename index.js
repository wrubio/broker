const mosca = require('mosca');
const brokerPort = { port: 1883, };
const brokerServer = new mosca.Server(brokerPort);

// ================================================================
// Start Publisher 
require('./app/publisher/pub');


// ================================================================
// Get broker connection status
brokerServer.on('ready', () => {
  console.log('Broker server is ready and is running on port: ', brokerPort.port );
});

// ================================================================
// Get publisher message
brokerServer.on('published', (packet) => {
  console.log(packet.payload.toString());
});