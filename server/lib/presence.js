var redis = require('redis');
var bluebird = require('bluebird');

function Presence() {
  bluebird.promisifyAll(redis);
  this.client = redis.createClient({
    host: process.env.REDIS_ENDPOINT
  });
}
module.exports = new Presence();

/**
  * Remember a present user with their connection ID
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
Presence.prototype.upsert = function(connectionId, meta) {
  this.client.hset(
    'presence',
    connectionId,
    JSON.stringify({
      meta: meta,
      when: Date.now()
    }),
    function(err) {
      if (err) {
        console.error('Failed to store presence in redis: ' + err);
      }
    }
  );
};

/**
  * Remove a presence. Used when someone disconnects
  *
  * @param {string} connectionId - The ID of the connection
  * @param {object} meta - Any metadata about the connection
**/
Presence.prototype.remove = function(connectionId) {
  this.client.hdel(
    'presence',
    connectionId,
    function(err) {
      if (err) {
        console.error('Failed to remove presence in redis: ' + err);
      }
    }
  );
};

/**
  * Returns a list of present users, minus any expired
  *
  * @param {function} returnPresent - callback to return the present users
**/
Presence.prototype.list = function(returnPresent) {
  var active = [];
  var dead = [];
  var now = Date.now();
  var self = this;
  var presents = {};
  var sumSocketCount = 0;

  this.client.hgetallAsync('presence')
  .then(function(presence) {
    for (var connection in presence) {
      var details = JSON.parse(presence[connection]);
      details.connection = connection;

      if (now - details.when > 60000) {
        dead.push(details);
      } else {
        active.push(details);
      }
    }

    if (dead.length) {
      self._clean(dead);
    }
    presents.active = active;
    return self.client.hgetallAsync('socketCount');
    // return returnPresent(active);
  })
  .then(function(socketCount) {
    for (var instanceProcess in socketCount) {
      var details = JSON.parse(socketCount[instanceProcess]);
      sumSocketCount += details.clientsCount;
    }
    presents.sumSocketCount = sumSocketCount;
    return returnPresent(presents);
  })
  .catch(function(err){
    console.error('Failed to get presence from Redis: ' + err);
    presents.active = [];
    presents.sumSocketCount = 0;
    return returnPresent(presents);
  });
};

/**
  * Cleans a list of connections by removing expired ones
  *
  * @param
**/
Presence.prototype._clean = function(toDelete) {
  console.log(`Cleaning ${toDelete.length} expired presences`);
  for (var presence of toDelete) {
    this.remove(presence.connection);
  }
};

/**
  * Remember a present user with their connection ID
  *
  * @param {string} instanceName - The instance name
  * @param {string} processId - The process ID
  * @param {integer} clientsCount - The Socket ios count for this process on this instance
**/
Presence.prototype.upsertSocketioCount = function(instanceName, processId, clientsCount) {
  this.client.hsetAsync('socketCount', 
    instanceName+processId,
    JSON.stringify({
      clientsCount: clientsCount,
      when: Date.now()
    })
  ).
  then(function() {
    return;
  })
  .catch(function(err){
      console.error('Failed to store presence in redis: ' + err);
  });
};
