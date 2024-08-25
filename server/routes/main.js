const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Subscriber = require('../models/Subscriber');
const jwt = require('jsonwebtoken');

let demoUserId;
async function findDemoUserId() {
    const demoUser = await User.findOne({ username: 'demoID' });
    if (demoUser) {
        demoUserId = demoUser._id;
    } else {
        console.error('Demo user not found');
    }
}
findDemoUserId();

const checkUser = (req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if (err) {
                res.locals.user = null;
                next();
            } else {
                res.locals.user = decodedToken;
                next();
            }
        });
    } else {
        res.locals.user = null;
        next();
    }
};

// Main page
router.get('/', checkUser, async (req, res) => {
    try {
        const locals = {
            title: "Blog first",
            description: "Testing the blog section"
        };

        let perPage = 10;
        let page = req.query.page || 1;

        let query = {};
        let username = null;

        if (res.locals.user) {
            query = { user: res.locals.user.userId };
            // Fetch the username from the database
            const user = await User.findById(res.locals.user.userId);
            username = user ? user.username : null;
        } else {
            query = { user: demoUserId };
        }

        const data = await Post.find(query)
            .sort({ createdAt: -1 })
            .skip(perPage * page - perPage)
            .limit(perPage);

        const count = await Post.countDocuments(query);
        const nextPage = parseInt(page) + 1;
        const hasNextPage = nextPage <= Math.ceil(count / perPage);

        const statusMessage = req.session.statusMessage;
        delete req.session.statusMessage;

        res.render('index', {
            locals,
            data,
            current: page,
            nextPage: hasNextPage ? nextPage : null,
            currentRoute: '/',
            statusMessage,
            user: res.locals.user,
            username  // Pass the username to the template
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
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


router.post('/subscribe', async (req, res) => {
    try {
      const { email } = req.body;
      const newSubscriber = new Subscriber({ email });
      await newSubscriber.save();
      req.session.statusMessage = {
        type: 'success',
        text: 'Subscribed successfully!'
      };
    } catch (error) {
      console.error('Error subscribing:', error);
      req.session.statusMessage = {
        type: 'error',
        text: 'Error subscribing. Please try again.'
      };
    }
    res.redirect('/');
  });

  router.get('/unsubscribe', async (req, res) => {
    try {
      const { token } = req.query;
  
      // Find the subscriber using the unsubscribe token
      const subscriber = await Subscriber.findOne({ unsubscribeToken: token });
  
      if (!subscriber) {
        return res.status(400).send('Invalid unsubscribe link.');
      }
  
      // Remove the subscriber from the database or mark them as unsubscribed
      await Subscriber.deleteOne({ _id: subscriber._id });
  
      res.send('You have successfully unsubscribed from the newsletter.');
    } catch (error) {
      console.error('Error during unsubscribe:', error);
      res.status(500).send('An error occurred. Please try again later.');
    }
  });
  


module.exports = router;
