const express = require('express');
const mysql = require('mysql2');
const apiRoutes = require('./routes/apiRoutes');

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/api',apiRoutes);

// KEEP AT BOTTOM OF SERVER.JS
app.use((req, res) => {
    res.status(404).end();
  });
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });