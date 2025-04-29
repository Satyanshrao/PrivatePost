const express=require('express')
const app=express();
const userModel= require('./models/user');
const postModel=require('./models/post')
const cookieParser = require('cookie-parser');
const jwt =require('jsonwebtoken')
const bcrypt =require('bcrypt')

app.set("view engine","ejs")
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

 app.get('/',(req,res)=>{
    res.render("index")
 })
app.post('/register', async (req,res)=>{
    let {email,name,username,age,password}=req.body
    let user = await userModel.findOne({email})
    if(user) return res.status(500).send("User Is Already Registered")

    bcrypt.genSalt(10, (err,salt)=>{
       bcrypt.hash(password,salt, async (err,hash)=>{
          const user= await userModel.create({
            username,
            name,
            age,
            email,
            password:hash
           });
            const token= jwt.sign({email:email,userid:user._id},"shhhh")
            res.cookie("token",token);
            res.redirect("login")
       }) 
    })
})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.get('/profile',isLoggedIn, async (req,res)=>{
let user = await userModel.findOne({email:req.user.email})
   await user.populate("posts")
       res.render('profile',{user})
})




app.post('/post',isLoggedIn, async (req,res)=>{
    let user = await userModel.findOne({email:req.user.email})
    let{content}=req.body
    let post = await postModel.create({
        user:user._id,
        content:content
    })   
     user.posts.push(post._id) 
     await user.save() 
     res.redirect("profile")  
    })


app.post('/login',async (req,res)=>{
    let {email,password}=req.body;
    const user =  await userModel.findOne({email})
    if(!user) return res.status(500).send("something went wrong")

    bcrypt.compare(password,user.password,(err,result)=>{
        if(result) {
            const token= jwt.sign({email:email,userid:user._id},"shhhh")
            res.cookie("token",token);
            res.redirect('/profile')
        }
        else res.redirect('/login')
    })

})
app.get('/logout',(req,res)=>{
    res.cookie("token","")
    res.redirect('login')
})

function isLoggedIn(req,res,next){
    if(req.cookies.token==="") res.redirect("/login")
        else{
         let data =jwt.verify(req.cookies.token ,"shhhh")
         req.user =data;
         next();
    }
    
}


app.listen(3000)