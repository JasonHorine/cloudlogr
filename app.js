var express = require('express');
var app = express();
app.use(express.static('public'));
var port = process.env.PORT || 3000;

// app.listen(port);
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
var mongoose = require('mongoose');
mongoose.connect(process.env.DB_CONN_CLOUDLOGR); // database on mlab via environment variable

// EWON_DEV_ID  ...eWON environment variables
// EWON_ACCOUNT
// EWON_USER_ID
// EWON_USER_PASSWORD


var tankRouter = require("./routes/tankdata"); // tankRouter uses ./routes/tankdata.js file
app.use('/tank', tankRouter);  // anything to /tank use tankRouter

var apiRouterv1 = require("./routes/api/v1"); // apiRouterv1 uses ./routes/api/v1.js file
app.use('/api/v1', apiRouterv1);  // anything to /api/v1 use apiRouterv1

var apiRouterv2 = require("./routes/api/v2"); // apiRouterv2 uses ./routes/api/v2.js file
app.use('/api/v2', apiRouterv2);  // anything to /api/v2 use apiRouterv2


console.log('Server started on ' + port);

app.set('views', './views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
 response.render('index');
});

//middleware
app.use(function(request, response, next) {
 console.log('Time:', Date.now());
 next();
});



// Create HTTP server.

var http = require('http');
var server = http.createServer(app);

// Listen on provided port, on all network interfaces.
server.listen(port);

// for socket io:
var io = require('socket.io')(server);
// var http = require('http').Server(app);
// var io = require('socket.io')(http);

// socket io
  io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('disconnect', function(){
      console.log('user disconnected');
    });
  });

  // socket io
  // http.listen(3000, function(){
  //   console.log('listening on *:3000');
  // });



