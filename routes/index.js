const express = require('express');
const router = express.Router();
const appController = require('../controllers/appController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const commentController = require('../controllers/commentController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(appController.getPosts));
router.get('/all', catchErrors(appController.getTopPosts));
router.get('/new', catchErrors(appController.getNewPosts));
router.get('/add', authController.isLoggedIn, appController.addPost);

router.post('/add',
  appController.upload,
  catchErrors(appController.resize), 
  catchErrors(appController.createPost)
);

// Update
router.post('/add/:id', 
  appController.upload,
  catchErrors(appController.resize), 
  catchErrors(appController.updatePost)
);

router.get('/p/:id', catchErrors(appController.getPostById));
router.get('/p/:id/edit', catchErrors(appController.editPost))

router.post('/p/:id/comment', catchErrors(commentController.addComment));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);

router.get('/register', userController.registerForm);

// 1. Validate the registration data
// 2. register the user
// 3. we need to log them in
router.post('/register', 
  userController.validateRegister,
  userController.register,
  authController.login
);

router.get('/logout', authController.logout);

router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token', 
  authController.confirmedPasswords, 
  catchErrors(authController.update)
);
router.get('/likes', authController.isLoggedIn, catchErrors(appController.getLikes));
router.get('/profile/:user', catchErrors(appController.getProfilePage));

/*
  API
*/

router.get('/api/search', catchErrors(appController.searchPosts));
router.post('/api/p/:id/like', catchErrors(appController.likePost));

module.exports = router;
