$(function() {
  var redisCounter = [];
  var socketCount = [];
  var counter = [];
  var chart = null;
  var interval = null;
  var $serverName = $('#serverName'); // server area
  var $processPid = $('#processPid'); // process pid area
  var $status = $('#status'); // status area
  var $redisCounter = $('#redisCounter'); // redis counter area
  var $clientsCount = $('#socketCount'); // clients count by socket area
  var $counter = $('#counter'); // simple var counter area
  
  var socket = io({
    transports: ['websocket']
  });
  drawChart();

  socket.on('connect', function(){
    var intervalMs =  parseFloat($("#refreshIntervalInput").val()) * 1000;
    getAnalytics(intervalMs);
  });

  $("#refreshIntervalInput").keyup(function() {
    var intervalMs =  parseFloat($("#refreshIntervalInput").val()) * 1000;
    if (intervalMs > 300) {
      getAnalytics(intervalMs);
    }
  });

  function getAnalytics(intervalMs){
    if (interval) {
      clearInterval(interval);
    }
    socket.emit('getAnalytics', {});
    interval = setInterval(function() {
      socket.emit('getAnalytics', {});
    }, intervalMs);
  }

  function refreshData (data) {
    $serverName.html("Server name: " + data.serverName);
    $processPid.html("Process id: " + data.processPid);
    $redisCounter.html('Redis counter: ' + data.redisCounter)
    $clientsCount.html("Socket counter: " + data.socketCount);
    $counter.html('Simple var counter: ' + data.counter)
    redisCounter.push(data.redisCounter);
    socketCount.push(data.socketCount);
    counter.push(data.counter);
    // max history of 100 items
    if (redisCounter.length > 100) {
      redisCounter.shift();
      socketCount.shift();
      counter.shift();
    }
    updateChart(redisCounter, socketCount, counter);
  }

  // Socket events
  // Whenever the server emits  'user added'
  socket.on('showAnalytics', function (data) {    
    $status.html('Status: showAnalytics');
    refreshData(data);
  });

  // Whenever the server emits  'user added'
  // socket.on('user joined', function (data) {    
  //   $status.html('Status: a user joined');
  //   addParticipantsMessage(data);
  // });

  // Whenever the server emits 'user left'
  // socket.on('user left', function (data) {
  //   $status.html('Status: a user left');
  //   addParticipantsMessage(data);    
  // });

  socket.on('disconnect', function () {
    $status.html('Status: you have been disconnected');
  });

  socket.on('reconnect', function () {
    $status.html('Status: you have been reconnected');
  });

  socket.on('reconnect_error', function () {
    $status.html('Status: attempt to reconnect has failed');
  });

  function updateChart(redisCounter, socketCounter, counter){
    chart.series[0].setData(redisCounter);
    chart.series[1].setData(socketCounter);
    chart.series[2].setData(counter);
  };

  function drawChart() {
    chart = Highcharts.chart('graphContainer', {
      title: {
          text: 'Real-time websocket connections'
      },
      subtitle: {
          text: 'Differenth methods to count connections'
      },
      yAxis: {
          title: {
              text: 'Number of Conections'
          }
      },
      legend: {
          layout: 'vertical',
          align: 'right',
          verticalAlign: 'middle'
      },
      series: [
        {
          name: 'Redis counter',
          data: []
        },
        {
          name: 'Socket.io counter',
          data: []
        },
        {
          name: 'Simple var counter',
          data: []
        }
      ],
      plotOptions: {
        series: {
          label: {
            enabled: false
          }
        }
      },
      responsive: {
          rules: [{
              condition: {
                  maxWidth: 500
              },
              chartOptions: {
                  legend: {
                    align: 'center',
                    verticalAlign: 'bottom',
                    layout: 'vertical'
                  }
              }
          }]
      }
    });
  }

});
