const express = require('express')
const router = express.Router();
const Post = require('../models/Post')

/*router.get('/',async (req,res)=>{
    const locals={
        title: "Blog first",
        description: "Testing the blog section"
    }

    try{
       const data=await Post.find();
       res.render('index',{locals,data});
    }catch(error){
       console.log(error);
    }

});
*/

router.get('/', async (req, res) => {
    try {
        const locals = {
            title: "Blog first",
            description: "Testing the blog section"
        }

        let perPage = 10;
        let page = req.query.page || 1;

        const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments();  // Corrected this line
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);  // Corrected typo here



        res.render('index', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null
        });
    }
    catch (error) {
        console.log(error);
    }

});


/*function insertPostData(){
    Post.insertMany([
        {
            title: "Building a simple blog website",
            body: "This is the post body"
        },
        {
            title: "Why Do I have to learn a new tech stack after few days",
            body: "Market is not good, they why??? "
        },
        {
            title: "DIY Restaurants are overrated",
            body: "They really are. We can bring ingredients from mall and can cook it by ourselves. This will also be a cheaper option"
        }
    ])
}
insertPostData();
    */

router.get('/post/:id', async (req, res) => {
    try {
        let slug = req.params.id;

        const data = await Post.findById({ _id: slug });

        const locals = {
            title: data.title,
            description: "Simple Blog created with NodeJs, Express & MongoDb.",
        }

        res.render('post', {
            locals,
            data,
            currentRoute: `/post/${slug}`
        });
    } catch (error) {
        console.log(error);
    }

});

router.post('/search',async (req,res)=>{

    try{
        const locals={
            title: "Search",
            description: "Testing the blog section"
        }
    let searchTerm=req.body.searchTerm;
    const searchNoSpecialChar=searchTerm.replace(/[^a-zA-Z0-9]/g,"");

      const data=await Post.find({
        $or:[
            {title: { $regex: new RegExp(searchNoSpecialChar,'i')}},
            {body: { $regex: new RegExp(searchNoSpecialChar,'i')}}
        ]
      });
       res.render("search",{
        data,
        locals
       });
    }catch(error){
       console.log(error);
    }

});

router.get('/about', (req, res) => {
    res.render('about');
})







module.exports = router;