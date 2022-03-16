'use strict'

var http = require('http');
var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');

//socket.io
var {Server} = require('socket.io');

var app = new express();
app.use(serveIndex('./public'));
app.use(express.static('./public'));

var options = {
	key : fs.readFileSync(__dirname + '/cert/1557605_www.learningrtc.cn.key'),
	cert: fs.readFileSync(__dirname + '/cert/1557605_www.learningrtc.cn.pem')
}

//http server
var http_server = http.createServer(app);
//https server
var https_server = https.createServer(options, app);

// 客户端 1 的访问地址
app.get("/client1", function (req, res, next) {
    res.sendFile(__dirname + "/views/client1.html");
});

// 客户端 2 的访问地址
app.get("/client2", function (req, res, next) {
    res.sendFile(__dirname + "/views/client2.html");
});

var io = new Server(http_server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
}); //将socket.io注入express模块

// 每个客户端socket连接时都会触发 connection 事件
io.on("connection", function (socket) {
    // socket.io 使用 emit(eventname,data) 发送消息，使用on(eventname,callback)监听消息
    // 监听客户端发送的 sendMsg 事件
    socket.on("message", (data) => {
        // data 为客户端发送的消息，可以是 字符串，json对象或buffer
        // 使用 emit 发送消息，broadcast 表示 除自己以外的所有已连接的socket客户端。
		console.log('receive message: ', data)
		if (data === null || data === undefined) {
			console.error('message invalid!')
			return
		}
		
        socket.broadcast.emit("message", data);
    })
    socket.on('random', value => {
        console.log(value);
        if (value > 0.95) {
            if (typeof socket.warnign === 'undefined') {
                socket.warning = 0;// socket对象可用来存储状态和自定义数据
            }
            setTimeout(() => {
                socket.emit('warn', ++socket.warning);
            }, 1000);
        }
    });
});







var ios = new Server(https_server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
}); //将socket.io注入express模块

// 每个客户端socket连接时都会触发 connection 事件
ios.on("connection", function (socket) {
    // socket.io 使用 emit(eventname,data) 发送消息，使用on(eventname,callback)监听消息
    // 监听客户端发送的 sendMsg 事件
    socket.on("message", (data) => {
        // data 为客户端发送的消息，可以是 字符串，json对象或buffer
        // 使用 emit 发送消息，broadcast 表示 除自己以外的所有已连接的socket客户端。
		console.log('receive message: ', data)
		if (data === null || data === undefined) {
			console.error('message invalid!')
			return
		}
		
        socket.broadcast.emit("message", data);
    })
    socket.on('random', value => {
        console.log(value);
        if (value > 0.95) {
            if (typeof socket.warnign === 'undefined') {
                socket.warning = 0;// socket对象可用来存储状态和自定义数据
            }
            setTimeout(() => {
                socket.emit('warn', ++socket.warning);
            }, 1000);
        }
    });
});

http_server.listen(80, '0.0.0.0');

https_server.listen(443, '0.0.0.0');

