const express = require('express');
const mongoose = require('mongoose');
const logger = require('morgan');
const app = express();
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
const cors = require("cors")







mongoose
.connect(process.env.MONGODB_URI , {
    useNewUrlParser : true,
    useUnifiedTopology: true,
    useCreateIndex: true,
})
.then(() => {console.log('mongodb connected')})
.catch(()=> {console.log('server err')});






app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use('/api', indexRouter);

app.use('/api/users', usersRouter);
app.use('/api/stock' , stockRouter)
app.use('/api/portfolio' , portfolioRouter)
app.use('/api/history' , async (req,res,next) => {
  let history = await History.find()
  res.status(200).json({history})
})




const server = http.createServer(app);
const io = socketIo(server);




io.on("connection", (socket) => {
  let history
  console.log("New client connected");
  setInterval(async () =>{
  let newHistory = await History.find()
    if (history){
      if(newHistory[newHistory.length -1].timestamp !== history[history.length -1].timestamp){
        if (newHistory.length > 30){
          history = newHistory.slice(newHistory.length - 30)
          return socket.emit("data", history)
        }
        history = newHistory
          return socket.emit("data", history)
      }
      return
    }
    if(!history){
      if (newHistory.length > 30){
        history = newHistory.slice(newHistory.length - 30)
        return socket.emit("data", history)
      }
      history = newHistory
      socket.emit("data", history)
    }

  }
  , 1000);
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});




server.listen(PORT, () => console.log(`Listening on port ${PORT}`))




// app.listen(PORT , () => {
//   log(`listening to ${PORT}`)
// })

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
  console.log(`next stock update in ${rngTime / 1000} Seconds`)
  setTimeout(function() {
          priceRNGUpdate();
          loop();  
  }, rngTime);
}());


module.exports = app;
