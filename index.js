// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var redis = require('socket.io-redis');
io.adapter(redis({ host: process.env.REDIS_ENDPOINT, port: process.env.REDIS_PORT }));
var Presence = require('./lib/presence');

// Lower the heartbeat timeout
io.set('heartbeat timeout', 8000);
io.set('heartbeat interval', 4000);

var port = process.env.PORT || 3000;

server.listen(port, function() {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket) {
  var addedUser = false;

  socket.conn.on('heartbeat', function() {
    if (!addedUser) {
      // Don't start upserting until the user has added themselves.
      return;
    }
    Presence.upsert(socket.id, {});
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function() {
    if (addedUser) {
      return;
    }
    addedUser = true;

    // {} because no metadata is needed
    Presence.upsert(socket.id, {}); 

    Presence.list(function(users) {
      socket.emit('user added', {
        numUsers: users.length
      });
      // echo globally (all clients) that a person has connected
      socket.broadcast.emit('user joined', {
        numUsers: users.length
      });
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function() {
    if (addedUser) {
      Presence.remove(socket.id);

      Presence.list(function(users) {
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user left', {        
          numUsers: users.length
        });
      });
    }
  });

});
