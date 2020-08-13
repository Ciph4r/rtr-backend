const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken')
const verifyToken = require('./middleware/verifyToken');
const Stock = require('../models/Stocks')
const User  = require('../models/User')
const Portfolio = require('../models/Portfolio')


router.get('/all' , async (req,res,next) => {


try {
let stocks = await Stock.find()
return res.status(200).json({stocks})
}

catch(err){
    throw(err)
}

})


router.post('/create' , verifyToken ,async (req,res,next) => {
    const {name, price , units , email} = req.body
    try {
        const exist = await Stock.findOne({name})
        if (exist){
            return res.status(500).json({errors : 'Stock Exist'})
        }
        let user = await User.findOne({email})
        if (user){
            
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
                        name,
                        units,
                    })
                    user.capital -= price * units
                    user.save()
                    portfolio.save()
                    return res.status(200).json({success: 'Stock Created' , stock})
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


router.put('/buy/:name' , async (req,res,next) => {
    const {price , units , email , order} = req.body
    const name = req.params.name
    try {
        let user = await User.findOne({email})
        let portfolio = await Portfolio.findOne({owner = user._id})
        if(user){
            let stock = await Stock.findOne({name})
            if(order > (stock.units - stock.sold)){
                return res.status(500).json({errors: `Your Request for ${order} exeeded the amount ${(stock.units - stock.sold)}`})
            }
            if(user.captial < (order * stock.price)){
                return res.status(500).json({errors: `Insufficent Capital ${(order * stock.price)}`})
            }
            if(stock.owner === user._id){
                return res.status(500).status({errors: 'Your Own This Stock'})
            }
            const oldStockPrice = stock.price
            ///////////////////// 
            stock.sold += order
            stock.history.push({
                time: Date.now(),
                price: stock.price
            })
            ///////////////////////
            stock.save().then((stock) => {
                user.capital -= (order * oldStockPrice)
                
                

            })
            .catch((err) => {

            })
        }
    }

    catch(err){
        return res.status(500).json({errors: 'Ops Somthing Went Wrong ...Catch Error ' ,err})
    }
})
 




})




module.exports = router