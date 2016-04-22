'use strict';

let passport = require('passport'),
	Account = require('../models/account');

let ensureAuthenticated = (req, res, next)  => {
	if (req.isAuthenticated()) {
		return next();
	} else {
		res.redirect('/');
	}
};

module.exports = () => {
	app.get('/account', ensureAuthenticated, (req, res) => {
		res.render('my-account');
	});

	app.post('/account/change-password', ensureAuthenticated, (req, res) => {
		let newPassword = req.body.newPassword,
			newPasswordConfirm = req.body.newPasswordConfirm,
			user = req.user;

		if (newPassword !== newPasswordConfirm) {
			res.status(401).json({message: 'not equal'});
			return;
		}

		user.setPassword(newPassword, () => {
			user.save();
			res.send();
		});
	});

	app.post('/account/signup', (req, res) => {
		let username = req.body.username,
			password = req.body.password,
			save = {
				username,
				gameSettings: {
					disablePopups: false,
					enableTimestamps: false
				},
				games: [],
				wins: 0,
				losses: 0,
				created: new Date()
			};

		if (!/^[a-z0-9]+$/i.test(username) && username.length < 15) {
			res.status(401).json({message: 'Sorry, your username can only be alphanumeric.'});
		} else {
			Account.register(new Account(save), password, (err) => {
				if (err) {
					console.log(err);
				}

				passport.authenticate('local')(req, res, () => {
					res.send();
				});
			});
		}
	});

	app.post('/account/signin', passport.authenticate('local'), (req, res) => {
		res.send();
	});

	// app.post('/login', passport.authenticate('local'), (req, res, next) {
	// 		// issue a remember me cookie if the option was checked
	// 		if (!req.body.remember_me) { return next(); }

	// 		var token = utils.generateToken(64);
	// 		Token.save(token, { userId: req.user.id }, function(err) {
	// 		if (err) { return done(err); }
	// 		res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 604800000 }); // 7 days
	// 		return next();
	// 		});
	// 		},
	// 		function(req, res) {
	// 		res.redirect('/');
	// 		});

	app.post('/account/logout', ensureAuthenticated, (req, res) => {
		req.logOut();
		res.send();
	});

	// app.post('/account/delete-account', passport.authenticate('local'), (req, res) => {
				// todo-release
	// });
};