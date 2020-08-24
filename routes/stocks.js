const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const verifyToken = require('./middleware/verifyToken');
const Stock = require('../models/Stocks')
const User  = require('../models/User')
const Portfolio = require('../models/Portfolio')
const {priceAjust , priceAjustsell} = require('./middleware/stockPriceAjustment')
const bcrypt = require('bcryptjs')
const {validateBuy , validateCreate , validateSell } = require('./middleware/validation')
const History = require('../models/History')

router.get('/all' , async (req,res,next) => {

try {
let stocks = await Stock.find()
return res.status(200).json({stocks})
}

catch(err){
    return res.status(500).json({errors : err})
}

})



router.get('/stock/:id' ,  async (req,res,next)=> {
    
    try {
        let stock = await Stock.findById(req.params.id)
        if(stock){
            return res.status(200).json({stock})
        }
        return res.status(404).json({errors : 'Stocks Not Found'})
    }
    catch(err){
        return res.status(404).json({errors : 'Stocks Not Found' , err})
    }
})


router.post('/create' , verifyToken , validateCreate ,async (req,res,next) => {
    const {name, price , units , email , password} = req.body
    try {
        const exist = await Stock.findOne({name})
        if (exist){
            return res.status(500).json({errors : 'Stock Exist'})
        }
        let user = await User.findOne({email})
        if (user){
            console.log(req.body)
            // const match = await bcrypt.compare(password, user.password)
            // console.log(req.body)
            // if(!match){
            //     return res.status(500).json({errors : 'Invalid Password'})
            //   }
              console.log(req.body)
            if (price * units > user.capital){
                return res.status(200).json({errors : 'Insufficent Funds'})
            }
            let newStock = await new Stock({owner: user._id ,name,price,units , sold:0})
            newStock.history.push({
                time: Date.now(),
                price: price
            })
            newStock.save()
            .then((stock) => {
                Portfolio.findOne({owner:user._id})
                .then((portfolio) => {
                    console.log(portfolio)
                    portfolio.stocks.push({
                        id: newStock._id,
                        name: name.toLowerCase(),
                        units,
                    })
                    user.capital -= price * units
                    user.save()
                    portfolio.save()
                    let history = new History({message: `${user.email} created ${newStock.name}`})
                    history.save()
                    Stock.find().then((stocks) => { return res.status(200).json({message: 'Stock Created' , stocks}) })
                })
                .catch((err) => {
                    return res.status(500).json({errors: 'Portfolio Error' ,err})
                })
            })
            .catch((err) => {
                return res.status(500).json({errors : 'Stock Error' , err})
            })
        }else {
            return res.status(500).json({errors : 'Cant Find User'})
        }
        
    }
    catch(err){
        return res.status(500).json({errors: err})
    }
})


router.put('/buy/:id' , verifyToken, validateBuy ,  async (req,res,next) => {
    const {email , order ,password} = req.body
    const id = req.params.id
    try {
        
        let user = await User.findOne({email})
      
        let portfolio = await Portfolio.findOne({owner: user._id})
        
        if(user){
            const match = await bcrypt.compare(password, user.password)
            if(!match){
                return res.status(500).json({errors : 'Invalid Password'})
              }

            let stock = await Stock.findById(id)
            let owner = `${stock.owner}` === `${user._id}`
            if(owner){
                return res.status(500).json({errors : 'You Own This Stock'})
            }
            if(order > (stock.units - stock.sold)){
                console.log(1)
                return res.status(500).json({errors: `Your Request for ${order} exeeded the amount ${(stock.units - stock.sold)}`})
            }
            if(user.captial < (order * stock.price)){
                return res.status(500).json({errors: `Insufficent Capital ${(order * stock.price)}`})
            }


            const oldStockPrice = stock.price
            ///////////////////// 
            stock.sold += order
            stock.price = priceAjust(stock.price , stock.units , order)
            stock.history.push({
                time: Date.now(),
                price: stock.price
            })
            
            /////////////////////
            stock.save().then((stock) => {
                user.capital -= (order * oldStockPrice)
                user.save().then(async () => {
                   let exist = await portfolio.stocks.findIndex((searchStock) => {
                       return searchStock.name === stock.name
                   })
                    
                    if (exist > -1){
                        let number  = await portfolio.stocks[exist].units + order
                        Portfolio.updateOne({'owner': user._id, 'stocks.name' : stock.name},
                        {'$set': {
                               'stocks.$.units': number,
                         }},
                            function(err,model) {
                             if(err){
                              console.log(err);
                          }
                          return model;
                   })


                    }else {
                        portfolio.stocks.push({id: stock._id ,name: stock.name , units: order})
                    }
                    portfolio.save()
                    .then(async(portfolio)=> {
                        
                        try{
                            
                            let sellerportfolio = await Portfolio.findOne({owner: stock.owner})
                            
                            
                            let exist = await sellerportfolio.stocks.findIndex((searchStock) => {
                                return searchStock.name === stock.name
                            })
                            let number  = await sellerportfolio.stocks[exist].units - order
                            Portfolio.updateOne({'owner': stock.owner, 'stocks.name' : stock.name},
                            {'$set': {
                                   'stocks.$.units': number,
                             }},
                                function(err,model) {
                                 if(err){
                                  console.log(err);
                              }
                              return model;
                       })


                       let history = new History({message: `${user.email} Bought ${order}Units of ${stock.name}`})
                       history.save()
                            return res.status(200).json({message : 'Your order has been successful'})
                        }
                        catch(err){
                            return res.status(500).json({errors :"1", err})
                        }
                    })
                    .catch((err) => {
                        return res.status(500).json({errors :"2", err})
                    })
                }).catch((err) => {
                    return res.status(500).json({errors :"3", err})
                })
    
            })
            .catch((err) => {
                return res.status(500).json({errors :`Your Request for ${order} exeeded the amount ${(stock.units - stock.sold)}`, err})
            })
        }
    }

    catch(err){
        return res.status(500).json({errors: 'Ops Somthing Went Wrong ...Catch Error ' ,err})
    }
})
 

router.put('/sell/:id' , verifyToken, validateSell , async(req,res,next) => {
    const {email , sell , password} = req.body
    const id = req.params.id
    try {
        let user = await User.findOne({email})
        let portfolio = await Portfolio.findOne({owner: user._id})
        let stock = await Stock.findById(id)
        const match = await bcrypt.compare(password, user.password)
        if(!match){
            return res.status(500).json({errors : 'Invalid Password'})
          }

        console.log(req.body)
        let owner = `${stock.owner}` === `${user._id}` 
        if(typeof sell !== 'number'){
            return res.json({errors : 'sell must be a number'})
        }
        if(owner){
            return res.status(500).json({errors : 'You Own This Stock'})
        }
        
        let exist = await portfolio.stocks.findIndex((searchStock) => {
            
            return searchStock.name === stock.name
        })
        
        
        
         if(exist === -1){
             
             return res.status(500).json({errors : 'You do not own any of this stock'})
         }
         if(exist > -1){
            if (portfolio.stocks[exist].units < sell || portfolio.stocks[exist].units === 0 ){
                return res.status(500).json({errors : 'You are selling more than you have'})
            } 
            let number = await portfolio.stocks[exist].units - sell
            Portfolio.updateOne({'owner': user._id, 'stocks.name' : stock.name},
            {'$set': {
                   'stocks.$.units': number,
             }},
                function(err,model) {
                 if(err){
                  console.log(err);
              }
              return model;
       })

            let buyerPortfolio = await Portfolio.findOne({owner : stock.owner})
            let idx = await buyerPortfolio.stocks.findIndex((searchStock) => {
                return searchStock.name === stock.name
            })

            let sellingNum = await buyerPortfolio.stocks[idx].units + sell

            Portfolio.updateOne({'owner': stock.owner, 'stocks.name' : stock.name},
            {'$set': {
                   'stocks.$.units': sellingNum,
             }},
                function(err,model) {
                 if(err){
                  console.log(err);
              }
              return model;
       })
         

            user.capital += sell * stock.price
            stock.sold -= sell
            let oldPrice = stock.price
            ///////////////////// this is where i set new price
            stock.price = priceAjustsell(stock.price , stock.units,sell)
            //////////////
            stock.history.push({
                time: Date.now(),
                price: stock.price
            })
          
            user.save()
            portfolio.save()
            buyerPortfolio.save()
            stock.save()
            let history = new History({message: `${user.email} Sold ${sell}Units of ${stock.name}`})
            history.save()
            return res.status(200).json({message : `You sold ${sell} of ${stock.name} for ${sell*oldPrice}`})
         }
    }
    catch(err){
        return res.status(500).json({errors : 'catch error',err})
    }
})









module.exports = router