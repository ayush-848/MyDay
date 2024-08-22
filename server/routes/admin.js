const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User=require('../models/User');


const adminLayout='../views/layouts/admin.ejs'

// Get Home
router.get('/admin',async (req,res)=>{

    try{
        
        const locals={
            title: "Blog first",
            description: "Testing the blog section"
        }


       res.render('admin/login',{locals,layout:adminLayout});
    }catch(error){
       console.log(error);
    }

});

// Admin posts - check login

router.post('/admin',async (req,res)=>{

    try{

       const {username, password}=req.body;
       console.log(req.body);

       if(req.body.username==='admin' && req.body.password==='password'){
        res.send("You are logged in");
       }else{
        res.send("Wrong username and password");
       }
    }catch(error){
       console.log(error);
    }

});



module.exports=router;