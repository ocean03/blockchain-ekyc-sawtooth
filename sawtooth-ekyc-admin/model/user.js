const notificationConfig = require("../configs/notification_config");

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dataStorage = require('../BlockchainLib/storage');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://' + notificationConfig.MONGO_IP_ADDRESS + ':' + notificationConfig.MONGO_PORT + '/primechainkycadmin',{ useNewUrlParser: true });
var db = mongoose.connection;

var Schema = mongoose.Schema;

// User Schema 
var userSchema = Schema({
    username: {
        type: String,
        index: true,
    },
    email: {
        type: String,
        index: true,
        required: true,
        unique: true
    },
    designation: {
        type: String,
        default: null
    },
    organisation: {
        type: String,
        default: null
    },
    cell: {
        type: String,
        default: null
    },
    random: {
        type: String,
        required: true
    },
    password: {
        type: String,
    },
    user_address: {
        type: String,
    },
    public_key: {
        type: String,
    },
    checked: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('User', userSchema);

module.exports.createNewUser = (newUser, callback) => {
    newUser.save((err, is_saved) => {
        if (err) {
            return callback(err, null);
        }
        else {
            callback(null, true);
        }
    });
};

module.exports.doesUserExists = (email, random, callback) => {
    let query = { email: email, random: random };
    db.collection('users').findOne(query, (err, user_info) => {
        if (err) {
            return callback(err, null);
        }
        else {
            callback(null, true);
        }
    });
};

module.exports.getUserByEmail = (email, callback) => {
    var query = { email: email };
    db.collection('users').findOne(query, (err, user_info) => {
        if (err) {
            return callback(err, null);
        }
        else {
            callback(null, user_info);
        }
    });
};

module.exports.updateResetPassword = (email, password, random, callback) => {
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return callback(err, null);
        }
        else {
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) {
                    return callback(err, null);
                }
                else {
                    db.collection('users').update({ email: email }, {
                        $set: {
                            password: hash,
                            random: random
                        }
                    }, (err, is_updated) => {
                        if (err) {
                            return callback(err, null);
                        }
                        else {
                            callback(null, true);
                        }
                    });
                }
            });
        }
    });
};

module.exports.updateUserPassword = (email, password, callback) => {
    bcrypt.genSalt(10, function (err, salt) {
        if (err) {
            return callback(err, null);
        }
        else {
            bcrypt.hash(password, salt, function (err, hash) {
                if (err) {
                    return callback(err, null);
                }
                else {
                    db.collection('users').update({ email: email }, {
                        $set: {
                            password: hash
                        }
                    }, (err, is_updated) => {
                        if (err) {
                            return callback(err, null);
                        }
                        else {
                            callback(null, true);
                        }
                    });
                }
            });
        }
    });
};

// It verifies the user details by using email, random and update the user details in user collection.
module.exports.verifyUser = (email, secret, random, callback) => {
    var query = { email: email, random: random };
    db.collection('users').findOne(query, (err, user) => {
        if (err) throw err;

        if (user != null) {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) throw err;

                bcrypt.hash(secret, salt, (err, hash) => {
                    if (err) throw err;

                    let userName = user.username;
                    dataStorage.getAddresses(userName, (err, address) => {
                        if (err) throw err;

                        dataStorage.getUserPubKey(userName, (err, public_key) => {
                            if (err) { return callback(err, null); }
                            
                            db.collection('users').update({ email: email }, {
                                $set: {
                                    password: hash,
                                    user_address: address,
                                    public_key: public_key.toString('utf8'),
                                    checked: 'y'
                                }
                            }, callback);
                        });
                    });
                });
            });
        }
    });
};

module.exports.getUserDetailsByEmail = (email, callback) => {
    var query = { email: email };
    db.collection('users').findOne(query, (err, user_info) => {
        if (err) { return callback(err, null); }
        else { callback(null, user_info); }
    });
};

module.exports.comparePassword = (candidatePassword, hash, callback) => {
    bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
        if (err) { return callback(err, null); }
        else { callback(null, isMatch); }
    });
};

module.exports.verifyPassword = (email, password, callback) => {
    db.collection('users').findOne({ email: email }, (err, user) => {
        if (err) { return callback(err, null); }
        bcrypt.compare(password, user.password, function (err, isMatch) {
            if (err) { return callback(err, null); }
            else { callback(null, isMatch); }
        });
    });
}

module.exports.updateRandom = (email, random, callback) => {
    db.collection('users').update({ email: email }, {
        $set: {
            random: random
        }
    }, (err, is_set) => {
        if (err) { return callback(err, null); }
        else { callback(null, true); }
    });
};

