const express = require('express');
const cors = require('cors'); // Import the cors middleware
const bodyParser = require('body-parser');
const pool = require('./db'); // Ensure you have your database configuration in the db.js file

const app = express();
const port = 8080;

// Use cors middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define a simple route
app.get('/', (req, res) => {
    res.json('Welcome to my API!');
});

// Define a route to get all items
app.get('/brandnames', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT brandname FROM public.coursescanner');
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/names/:brandname', async (req, res) => {
    const { brandname } = req.params;
    try {
        const result = await pool.query('SELECT name FROM public.coursescanner WHERE brandname = $1', [brandname]);
        res.status(200).send(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
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

// Define a route to create a new item
app.post('/items', async (req, res) => {
    const { name, description } = req.body;
    try {
        const result = await pool.query('INSERT INTO items (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Define a route to update an item by ID
app.put('/items/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    try {
        const result = await pool.query('UPDATE items SET name = $1, description = $2 WHERE id = $3 RETURNING *', [name, description, id]);
        if (result.rows.length === 0) {
            res.status(404).send('Item not found');
        } else {
            res.status(200).json(result.rows[0]);
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Define a route to delete an item by ID
app.delete('/items/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            res.status(404).send('Item not found');
        } else {
            res.status(200).send(`Item deleted with ID: ${id}`);
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
