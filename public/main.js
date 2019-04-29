$(function() {

  var $status = $('#status'); // status area
  var $counter = $('#counter'); // status area
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
    $counter.html(message)
  }

  // Socket events
  // Whenever the server emits  'user added'
  socket.on('user added', function (data) {    
    $status.html('user added');
    addParticipantsMessage(data);
  });

  // Whenever the server emits  'user added'
  socket.on('user joined', function (data) {    
    $status.html('user joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left'
  socket.on('user left', function (data) {
    $status.html('user left');
    addParticipantsMessage(data);    
  });

  socket.on('disconnect', function () {
    $status.html('you have been disconnected');
  });

  socket.on('reconnect', function () {
    $status.html('you have been reconnected');
  });

  socket.on('reconnect_error', function () {
    $status.html('attempt to reconnect has failed');
  });

});
