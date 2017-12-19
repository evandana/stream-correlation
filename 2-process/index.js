// !/usr/bin/env node
// from https://www.npmjs.com/package/websocket

var WebSocketServer = require('websocket').server;
var WebSocketClient = require('websocket').client;
var http = require('http');

var DataAnalysis = require('./data-analysis');
var dataAnalysis = new DataAnalysis();


// ***********************************
// SERVER/DB FACING
// ***********************************

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
            let series = ['a', 'b', 'c'];
            connection.sendUTF(JSON.stringify({action: 'subscribe', data: series}));
        }
    }
});
 
// connect to data source
client.connect('ws://localhost:8080/', 'echo-protocol');


// ***********************************
// CLIENT FACING
// ***********************************

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(200);
    response.end();
});
server.listen(8090, function() {
    console.log((new Date()) + ' Server is listening on port 8090');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: true
});

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }
    
    var connection = request.accept('echo-protocol', request.origin);
    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', function(message) {


        console.log("\n" + 'received from client' + "\n" + JSON.stringify(message) + "\n");

        const connectionId = Math.round(Math.random()*1000);

        if (message.type === 'utf8') {

            var details = JSON.parse(message.utf8Data);

            switch (details.action) {
                case 'subscribe':
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
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });

    function sendData (str) {
        // console.log('sending: ', "\t", str);
        connection.sendUTF(str);
    } 
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}