

module.exports = {
    validateBuy : (req,res,next) => {
        const {email , order , password} = req.body
        if(!email || !password){
            return res.status(500).json({errors : 'All field must be filled'})
        }
        if (order < 1 ){
            return res.status(500).json({errors : 'Order must be 1 or more'})
        }
        next() 
    },
    validateCreate: (req,res,next) => {
        const {name, price , units} = req.body
        if(!name || name.length < 3) {
            return res.status(500).json({errors : 'Stock Name must be 4 character or longer'})
        }
        if(price < 25) {
            return res.status(500).json({errors : 'Stock Price must be $25 or higher'})
        }
        if(units <20){
            return res.status(500).json({errors : 'Stock Units must be 20 or higher'})
        }
        next()
    },
    validateSell :(req,res,next) => {
        const {email , sell , password} = req.body
        if( sell < 1){
            return res.status(500).json({errors : 'Sell must be 1 or more'})
        }
        next()
    },
    validateSignup: (req,res,next) => {
        const {name,email ,password} = req.body

        if (!email||!password){
            return res.status(500).json({errors : 'All field must be filled'})
        }
        if(!email.includes('@') || !email.includes('.') ){
            return res.status(500).json({errors : 'Use a valid Email'})
        }
        if(password.length < 6 ){
            return res.status(500).json({errors : 'Password must be 6 character or longer'})
        }
        next()
    },
    validateLogin: (req,res,next) => {
        const {email,password} = req.body

        if(!email|| !password){
            return res.status(500).json({errors : 'All field must be filled'})
        }
        if(email){
            if(!email.includes('@') || !email.includes('.') ){
                return res.status(500).json({errors : 'Use a valid Email'})
            }
        }
        next()
    },
    validateUpdate: (req,res,next) => {
        const {name , email, userEmail, nPassword , retypeNPassword} = req.body
        
        if(email){
            if(!email.includes('@') || !email.includes('.') ){
                return res.status(500).json({errors : 'Use a valid Email'})
            }
        }
        if(nPassword){
            if(nPassword !== retypeNPassword){
                return res.status(500).json({errors : 'New Password Need to Match'})
              }
              if(nPassword.length < 6){
                return res.status(500).json({errors : 'New Password Must be 6 Character Long'})
              }
        }


         next()
    }
}