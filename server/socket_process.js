module.exports = (io) => {
  var Presence = require('./lib/presence');
  var os = require("os");

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
    });

    socket.on('getAnalytics', function() {
      socket.join('analytics');
      Presence.list(function(users) {
        io.to(socket.id).emit('showAnalytics', {
          processPid: process.pid,
          serverName: os.hostname(),
          redisCounter: users.length,
        });
      });

    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function() {
      if (addedUser) {
        socket.leave('analytics');
        Presence.remove(socket.id);
      }
    });

  });
};