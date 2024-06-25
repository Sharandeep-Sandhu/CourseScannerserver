const express = require('express');
const cors = require('cors'); // Import the cors middleware
const bodyParser = require('body-parser');
const moment = require('moment');
const { Pool } = require('pg');
const app = express();
const port = 8080;


const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'admin',
    port: 5432,
});


// Use cors middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
// Define a simple route
app.get('', (req, res) => {
    const message = 'Welcome to my API!';
    res.json(message);
});
// Define a route to get all items
app.get('/brandnames', async (req, res) => {
    try {
        const result = await pool.query('SELECT brandname, MIN(course_id) AS course_id FROM public.courseassigned GROUP BY brandname;');
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/coursename', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.courseassigned');
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// GET /search endpoint
app.get('/search', async (req, res) => {
    const { brandname, course_id, region } = req.query;

    try {
        const result = await pool.query(
            `SELECT *
            FROM public.courseassigned
            WHERE brandname = $1
            AND course_id = $2
            AND region = $3`,
            [brandname, course_id, region]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No data found for the requested criteria.' });
        } else {
            res.json(result.rows);
        }
    } catch (error) {
        console.error('Error querying the database:', error);
        res.status(500).send('An error occurred while querying the database.');
    }
});






app.get('/coursename/:brandname', async (req, res) => {
    const { brandname } = req.params;

    try {
        const result = await pool.query(
            'SELECT id, course_id, coursename FROM courseassigned WHERE brandname = $1',
            [brandname]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error querying the database:', error);
        res.status(500).send('An error occurred while querying the database.');
    }
});

// Define a route to get a single item by ID
app.get('/items/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('SELECT * FROM coursescanner WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            res.status(404).send('Item not found');
        } else {
            res.status(200).json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
