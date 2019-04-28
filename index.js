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
    try {
        console.log("A Connection Established ... " );
        socket.on('joinKeeper', (registerData) => {
            try {
                console.log("Registering a Keeper ... " );
                socket.playerName = registerData.name;
                socket.answer = registerData.answer.toLowerCase();
                socket.type = "K";
                socket.qCount = 0;
                if (questionerQ.length > 0) {
                    while (questionerQ.length > 0) {
                        opponentSocket = questionerQ.shift();
                        if (opponentSocket.connected) {
                            break;
                        }
                    }
                    if (opponentSocket.connected) {
                        socket.opSocket = opponentSocket;
                        opponentSocket.opSocket = socket;
                        socket.emit('startGame', opponentSocket.playerName)
                        opponentSocket.emit('startGame', socket.playerName)
                    }
                    else {
                        keeperQ.push(socket);
                    }
                }
                else {
                    keeperQ.push(socket);
                }
            }
            catch (ex) {
                console.log("An Error Happend!");
            }        
        })
        
        socket.on('joinQuestioner', (registerData) => {
            try {
                console.log("Registering a Questioner ... " );
                socket.playerName = registerData;
                socket.type = "Q";
                if (keeperQ.length > 0) {
                    while (keeperQ.length > 0) {
                        opponentSocket = keeperQ.shift();
                        if (opponentSocket.connected) {
                            break;
                        }
                    }
                    if (opponentSocket.connected) {
                        socket.opSocket = opponentSocket;
                        opponentSocket.opSocket = socket;
                        socket.emit('startGame', opponentSocket.playerName)
                        opponentSocket.emit('startGame', socket.playerName)
                    }
                    else {
                        questionerQ.push(socket);
                    }
                }
                else {
                    questionerQ.push(socket);
                }
            }
            catch (ex) {
                console.log("An Error Happend!");
            }        
        })

        socket.on('question', (ques) => {
            try {
                console.log("Get New Question ");
                var text = ques.text;
                if (text.toLowerCase() != socket.opSocket.answer)
                    socket.opSocket.emit("question", ques);
                else {
                    socket.emit("success", ques);
                    socket.opSocket.emit("success", ques);
                }
            }
            catch (ex) {
                console.log("An Error Happend!");
            }        
        })

        socket.on('answer', (ques) => {
            try {
                console.log("Get New Answer ");
                socket.qCount ++;
                if (socket.qCount == maxQuestions) {
                    socket.emit("faild", ques);
                    ques.text = socket.answer;
                    socket.opSocket.emit("faild", ques);
                }
                else
                    socket.opSocket.emit("answer", ques);
            }
            catch (ex) {
                console.log("An Error Happend!");
            }        
        })
    }
    catch (ex) {
        console.log("An Error Happend!");
    }
})

http.listen(8080, () => console.log("Start Listening on port 8080 ..."))

