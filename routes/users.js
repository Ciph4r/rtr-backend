const express = require('express');
const router = express.Router();
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const verifyToken = require('./middleware/verifyToken');
const Portfolio = require('../models/Portfolio');
const {validateLogin ,validateSignup , validateUpdate} = require('./middleware/validation')
const History = require('../models/History')
/* GET users listing. */





router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});





router.post('/signup',validateSignup, async (req,res,next) => {
  try {
    const {name,email ,password} = req.body
    let user = await User.findOne({email})

    if(user){
       return res.status(400).json({errors: 'User Exist'})
    }
    user = await new User({name ,email , password })
    
    await user.save().then((user)=> {
      let portfolio = new Portfolio({owner: user._id}).save()
      let history = new History({message: `${user.email} Just Joined The Market`})
      history.save()
     return res.status(200).json({message: 'User created' , user,password})
    })
  }
  catch(err){
    throw(err)
  }

})


router.post('/login', validateLogin, async (req,res,next) => {

try {
  const {email,password} = await req.body
  let user = await User.findOne({email})
   if(!user) {
     return res.status(400).json({errors: 'User Doesnt Exist'})
   }
   const exist = await bcrypt.compare(password, user.password)
   if(!exist){
    return res.status(400).json({errors: 'Incorrect password'})
   }
   const token = jwt.sign({_id:user._id} , process.env.TOKEN_SECRET)

   return res.status(200).header('auth-token', token).json({message: 'you are logged in' , token , user})
}

catch(error){
  console.log(error)
}

})


router.put('/update', verifyToken, validateUpdate,  async(req,res,next) => {
  const {name , email, userEmail, password ,  nPassword , retypeNPassword} = req.body
  try {
    let user = await User.findOne({email: userEmail})
    const newEmail = await User.findOne({email})
    const match = await bcrypt.compare(password, user.password)

    if(email){
      const newEmail = await User.findOne({email})
      if(newEmail){
        return res.status(500).json({errors : 'Email Already Registered'})
      }
    }

    if(!match){
      return res.status(500).json({errors : 'Invalid Password'})
    }


    user.name = name ? name : user.name
    user.email = email ? email : user.email
    if(password && nPassword && retypeNPassword){
        user.password = nPassword
    }
    await user.save()
    return res.status(200).json({message : 'Account Updated' , user})
  }

   catch(err){
    console.log(err)
  }
})


router.post('/user' , verifyToken , async (req,res,next) => {

  try{
    const {email , password} = req.body
    let user = await User.findOne({email})
    const match = await bcrypt.compare(password, user.password)
    if (match){
      return res.status(200).json({user})
    }
  }
  catch(err){
    return res.json({err})
  }
})




module.exports = router;
