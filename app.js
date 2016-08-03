var express = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require("body-parser");
var methodOverride = require('method-override');
var expressSanitizer = require("express-sanitizer");
var passport = require("passport"),
    LocalStrategy = require('passport-local'),
    User = require("./models/user");
var Blog = require("./models/blog");
var flash = require("connect-flash");

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(expressSanitizer());
app.set("view engine", "ejs");

// mongoose.connect("mongodb://localhost/rcBlog");
mongoose.connect("mongodb://rcrowen:penPEN2016@ds139685.mlab.com:39685/rcrowenblog");
// mongodb://rcrowen:@penPEN2016@ds139685.mlab.com:39685/rcrowenblog
// mongodb://<dbuser>:<dbpassword>@ds139685.mlab.com:39685/rcrowenblog

// Passport Configuration
app.use(require("express-session")({
    secret: "E=mc2",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// var newPost = new Blog({
//     title: "Second post into the database. Whoop.",
//     content: "We're trying again. Hopefully, it'll work just the same as before."
// }); 

// newPost.save(function(err, blog) {
//     if(err) {
//         console.log("Something went wrong!");
//     } else {
//         console.log("We just saved a blog post!");
//         console.log(blog);
//     }
// });

app.get('/', function(req, res) {
    res.render('home');
});

app.get('/blog', function(req, res) {
    Blog.find({}, function(err, blogs){
       if(err) {
           console.log("No blogs exist!");
       } else {
           res.render('blog', {blogs: blogs});
       } 
    });
});

app.get('/new', isLoggedIn, function(req,res) {
   res.render('new'); 
});

// Create route
app.post('/blog', isLoggedIn, function(req,res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.create(req.body.blog, function(err, newBlog) {
        if(err) {
            res.render('new');
        } else {
            res.redirect('/blog');
        }
    });
});

app.get('/blog/:id', function(req, res) {
    Blog.findById(req.params.id, function(err, foundBlog) {
        if(err) {
            res.render('/blog');
        } else {
            res.render('show', {blog: foundBlog});
        }
    });
});


// Edit route
app.get('/blog/:id/edit', isLoggedIn, function(req, res) {
    Blog.findById(req.params.id, function(err, foundBlog) {
        if(err) {
            res.redirect('/blog');
        } else {
            res.render('edit', {blog: foundBlog});
        }
    });
});

// Update route
app.put('/blog/:id', isLoggedIn, function(req,res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog) {
        if(err) {
            res.redirect('/blog');
        } else {
            res.redirect('/blog/' + req.params.id);
        }
    });
});

// Delete route
app.delete('/blog/:id', isLoggedIn, function(req, res) {
    Blog.findByIdAndRemove(req.params.id, function(err) {
        if(err) {
            res.redirect('/blog');
        } else {
            res.redirect('/blog');
        }
    })
});

// Auth routes
app.get('/register', function(req, res) {
    res.render('register');
});

app.post('/register', function(req, res) {
    var newUser = new User({username: req.body.username, admin: false});
    User.register(newUser, req.body.password, function(err, user) {
        if(err) {
            console.log(err);
            return res.render('register');
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect('/blog');
        });
    });
});

// login route
app.get('/login', function(req, res) {
    res.render('login.ejs');
});

app.post('/login', passport.authenticate("local", 
    {
        successRedirect: '/blog',
        failureRedirect: '/login'
    }), function(req, res) {
});

// log out logic
app.get('/logout', function(req, res) {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect('/login');
});

app.get('*', function(req, res) {
    res.send("Opps");
});

function isLoggedIn(req, res, next) {
    var identity = req.user;
    if(req.isAuthenticated() && identity.admin === true) {
        return next();
    }
    req.flash("error", "Please Login First!");
    res.redirect('/login');
}


// Listen for requests
app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Let's start designing something...");
});

