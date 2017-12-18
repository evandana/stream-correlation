// !/usr/bin/env node
// from https://www.npmjs.com/package/websocket

var WebSocketClient = require('websocket').client;
 
var client = new WebSocketClient();
 
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
    console.log('WebSocket Client Connected');
    connection.on('error', function(error) {
        console.log("Connection Error: " + error.toString());
    });
    connection.on('close', function() {
        console.log('echo-protocol Connection Closed');
    });
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log("Received: '" + message.utf8Data + "'");
        }c
    });

    sendSubscriptionRequests();

    function sendSubscriptionRequests () {
        if (connection.connected) {
            let series = ['a', 'b', 'c'];
            connection.sendUTF(JSON.stringify({action: 'subscribe', data: series}));
        }
    }
    
    // function sendNumber() {
    //     if (connection.connected) {
    //         var number = Math.round(Math.random() * 0xFFFFFF);
    //         connection.sendUTF(number.toString());
    //         setTimeout(sendNumber, 1000);
    //     }
    // }
    // sendNumber();
});
 
client.connect('ws://localhost:8080/', 'echo-protocol');