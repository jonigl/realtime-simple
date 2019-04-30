module.exports = (io) => {
  var Presence = require('./lib/presence');

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
          numUsers: users.length,
          processPid: process.pid,
          serverName: process.env.GAE_INSTANCE
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
};