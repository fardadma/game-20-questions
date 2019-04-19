const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

app.use('/style', express.static(__dirname + '/style'))
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'))

var keeperQ = []
var questionerQ = []
var maxQuestions = 20

io.on('connection', (socket) => {
    console.log("A Connection Established ... " );
    socket.on('joinKeeper', (registerData) => {
        console.log("Registering a Keeper ... " );
        socket.playerName = registerData.name;
        socket.answer = registerData.answer.toLowerCase();
        socket.type = "K";
        socket.qCount = 0;
        if (questionerQ.length > 0) {
            opponentSocket = questionerQ.shift();
            socket.opSocket = opponentSocket;
            opponentSocket.opSocket = socket;
            socket.emit('startGame', opponentSocket.playerName)
            opponentSocket.emit('startGame', socket.playerName)
        }
        else {
            keeperQ.push(socket);
        }
    })
    socket.on('joinQuestioner', (registerData) => {
        console.log("Registering a Questioner ... " );
        socket.playerName = registerData;
        socket.type = "Q";
        if (keeperQ.length > 0) {
            opponentSocket = keeperQ.shift();
            socket.opSocket = opponentSocket;
            opponentSocket.opSocket = socket;
            socket.emit('startGame', opponentSocket.playerName)
            opponentSocket.emit('startGame', socket.playerName)
        }
        else {
            questionerQ.push(socket);
        }
    })

    socket.on('question', (ques) => {
        console.log("Get New Question ");
        var text = ques.text;
        if (text.toLowerCase() != socket.opSocket.answer)
            socket.opSocket.emit("question", ques);
        else {
            socket.emit("success", ques);
            socket.opSocket.emit("success", ques);
        }
    })

    socket.on('answer', (ques) => {
        console.log("Get New Answer ");
        socket.qCount ++;
        if (socket.qCount == maxQuestions) {
            socket.emit("faild", ques);
            ques.text = socket.answer;
            socket.opSocket.emit("faild", ques);
        }
        else
            socket.opSocket.emit("answer", ques);

    })


})

http.listen(8080, () => console.log("Start Listening on port 8080 ..."))

