module.exports = (io) => {
  var Presence = require('./lib/presence');
  var os = require("os");
  var counter = 0;

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
      var serverName = os.hostname();
      var processPid = process.pid;
      var socketClientCount = socket.client.conn.server.clientsCount;
      Presence.upsertSocketioCount(serverName,processPid, socketClientCount);
      // {} because no metadata is needed
      Presence.upsert(socket.id, {}); 
      counter++;

      // Presence.list(function(users) {
      //   io.to('analytics').emit('showAnalytics', {
      //     numUsers: users.length          
      //   });
      //   // echo globally (all clients) that a person has connected
      //   // socket.broadcast.emit('user joined', {
      //   //   numUsers: users.length
      //   // });
      // });
    });

    socket.on('getAnalytics', function() {
      var serverName = os.hostname();
      var processPid = process.pid;
      var socketClientCount = socket.client.conn.server.clientsCount;
      socket.join('analytics');
      
      Presence.list(function(presents) {
        io.to(socket.id).emit('showAnalytics', {
          processPid: processPid,
          serverName: serverName,
          redisCounter: presents.active.length,
          socketCount: presents.sumSocketCount,
          counter: counter
        });
        // echo globally (all clients) that a person has connected
        // socket.broadcast.emit('user joined', {
        //   numUsers: users.length
        // });
      });

    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
      if (addedUser) {
        socket.leave('analytics');
        Presence.remove(socket.id);
        counter--;
        // Presence.list(function(users) {
        //   // echo globally (all clients) that a person has connected
        //   io.to('analytics').emit('showAnalytics', {    
        //     numUsers: users.length
        //   });
        // });
      }
    });

  });
};