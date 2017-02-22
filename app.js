'use strict';

const express = require('express');
const routes = require('./routes/index');

const path = require('path');

const app = express();
const port = 5000;

app.listen(process.env.PORT || port, '0.0.0.0', () => {
  console.log(`Running App on port: ${port}`);
});

// setup web server for API

app.use(express.static('public'));

app.use('/media/',  express.static(path.join(__dirname, 'tmp')))

app.use('/', routes);
