const express = require('express');
const mysql = require('mysql2');

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
    {
      host: 'localhost',
      // Your MySQL username,
      user: 'root',
      // Your MySQL password
      password: '',
      database: 'election'
    },
    console.log('Connected to the election database.')
  );
  


// KEEP AT BOTTOM OF SERVER.JS
app.use((req, res) => {
    res.status(404).end();
  });
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });