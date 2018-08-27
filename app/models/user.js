var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');



var User = db.Model.extend({
    //username
    tableName: 'users',
    password: '',
    username: '',
    initialize: function() {
        this.on('creating', function({attributes}) {
            username = attributes.username;
            password = attributes.password;
        //   console.log('user ', 'attri',attrs)
        });
        console.log(this)
    }
});

module.exports = User;