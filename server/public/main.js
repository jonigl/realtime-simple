$(function() {

  var $serverName = $('#serverName'); // server area
  var $processPid = $('#processPid'); // process pid area
  var $status = $('#status'); // status area
  var $counter = $('#counter'); // counter area
  var socket = io({
    transports: ['websocket']
  });

  socket.on('connect', function(){
    socket.emit('add user', {});
  });

  function addParticipantsMessage (data) {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    if (data.serverName) {
      $serverName.html("Server name: " + data.serverName);
    }
    if (data.processPid) {
      $processPid.html("GAE instance: " + data.processPid);
    }
    $counter.html(message)
  }

  // Socket events
  // Whenever the server emits  'user added'
  socket.on('user added', function (data) {    
    $status.html('Status: user added');
    addParticipantsMessage(data);
  });

  // Whenever the server emits  'user added'
  socket.on('user joined', function (data) {    
    $status.html('Status: a user joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left'
  socket.on('user left', function (data) {
    $status.html('Status: a user left');
    addParticipantsMessage(data);    
  });

  socket.on('disconnect', function () {
    $status.html('Status: you have been disconnected');
  });

  socket.on('reconnect', function () {
    $status.html('Status: you have been reconnected');
  });

  socket.on('reconnect_error', function () {
    $status.html('Status: attempt to reconnect has failed');
  });

});
