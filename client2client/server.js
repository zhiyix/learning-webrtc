
var express = require("express"); //引入express
var { createServer } = require("http");
var { Server } = require("socket.io"); //引入socket.io

var app = new express();
var server = createServer(app);
var io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
}); //将socket.io注入express模块

// 客户端 1 的访问地址
app.get("/client1", function (req, res, next) {
    res.sendFile(__dirname + "/views/client1.html");
});

// 客户端 2 的访问地址
app.get("/client2", function (req, res, next) {
    res.sendFile(__dirname + "/views/client2.html");
});

server.listen(3030); //express 监听 8080 端口，因为本机80端口已被暂用

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
