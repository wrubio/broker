const mqtt = require('mqtt');
var fs = require('fs');
const cronJob = require('cron').CronJob;
const {BigQuery} = require('@google-cloud/bigquery');

const bigquery = new BigQuery();
const client = mqtt.connect('mqtt://localhost:1883');
const topicA = 'ZonaA';
const topicB = 'Image';
const topicC = 'Video';

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

  // Wait for the query to finish
  const [rows] = await job.getQueryResults();

  // Print the results
  medellin = rows.filter(row => row.city === 'Medellin' && row.pollutant === 'pm25');
  medellin = medellin.map((zone, i) => {
    zone[`id`] = i + 1;
    zone[`device`] =  `ZN_A_Sensor_${i + 1}`;

    return zone;
  });
}

// ================================================================
// Publishes the values of each device
function publicTemperatureValues() {
  medellin.forEach(item => {
    client.publish(topicA, JSON.stringify(item));
  });
}

// ================================================================
// Cron job that obtains the temperature of the selected city every 2 min
const getCityWeatheJob = new cronJob('*/40 * * * * *', () => {
  // query();
  publicTemperatureValues();
  genPayload();
  genVideo();
});

// ================================================================
// Cron job that obtains the temperature of the selected city every 2 min
function genPayload() {
  const data = fs.readFileSync('kittens-small.jpeg');
  const base64data = data.toString('base64');

  const message = {
    type: 'image',
    format: 'jpeg',
    data: base64data
  };

  client.publish(topicB, JSON.stringify(message));
}

function genVideo() {
  const data = fs.readFileSync('video.mp4');
  const base64data = data.toString('base64');

  const message = {
    type: 'video',
    format: 'mp4',
    data: base64data
  };

  client.publish(topicC, JSON.stringify(message));
}
// ================================================================
// starts jobs temperatures
genPayload();
genVideo();
query();
getCityWeatheJob.start();