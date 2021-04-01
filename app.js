const express = require('express');
const path = require('path');
const app = express();

const WebSocketServer = require('ws').Server;
const server = require('http').createServer(app);
const wss = new WebSocketServer({ server });
const port = 8080;

// Serve js files
app.use('/js', express.static(path.join(__dirname, 'ui/js/')));
// Serve css files
app.use('/css', express.static(path.join(__dirname, 'ui/css/')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/ui/html/index.html'));
});

const greetings = ["hi", "hello"];
const nameQuestions = ["what's your name?", "what's your name", "what is your name?", "what is your name"];


function handleQuery(query, cb) {
    const str = query.toLowerCase().trim();
    if (greetings.indexOf(str) !== -1) {
      cb("Hi!");
      return;
    }
    if (nameQuestions.indexOf(str) !== -1) {
      cb("My name is Cheap Siri!");
      return;
    }
    if ("How old are you?" === str) {
      cb("That's a RUDE question.");
      return;
    }
    cb('Awesome');
}

/**
 * Client Counter
 * Count the number of active connections
 * @type {Number}
 */
let cc = 0;

wss.on('connection', function connection(ws) {
   console.log('client connections: ', ++cc);

  ws.on('message', function incoming(message) {
    try {
        const { payload, type } = JSON.parse(message);
        switch(type) {
            case 'query':
                handleQuery(payload, (response) => {
                    ws.send(JSON.stringify({type: 'queryResponse', payload: response}));
                });
                return;
            default:
                console.log(message);
        }

    } catch(e) {
      console.error('Error from message: ', e);
    }
  });

  // Send welcome message on each connection
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify({type: 'connected', payload: 'Welcome!'}));
  }

  ws.on('close', function close() {
    --cc;
    if (cc === 0) {
      clearInterval(pingInterval);
    }
    console.log('disconnected');
  });

  ws.on('error', function error() {
    --cc;
    console.log('error');
  });

});

const pingPayload = JSON.stringify({type: 'ping'});
// Keep the connection alive
let pingInterval = setInterval(() => {
  wss.broadcast(pingPayload);
}, 1 * 5000);

/**
 * Broadcast data to all connected clients
 * @param  {Object} data
 * @void
 */
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};


server.listen(port, () => console.log(`App listening on port ${port}!`))
