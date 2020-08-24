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
const PORT2 = process.env.PORT2 || 4000
const http = require("http");
const socketIo = require("socket.io");
const History = require('./models/History')
const Stocks = require('./models/Stocks')
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const stockRouter = require('./routes/stocks')
const portfolioRouter = require('./routes/porfolio')






mongoose
.connect(process.env.MONGODB_URI , {
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





const server = http.createServer(app);
const io = socketIo(server);

// let history

// const sendHistory = (req,res,next) => {
//   io.on("connection", async (socket) => {
//     console.log("New client connected");
//     let newHistory = await History.find()
//         if(newHistory.length > history.length){
//           history = newHistory
//           socket.emit("data", history)
//         }
//   });
//   next()
// }

// app.use(sendHistory)

// io.on("connection", async (socket) => {
//   console.log("New client connected");
//     if (history){
//       let newHistory = await History.find()
//       if(newHistory.length > history.length){
//         history = newHistory
//           return socket.emit("data", history)
//       }
//       return
//     }
//     if(!history){
//       let newHistory = await History.find()
//       history = newHistory
//       socket.emit("data", newHistory)
//     }
//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//   });
// });


io.on("connection", (socket) => {
  let history
  console.log("New client connected");
  setInterval(async () =>{
  let newHistory = await History.find()
    if (history){
      if(newHistory.length > history.length){
        history = newHistory
          return socket.emit("data", history)
      }
      return
    }
    if(!history){
      history = newHistory
      socket.emit("data", history)
    }

  }
  , 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});




server.listen(PORT2, () => console.log(`Listening on port ${PORT2}`))




app.listen(PORT , () => {
  log(`listening to ${PORT}`)
})

const priceRNGUpdate =  () => {
  const rngPrice = (price) => {
  let rng = Math.ceil(Math.random() * 2)
    if (rng === 1){
      rng = Math.ceil(Math.random() * 3)
      return price -= (rng/100) * price
    }else{
      rng = Math.ceil(Math.random() * 3)
      return price += (rng/100) * price
    }
  }
  Stocks.find().then((stocks) => {
    stocks.forEach((stock) => {
      stock.price = rngPrice(stock.price).toFixed(2)
      stock.history.push({
        time: Date.now(),
        price: stock.price
    })
      stock.save()
    })
  })
}

(function loop() {
  const rngTime = Math.ceil(Math.random() * (900000 - 300000)) + 300000
  console.log(rngTime)
  setTimeout(function() {
          priceRNGUpdate();
          loop();  
  }, rngTime);
}());



module.exports = app;
