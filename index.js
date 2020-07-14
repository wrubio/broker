const mosca = require('mosca');
const port = process.env.PORT || 3800;
const brokerServer = new mosca.Server({
  http: {
    port: port,
    bundle: true,
    static: './',
  }
});

// ================================================================
// Get broker connection status
brokerServer.on('ready', () => {
  console.log('Broker server is ready and is running on port: ', port);
});

// ================================================================
// Get publisher message
brokerServer.on('published', (packet) => {
  // console.log(packet.topic);
});

brokerServer.on('clientConnected', function(client) {
  // console.log('client connected', client.id);
});