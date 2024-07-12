const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
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

// Middleware setup
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simple route for API welcome message
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to my API!' });
});

// Route to get all brand names
app.get('/brandnames', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT brandname, MIN(course_id) AS course_id, brand_image
            FROM public.courseassigned
            GROUP BY brandname, brand_image;
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to get all course names
app.get('/coursename', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM public.courseassigned');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route to search for courses with filters
app.get('/search', async (req, res) => {
    const { brandname, course_id, start_date, region } = req.query;

    try {
        const result = await pool.query(
            `SELECT *
             FROM public.courseassigned
             WHERE brandname = $1
             AND course_id = $2
             AND TO_DATE(start_date, 'DD-MM-YYYY') BETWEEN TO_DATE($3, 'YYYY-MM-DD') - INTERVAL '9 days' AND TO_DATE($3, 'YYYY-MM-DD') + INTERVAL '9 days'
             AND region = $4`,
            [brandname, course_id, start_date, region]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No data found for the requested criteria.' });
        } else {
            res.status(200).json(result.rows);
        }
    } catch (error) {
        console.error('Error querying the database:', error);
        res.status(500).json({ error: 'An error occurred while querying the database.' });
    }
});

// Route to get courses by brand name
app.get('/coursename/:brandname', async (req, res) => {
    const { brandname } = req.params;

    try {
        const result = await pool.query(
            'SELECT id, course_id, coursename FROM public.courseassigned WHERE brandname = $1',
            [brandname]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error querying the database:', error);
        res.status(500).json({ error: 'An error occurred while querying the database.' });
    }
});

// Route to get a single item by ID
app.get('/items/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const result = await pool.query('SELECT * FROM public.coursescanner WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'Item not found' });
        } else {
            res.status(200).json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Route for searching courses with pagination and filtering
app.get('/searchbyregion', async (req, res) => {
    const { brandname, course_id, start_date, region, page = 1, limit = 4 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM public.courseassigned WHERE 1=1';
    const params = [];

    if (brandname) {
        params.push(brandname);
        query += ` AND brandname = $${params.length}`;
    }

    if (course_id) {
        params.push(course_id);
        query += ` AND course_id = $${params.length}`;
    }

    if (start_date) {
        params.push(start_date);
        query += ` AND TO_DATE(start_date, 'DD-MM-YYYY') BETWEEN TO_DATE($${params.length}, 'YYYY-MM-DD') - INTERVAL '9 days' AND TO_DATE($${params.length}, 'YYYY-MM-DD') + INTERVAL '9 days'`;
    }

    if (region) {
        params.push(region);
        query += ` AND region = $${params.length}`;
    }

    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    try {
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            res.status(404).json({ message: 'No data found for the requested criteria.' });
        } else {
            res.status(200).json(result.rows);
        }
    } catch (error) {
        console.error('Error querying the database:', error);
        res.status(500).json({ error: 'An error occurred while querying the database.' });
    }
});




app.get('/topcourses', async (req, res) => {
    const currentDate = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format

    try {
        const result = await pool.query(`
            SELECT *
            FROM public.courseassigned
            WHERE TO_DATE(start_date, 'DD-MM-YYYY') >= TO_DATE($1, 'YYYY-MM-DD')
            ORDER BY TO_DATE(start_date, 'DD-MM-YYYY') ASC
            LIMIT 6;
        `, [currentDate]);
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
