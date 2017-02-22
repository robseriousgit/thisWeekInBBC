'use strict';

const express = require('express');
const router = express.Router();
const thisWeek = require('../src/thisWeek');

router.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === "OPTIONS") {
    // Return immediately for all OPTIONS requests
    res.send();
  } else {
    next();
  }
})

router.get('/thisWeek', (req, res, next) => {


  thisWeek.getThisweek()
  //search.fetchResults(req.params.searchTerm)
  .then(responseJson => {
    res.send(responseJson);
  })
});

module.exports = router;
