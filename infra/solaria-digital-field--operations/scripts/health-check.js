#!/usr/bin/env node
const http = require('node:http');

const url = process.env.HEALTH_URL || 'http://localhost:3030/api/health';

http
  .get(url, res => {
    const { statusCode } = res;
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      if (statusCode === 200) {
        console.log(`OK ${statusCode}: ${data}`);
        process.exit(0);
      } else {
        console.error(`FAIL ${statusCode}: ${data}`);
        process.exit(1);
      }
    });
  })
  .on('error', err => {
    console.error('FAIL request error', err.message);
    process.exit(1);
  });
