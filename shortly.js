var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var $= require('jquery');
const session = require('express-session')
// const uuidv1 = require('uuid/v1');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use('/signup',session({
  // genid: (req) => {
  //   console.log('Inside the session middleware')
  //   console.log(req.sessionID)
  //   return uuid() // use UUIDs for session IDs
  // },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: {secure:true}
}))

function checkSession(req, res, next) {
  console.log('made it to checksession')
  if (req.session.views) {
    req.session.views++
    res.setHeader('Content-Type', 'text/html')
    res.write('<p>views: ' + req.session.views + '</p>')
    res.write('<p>expires in: ' + (req.session.cookie.maxAge / 1000) + 's</p>')
    res.end()
  } else {
    req.session.views = 1
    res.end('welcome to the session demo. refresh!')
  }
}

app.get('/',
function(req, res) {
  res.render('signup')
  // return res.redirect('/signup')
});

app.get('/create', 
function(req, res) {
  console.log('req sess in create', req.session)
  if(req.session){
    res.render('index');
  }
});

app.get('/links', 
function(req, res) {
  if(req.session){
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
  }
});

app.post('/links', 
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/signup', function(req, res) {
  // var username = $('.username').val();
  // var password = $('.password').val();
  console.log(req)
  // new User({username:username, password:password}).fetch().then()
})

app.post('/signup', function (req, res) {
  new User({username:req.body.username,password:req.body.password}).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } 
    else {
      // util.getUrlTitle(uri, function(err, title) {
      //   if (err) {
      //     console.log('Error reading URL heading: ', err);
      //     return res.sendStatus(404);
      Users.create({
        username: req.body.username,
        password: req.body.password
      })
      .then(function(newUser) {
        res.status(200).send(newUser);
      });

        }


      });
    });
//   });
// })

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

module.exports = app;
