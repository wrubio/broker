const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');
const topic = 'temperatureSensors';
const SerialPort = require('serialport');
const port = new SerialPort('/dev/cu.usbmodem14401', {
  baudRate: 9600,
});

let newValues = '';

// ================================================================
// Get Serial port conection status
port.on('open', () => {
  console.log('conection is open');
});

// ================================================================
// Create object message to send it
port.on('data', (data) => {
  const algo = data.toString();
  newValues += algo;
  if (algo.includes('}')) {
    const message = JSON.parse(newValues);
    client.publish(topic, JSON.stringify(message));
    newValues = '';
  }
});

// ================================================================
// Get errors on sending message
port.on('error', (err) => {
  console.log(err);
});