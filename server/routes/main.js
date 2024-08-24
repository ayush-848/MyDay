const express = require('express');
const router = express.Router();
const Post = require('../models/Post');

// Main page
router.get('/', async (req, res) => {
    try {
        const locals = {
            title: "Blog first",
            description: "Testing the blog section"
        };

        let perPage = 10;
        let page = req.query.page || 1;

        const data = await Post.aggregate([{ $sort: { createdAt: -1 } }])
            .skip(perPage * page - perPage)
            .limit(perPage)
            .exec();

        const count = await Post.countDocuments();
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        const statusMessage = req.session.statusMessage; // Save statusMessage for use

        // Clear statusMessage after rendering
        delete req.session.statusMessage;

        res.render('index', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: '/',
            statusMessage // Pass statusMessage to the template
        });
    } catch (error) {
        console.log(error);
    }
});

// View a single post
router.get('/post/:id', async (req, res) => {
    try {
        let slug = req.params.id;
        const data = await Post.findById({ _id: slug });
        if (!data) {
            return res.status(404).send('Post not found');
        }
        const locals = {
            title: data.title,
            description: "Simple Blog created with NodeJs, Express & MongoDb."
        };
        res.render('post', {
            locals,
            data,
            currentRoute: `/post/${slug}`
        });
    } catch (error) {
        console.log(error);
    }
});

// Search functionality
router.post('/search', async (req, res) => {
    try {
        const locals = {
            title: "Search",
            description: "Testing the blog section"
        };
        let searchTerm = req.body.searchTerm;
        const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9]/g, "");

        const data = await Post.find({
            $or: [
                { title: { $regex: new RegExp(searchNoSpecialChar, 'i') } },
                { body: { $regex: new RegExp(searchNoSpecialChar, 'i') } }
            ]
        });
        res.render("search", {
            data,
            locals,
            currentRoute: '/'
        });
    } catch (error) {
        console.log(error);
    }
});

// About page
router.get('/about', (req, res) => {
    res.render('about', {
        currentRoute: '/about'
    });
});

module.exports = router;
