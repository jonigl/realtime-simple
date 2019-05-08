// Google Cloud - Stackdriver Trace library for Node.js  
require('@google-cloud/trace-agent').start();
// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
var path = require('path');


const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
    // Lower the heartbeat timeout
    var port = process.env.PORT || 8080;
    
    server.listen(port, function() {
        console.log('Server listening at port %d', port);
    });
    // Routing
    app.use(express.static(path.join(__dirname, 'public')));
    io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: process.env.REDIS_PORT }));
    // io.set('heartbeat timeout', 8000);
    // io.set('heartbeat interval', 4000);
    require('./socket_process.js')(io);
    console.log(`Worker ${process.pid} started`);
}