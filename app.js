const express = require('express');
// const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const logger = require('morgan');
const app = express();
// const session = require('express-session');
// let MongoStore = require('connect-mongo')(session)
require('dotenv').config()
require('./lib/passport');
const log = console.log
const PORT = process.env.PORT || 8080
const http = require("http");
const socketIo = require("socket.io");
const History = require('./models/History')

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const stockRouter = require('./routes/stocks')
const portfolioRouter = require('./routes/porfolio')






mongoose
.connect('mongodb+srv://Dave:ssaiyanz3335@cluster0.zwk9t.mongodb.net/RagsToRiches?retryWrites=true&w=majority' , {
    useNewUrlParser : true,
    useUnifiedTopology: true,
    useCreateIndex: true,
})
.then(() => {console.log('mongodb connected')})
.catch(()=> {console.log('server err')});

// app.use(session({
//   resave:true,
//   saveUninitialized:true,
//   secret: process.env.SESSION_SECRET,
//   store: new MongoStore({
//     url:process.env.MONGODB_URI,
//     autoReconnect:true
//   }),
//   cookie: {maxAge: 24 * 60 * 60 *1000}
// }));


// app.use(passport.initialize());
// app.use(passport.session());


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());


app.use('/', indexRouter);

app.use('/users', usersRouter);
app.use('/stock' , stockRouter)
app.use('/portfolio' , portfolioRouter)





// const server = http.createServer(app);

// const io = socketIo(server);

// io.on("connection", (socket) => {
//   let history
//   console.log("New client connected");
//   setInterval(async () =>{
//   let newHistory = await History.find()
//     if (history){
//       if(newHistory.length > history.length){
//         history = newHistory
//           return getApiAndEmit(socket)
//       }
//       return
//     }
//     if(!history){
//       history = newHistory
//       getApiAndEmit(socket)
//     }
//   //   console.log(!history)
//   // getApiAndEmit(socket)

//   }
//   , 1000);
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });



// const getApiAndEmit = socket => {
//   History.find().then((data) => {
//     socket.emit("data", data);
//   })
//   const response = new Date();
//   // Emitting a new message. Will be consumed by the client
//   // socket.emit("FromAPI", response);
// };
// const port =  4001;

// server.listen(port, () => console.log(`Listening on port ${port}`))




app.listen(PORT , () => {
  log(`listening to ${PORT}`)
})

module.exports = app;
