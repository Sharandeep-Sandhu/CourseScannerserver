const { Client } = require('pg');
const fs = require('fs');
const copyFrom = require('pg-copy-streams').from;

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'admin',
  port: 5432,
});

const loadCSV = async () => {
  const filePath = 'C:/Users/acer/Desktop/a.csv';

  try {
    await client.connect();

    // Drop the existing table if it exists
    await client.query(`DROP TABLE IF EXISTS public."CS";`);

    // Create the new table
    await client.query(`
      CREATE TABLE public."CS" (
        id INTEGER,
        name TEXT
      );
    `);

    // Stream the CSV data into the new table
    const stream = client.query(copyFrom(`
      COPY public."CS" (id, name)
      FROM STDIN WITH CSV DELIMITER ',' HEADER
    `));

    const fileStream = fs.createReadStream(filePath);

    fileStream.on('error', (error) => {
      console.error('Error reading the file:', error);
    });

    stream.on('error', (error) => {
      console.error('Error executing the query:', error);
    });

    stream.on('end', () => {
      console.log('Data loaded successfully');
      client.end();
    });

    fileStream.pipe(stream);
  } catch (error) {
    console.error('Error loading data:', error);
    client.end();
  }
};

loadCSV();
