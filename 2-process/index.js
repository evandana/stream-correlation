// !/usr/bin/env node
// from https://www.npmjs.com/package/websocket

// ***********************************
// SERVER/DB FACING
// ***********************************

var WebSocketClient = require('websocket').client;
var http = require('http');

var DataAnalysis = require('./data-analysis');
var dataAnalysis = new DataAnalysis();

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

        // console.log("\n" + 'received from data source' + "\n" + JSON.stringify(message) + "\n");

        if (message.type === 'utf8') {
            
            var details = JSON.parse(message.utf8Data);

            switch (details.action) {
                case 'update':
                    dataAnalysis.updateSeries(details);
                    break;
                case 'series':
                    dataAnalysis.replaceSeries(details);
                    break;
            } 
        }
    });

    sendSubscriptionRequests();

    function sendSubscriptionRequests () {
        if (connection.connected) {
            let series = ['a', 'b', 'c', 'd', 'e', 'f'];
            connection.sendUTF(JSON.stringify({action: 'subscribe', data: series}));
        }
    }
});
 
// connect to data source
client.connect('ws://localhost:8080/', 'echo-protocol');


// ***********************************
// CLIENT FACING
// ***********************************

const WebSocket = require('ws');
const wsServer = new WebSocket.Server({ port: 8090 });

wsServer.on('connection', function connection(connection) {
  
    var connected = true;

    connection.on('message', function(msg) {

        let message = JSON.parse(msg);

        console.log("\n" + 'received from client' + "\n" + JSON.stringify(message) + "\n");

        const connectionId = Math.round(Math.random()*1000);

        if (message.type === 'utf8') {

            var details = JSON.parse(message.utf8Data);

            switch (details.action) {
                case 'subscribe':
                    console.log('subscribing');
                    dataAnalysis.subscribe(details.data, connectionId, sendData);
                    break;
                case 'unsubscribe':
                    dataAnalysis.unsubscribe(details.data, connectionId);
                    break;
            } 
        }
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }
    });
    connection.on('open', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' opened.');
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
        connected = false;
    });
    connection.on('error', function (err) {
    if (err.code !== 'ECONNRESET') {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' forcibly disconnected.');
        connected = false;
        dataAnalysis.unsubscribe(details.data, connectionId);
        // Ignore ECONNRESET and re throw anything else
        // throw err
    }
})

    function sendData (obj) {
        // console.log('sending: ', "\t", str);
        if (connection && connected) {
            connection.send(JSON.stringify({type:'utf8', data: obj}));
        }
    } 
});