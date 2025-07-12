const express = require('express');
require('dotenv').config();
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Changelog = require('../models/Changelog');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Subscriber = require('../models/Subscriber');
const {sendNewsletter} =require('../../utils/mailer')
const mongoose = require('mongoose');
const adminLayout = '../views/layouts/admin.ejs';
const jwtSecret = process.env.JWT_SECRET;
const sendContactFormEmail = require('../../utils/contactMail');

// Admin - check login
const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).redirect('/login');
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;

        // Fetch user details from the database
        const user = await User.findById(req.userId);
        if (!user) {
            throw new Error('User not found');
        }
        req.user = user; // Attach the user object to the request
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).redirect('/login');
    }
};

// Get Home
router.get('/admin', async (req, res) => {
    try {
        const locals = {
            title: "Admin Sign In",
            description: "Please sign in to access the admin panel",
            currentPath: req.path
        };
        res.render('admin/login', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }
});

// Admin login
router.post('/admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });

        try {
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).render('errors/error401', { error: new Error('Invalid credentials'), message: 'Invalid credentials' });
            }

            const token = jwt.sign({ userId: user._id }, jwtSecret);
            res.cookie('token', token, { httpOnly: true });
            res.redirect('/');
        } catch (authError) {
            return res.status(401).render('errors/error401', { error: authError, message: 'Invalid credentials' });
        }

    } catch (error) {
        return res.status(500).render('errors/error500', { error: error});
    }
});


// Admin Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Check if the username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            req.session.statusMessage = { type: 'error', text: '❌ User already exist' };
        res.redirect('/');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        req.session.statusMessage = { type: 'success', text: '✅ Registered successfully!' };
        res.redirect('/');
    } catch (error) {
        // Handle errors, such as database errors
        console.error(error);
        return res.status(500).render('errors/error500', { error: error, message: 'Error creating user' });
    }
});


// Admin Dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {

        // Fetch posts specific to the logged-in user
        const posts = await Post.find({ user: req.userId }).sort({ createdAt: 'desc' });

        // Fetch the full user object
        const user = await User.findById(req.userId);

        // Ensure mongoose is imported and used correctly
        // Convert req.userId to ObjectId
        const userIdObjectId = new mongoose.Types.ObjectId(req.userId);

        // Fetch recommended users
        const recommendedUsers = await User.aggregate([
            { $match: { _id: { $ne: userIdObjectId } } },
            { $sample: { size: 3 } }
        ]);

        // Prepare locals for rendering
        const locals = {
            title: 'Dashboard',
            description: 'Simple Blog created with NodeJs, Express & MongoDb.'
        };

        const statusMessage = req.session.statusMessage;
        delete req.session.statusMessage;

        // Render the dashboard view
        res.render('admin/dashboard', {
            locals,
            data: posts, 
            statusMessage,
            user, 
            recommendedUsers, 
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

// Admin - Create new post
router.get('/add-post', authMiddleware, async (req, res) => {
    try {
        const locals = {
            title: 'Add Post',
            description: 'A simple blog page created with NodeJs, Express & MongoDb.'
        };
        res.render('admin/add-post', { locals, layout: adminLayout });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

// Admin - Post new post
router.post('/add-post', authMiddleware, async (req, res, next) => {
   try{
    try {
        const newPost = new Post({
            title: req.body.title,
            body: req.body.body,
            user: req.userId
        });

        await newPost.save();
        req.session.statusMessage = { type: 'success', text: '✅ Post added successfully!' };
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        req.session.statusMessage = { type: 'error', text: '❌ Oops! Error occurred while adding post.' };
        res.redirect('/dashboard');
    }
} catch (error) {
    return res.status(500).render('errors/error500', { error: error });
}
});



// Admin - Get Post
router.get('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id, user: req.userId });
        if (!post) {
            return res.status(404).render('errors/error404', { error: errror, message: 'Post not found' });
        }
        const locals = {
            title: "Edit Post",
            description: "Edit your post"
        };
        res.render('admin/edit-post', {
            locals,
            data: post,
            layout: adminLayout
        });
    } catch (error) {
        console.log(error);
    }
});

// Admin - Update Post
router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findOne({ _id: req.params.id, user: req.userId });
        if (!post) {
            return res.status(404).send('Post not found');
        }
        post.title = req.body.title;
        post.body = req.body.body;
        post.updatedAt = Date.now();
        await post.save();

          req.session.statusMessage = { type: 'success', text: '✅ Post updated successfully!' };
        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
        // Store error status in session
        req.session.statusMessage = { type: 'error', text: '❌ Oops! Error updating post.' };
        res.redirect('/dashboard');
    }
});

// Admin - Delete Post
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        const post = await Post.findOneAndDelete({ _id: req.params.id, user: req.userId });
        if (!post) {
            req.session.statusMessage = { type: 'error', text: '❌ Post not found or you do not have permission to delete it.' };
        } else {
            req.session.statusMessage = { type: 'success', text: '✅ Post deleted successfully!' };
        }
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error deleting post:', error);
        req.session.statusMessage = { type: 'error', text: '❌ An error occurred while deleting the post.' };
        res.redirect('/dashboard');
    }
});

router.post('/send-newsletter', async (req, res) => {
    try {
      const { newsletterContent } = req.body;
      
      // Fetch all subscribers
      const subscribers = await Subscriber.find();
  
      // Send email to each subscriber
      for (let subscriber of subscribers) {
        await sendNewsletter(subscriber.email, 'Newsletter Update', newsletterContent);
      }
  
      req.session.statusMessage = {
        type: 'success',
        text: '✅ Newsletter sent successfully!'
      };
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Error sending newsletter:', error);
      req.session.statusMessage = {
        type: 'error',
        text: '❌ Error sending newsletter. Please try again.'
      };
      res.redirect('/dashboard');
    }
  });


router.post('/follow/:username', authMiddleware, async (req, res) => {
    try {
        const username = req.params.username;
        const userToFollow = await User.findOne({ username });
        if (!userToFollow) {
            return res.status(404).send('User not found');
        }

        const currentUserId = req.userId;
        const existingFollow = await Follow.findOne({
            follower: currentUserId,
            following: userToFollow._id
        });

        if (existingFollow) {
            // Unfollow
            await Follow.deleteOne({ _id: existingFollow._id });
        } else {
            // Follow
            await Follow.create({
                follower: currentUserId,
                following: userToFollow._id
            });
        }

        res.redirect(`/user/${username}`);
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

router.get('/contact',async(req,res)=>{
    res.render('admin/contact', {
        title: 'Changelog',
        description: 'Contact the owner',
    });
})

router.post('/submit-contact', (req, res) => {
    try{
        const { name, email, message } = req.body;

    // Send email with the form data
    sendContactFormEmail(name, email, message);
    req.session.statusMessage = {
        type: 'success',
        text: '✅ Mail sent successfully!'
      };
      res.redirect('/');
    }

      catch (error) {
        console.error('Error sending newsletter:', error);
        req.session.statusMessage = {
          type: 'error',
          text: '❌ Error sending newsletter. Please try again.'
        };
        res.redirect('/');
      }
});

// GET route to display changelogs
router.get('/changelog', async (req, res) => {
    try {
        // Fetch all changelog entries
        const changelogs = await Changelog.find().sort({ createdAt: 'desc' });

        // Fetch the logged-in user if there is a user ID
        let user = null;
        if (req.userId) {
            user = await User.findById(req.userId);
        }

        // Retrieve statusMessage from session if it exists
        const statusMessage = req.session.statusMessage || null;
        delete req.session.statusMessage;

        // Render the changelog view with changelog entries, status message, and user
        res.render('admin/changelog', {
            title: 'Changelog',
            description: 'View the list of changes and updates.',
            changelogs,
            statusMessage,
            user
        });
    } catch (error) {
        console.error('Error fetching changelog data:', error);
        res.status(500).send('Server Error');
    }
});


router.post('/add-changelog', authMiddleware, async (req, res) => {
    try {
        if (req.user.username !== 'ayush848') {
            req.session.statusMessage = {
                type: 'error',
                text: '❌ You do not have permission to add a changelog.'
            };
            return res.redirect('/changelog');
        }

        const { featureDetails, versionNumber, updatedOn } = req.body;

        // Ensure all required fields are provided
        if (!featureDetails || !versionNumber || !updatedOn) {
            req.session.statusMessage = {
                type: 'error',
                text: '❌ All fields are required.'
            };
            return res.redirect('/changelog');
        }

        const newChangelog = new Changelog({
            featureDetails,
            versionNumber,
            updatedOn: new Date(updatedOn) // Ensure updatedOn is a date
        });

        await newChangelog.save();

        req.session.statusMessage = {
            type: 'success',
            text: '✅ Changelog entry added successfully!'
        };
        res.redirect('/changelog');
    } catch (error) {
        console.error('Error adding changelog:', error);
        req.session.statusMessage = {
            type: 'error',
            text: '❌ Oops! Error occurred while adding changelog.'
        };
        res.redirect('/changelog');
    }
});


router.get('/user/:username', authMiddleware, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send('User not found');
        }
        const posts = await Post.find({ user: user._id }).sort({ createdAt: 'desc' });

        const currentUserId = req.userId;
        const currentUser = await User.findById(currentUserId);

        // Check if the current user is following the profile user
        const isFollowing = await Follow.findOne({
            follower: currentUserId,
            following: user._id
        });

        res.render('user/profile', {
            user,
            posts,
            currentUser,
            isFollowing
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
});

// User search route
router.get('/search-users', async (req, res) => {
    const { username } = req.query; // Get the username from the query parameter
    try {
        if (username) {
            // Perform an exact match search
            const users = await User.find({ username: username });
            res.json(users); // Return the matched users as JSON
        } else {
            res.json([]); // Return an empty array if no username is provided
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});



// Admin - Logout
router.get('/logout', (req, res) => {
    res.render('admin/logout', { layout: adminLayout });
});

router.post('/logout/confirm', async (req, res) => {
    res.clearCookie('token');
    res.redirect('/'); // Redirect to the homepage or login page
});



module.exports = router;
