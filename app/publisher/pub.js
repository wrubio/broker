const mqtt = require('mqtt');
const weather = require('weather-js');
const cronJob = require('cron').CronJob;
const {BigQuery} = require('@google-cloud/bigquery');

const bigquery = new BigQuery();
const client = mqtt.connect('mqtt://localhost:1883');
const topicA = 'ZonaA';
const topicB = 'ZonaB';
const topicC = 'ZonaC';

let temp;
let devices = 20;
let medellin = [];

async function query() {
  // Queries the U.S. given names dataset for the state of Texas.

  const query = `SELECT *
    FROM \`bigquery-public-data.openaq.global_air_quality\`
    WHERE country = 'CO'
    LIMIT 100`;

  // For all options, see https://cloud.google.com/bigquery/docs/reference/rest/v2/jobs/query
  const options = {
    query: query,
    // Location must match that of the dataset(s) referenced in the query.
    location: 'US',
  };

  // Run the query as a job
  const [job] = await bigquery.createQueryJob(options);
  console.log(`Job ${job.id} started.`);

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // Print the results
  medellin = rows.filter(row => row.city === 'Medellin' && row.pollutant === 'pm25');
  medellin = medellin.map((zone, i) => {
    zone['id'] = i + 1;
    zone['device'] =  `ZN_A_Sensor_${i + 1}`;

    return zone;
  });
}

query();
// ================================================================
// Get temperature of city selected
function getCityWeather() {
  weather.find({search: 'Bogota', degreeType: 'C'}, function(err, result) {
    if(err) console.log(err);
   
    const data = JSON.parse(JSON.stringify(result, null, 2));
    temp = +data[0].current.temperature;

    console.log('TEMPERATURA ACTUAL: ', temp);
  }, null, true, 'America/Bogota');
}

// ================================================================
// Create random values between +- the current temperature value obtained from the city
function getRandomTemperature() {
  const lowerTemp = temp - 1;
  const higherTemp = temp + 1;
  const randomTemp = (Math.random() * (higherTemp - lowerTemp) + lowerTemp).toFixed(2);

  return randomTemp;
}

// ================================================================
// Publishes the values of each device
function publicTemperatureValues(devices, i) {
  devices.forEach(device => {
    if (i === 0) {
      client.publish(topicB, JSON.stringify(device));
    } else {
      client.publish(topicC, JSON.stringify(device));
    }
  });

  medellin.forEach(item => {
    client.publish(topicA, JSON.stringify(item));
  });
}

// ================================================================
// Cron job that obtains the temperature of the selected city every 2 min
const getCityWeatheJob = new cronJob('0 */30 * * * *', () => {
  query();
  getCityWeather();
});

// ================================================================
// Cron job that creates random temperature values for each device
const setRandomTemperature = new cronJob('*/15 * * * * *' , () => {
  const  devicesTemp = [];

  for (let z = 0; z < 2; z++) {
    for (let i = 0; i < devices; i++) {
      devicesTemp[i] = {
        id: (i + 1),
        device: `ZN_${z === 0 ? 'B' : 'C'}_Sensor_${i + 1}`,
        metric: 'Temperature',
        unit: 'Celsius',
        value: getRandomTemperature(),
        zone: z === 0 ? 'Zone B' : 'Zone C'
      };
    }
    publicTemperatureValues(devicesTemp, z);
  }

});

// ================================================================
// starts jobs temperatures
query();
getCityWeather();
getCityWeatheJob.start();
setRandomTemperature.start();