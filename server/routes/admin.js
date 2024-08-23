const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


const adminLayout = '../views/layouts/admin.ejs'
const jwtSecret = process.env.JWT_SECRET;


// Admin - check login
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' })
    }
}

// Get Home
router.get('/admin', async (req, res) => {

    try {

        const locals = {
            title: "Blog first",
            description: "Testing the blog section"
        }


        res.render('admin/login', { locals, layout: adminLayout });
    } catch (error) {
        console.log(error);
    }

});

// Admin posts - check login

router.post('/admin', async (req, res) => {

    try {

        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid Credentials' })
        }

        const token = jwt.sign({ userId: user._id }, jwtSecret);
        res.cookie('token', token, { httpOnly: true });

        res.redirect('/dashboard');


    } catch (error) {
        console.log(error);
    }

});

// Admin Register

router.post('/register', async (req, res) => {

    try {

        const { username, password } = req.body;
        const encryptPassword = await bcrypt.hash(password, 10);

        try {
            const user = await User.create({ username, password: encryptPassword });
            res.status(201).json({ message: 'User has been created successfully', user });
        }
        catch (error) {
            if (error.code === 11000) {
                res.status(409).json({ message: 'User already exists' });
            }
            res.status(500).json({ message: 'Oops!!! Internal server error' })
        }

    } catch (error) {
        console.log(error);
    }

});

// Admin Dashboard

router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const data = await Post.find().sort({ createdAt: 'desc' });
        const locals = {
            title: 'Dashboard',
            description: 'Simple Blog created with NodeJs, Express & MongoDb.'
          }
        // Retrieve status message from session
        const statusMessage = req.session.statusMessage;
        // Clear the status message from the session
        delete req.session.statusMessage;

        res.render('admin/dashboard', {
            locals,
            data,
            statusMessage,
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

        const data = await Post.find();

        res.render('admin/add-post', {
            locals,
            data,
            layout: adminLayout
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


// Admin - Post new post

router.post('/add-post', authMiddleware, async (req, res, next) => {
    try {
        try {
            const newPost = new Post({
                title: req.body.title,
                body: req.body.body
            });

            await Post.create(newPost);
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

        const locals = {
            title: "Edit Post",
            description: "Free NodeJs User Management System",
        };

        const data = await Post.findOne({ _id: req.params.id });

        res.render('admin/edit-post', {
            locals,
            data,
            layout: adminLayout
        })

    } catch (error) {
        console.log(error);
    }

});


// Admin - Create New Post

router.put('/edit-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndUpdate(req.params.id, {
            title: req.body.title,
            body: req.body.body,
            updatedAt: Date.now()
        });

        // Store success status in session
        req.session.statusMessage = { type: 'success', text: '✅ Post updated successfully!' };
        res.redirect('/dashboard');

    } catch (error) {
        console.log(error);
        // Store error status in session
        req.session.statusMessage = { type: 'error', text: '❌ Oops! Error updating post.' };
        res.redirect('/dashboard');
    }
});





// Admin - Delete Post (DELETE)
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        await Post.deleteOne({ _id: req.params.id });
        req.session.statusMessage = { type: 'success', text: '✅ Post deleted successfully!' };
        res.redirect('/dashboard');
    } catch (error) {
        req.session.statusMessage = { type: 'error', text: '❌ Oops! An error occured while deleting post.' };
        res.redirect('/dashboard');
    }
});




// Admin - Logout
router.get('/logout', (req, res) => {
    res.render('admin/logout',{
            layout: adminLayout
    }
    ); // Render the logout confirmation page
});


router.post('/logout/confirm', async (req, res) => {
    res.clearCookie('token'); 
    res.redirect('/'); // Redirect to the homepage or login page
});




module.exports = router;