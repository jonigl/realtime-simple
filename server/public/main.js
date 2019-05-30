$(function() {

  var redisCounter = [];
  var chart = null;
  var interval = null;
  var $serverName = $('#serverName'); // server area
  var $processPid = $('#processPid'); // process pid area
  var $status = $('#status'); // status area
  var $redisCounter = $('#redisCounter'); // redis counter area
  
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
    if (intervalMs > 100) {
      getAnalytics(intervalMs);
    }
  });

  $("#resetDataBtn").click(function(){
    redisCounter = [];
    updateChart(redisCounter);
  });

  function getAnalytics(intervalMs){
    if (interval) {
      clearInterval(interval);
    }
    socket.emit('getAnalytics', {});
    interval = setInterval(function() {
      socket.emit('getAnalytics', {});
    }, intervalMs);
  };

  function refreshData (data) {
    $serverName.html("Server name: " + data.serverName);
    $processPid.html("Process id: " + data.processPid);
    $redisCounter.html('Redis counter: ' + data.redisCounter)
    redisCounter.push(data.redisCounter);
    // max history of 50 items
    if (redisCounter.length > 50) {
      redisCounter.shift();
    }
    updateChart(redisCounter);
  };

  // Socket events
  // Whenever the server emits  'user added'
  socket.on('showAnalytics', function (data) {    
    $status.html('Status: showAnalytics');
    refreshData(data);
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

  function updateChart(redisCounter){
    chart.series[0].setData(redisCounter);
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
          data: [],
          type: 'spline'
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
  };

});
