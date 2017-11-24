const mongoose = require('mongoose');
const User = mongoose.model('User');
const promisify = require('es6-promisify');

exports.loginForm = (req, res) => {
  res.render('login', { title: 'Login' });
};

exports.registerForm = (req, res) => {
  res.render('register', { title: 'Register' });
};

exports.validateRegister = (req, res, next) => {
  req.sanitizeBody('username');
  req.checkBody('username', 'You must supply a username.').notEmpty();
  req.checkBody('email', 'This email is not valid!').isEmail();
  req.sanitizeBody('email').normalizeEmail({
    gmail_remove_dots: false,
    remove_extension: false,
    gmail_remove_subadress: false
  });
  req.checkBody('password', 'The password cannot be blank!').notEmpty();
  req.checkBody('confirmPassword', 'Confirmed passowrd cannot be blank!').notEmpty();
  req.checkBody('confirmPassword', 'Oops! Your passwords do not match.').equals(req.body.password);

  const errors = req.validationErrors();
  if (errors) {
    req.flash('error', errors.map(err => err.msg));
    res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
    return;
  }
  next();
};

exports.register = async (req, res, next) => {
  const user = new User({ email: req.body.email, username: req.body.username });
  const register = promisify(User.register, User);
  await register(user, req.body.password);
  next(); // Pass to authcontroller.login 
};

exports.account = (req, res) => {
  res.render('account', { title: 'Edit your account.' });
};

exports.updateAccount = async (req, res) => {
  const updates = {
    username: req.body.username,
    email: req.body.email,
    about: req.body.about
  };

  // Takes 3 things: query, updates, options.
  const user = await User.findOneAndUpdate(
    { _id: req.user._id },
    { $set: updates },
    { new: true, runValidators: true, context: 'query' }
  );
  req.flash('success', 'Updated the profile!');
  res.redirect('back');
};






