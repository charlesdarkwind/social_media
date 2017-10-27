const mongoose = require('mongoose');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const Comment = mongoose.model('Comment');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

exports.homePage = (req, res) => {
  res.render('index');
};

exports.addPost = (req, res) => {
  res.render('editPost', { title: 'Add Post' });
};

exports.upload = multer(multerOptions).single('image');

exports.resize = async (req, res, next) => {
  // check if there is no file to resize
  if (!req.file) {
    next();
    return;
  }
  // Get extension
  const extension = req.file.mimetype.split('/')[1];
  // create unique name
  req.body.image = `${uuid.v4()}.${extension}`;
  // Now we resize
  const image = await jimp.read(req.file.buffer);
  await image.resize(800, jimp.AUTO);
  await image.write(`./public/uploads/${req.body.image}`);
  // Once we have wrtitten the photo to our filesystem, keep going!
  next();
};

exports.createPost = async (req, res) => {
  req.body.author = req.user._id;
  const post = await (new Post(req.body)).save();
  res.redirect(`/p/${post._id}`);
};

const confirmOwner = (post, user) => {
  if (!post.author.equals(user._id)) {
    throw Error('You must be the author in order to edit it!');
  }
};

exports.editPost = async (req, res) => {
  // 1. Find the post given the ID
  const post = await Post.findOne({ _id: req.params.id });
  // 2. Confirm they are the owner of the post
  confirmOwner(post, req.user);
  // 3. Render out the edit form so the user can update
  res.render('editPost', { title: 'Edit post', post });
};  

exports.updatePost = async (req, res) => {
  // Find and update the post
  const post = await Post.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // Return the new post instead of the old one
    runValidators: true
  }).exec();
  req.flash('success', `Post successfully updated! <a href="/p/${post._id}">View Post.</a>`);
  res.redirect(`/p/${post._id}/edit`);
};

exports.getPostById = async (req, res, next) => {
  // Call populate at the end to populate the data from the related field 'author'
  const post = await Post.findOne({ _id: req.params.id }).populate('author comments');
  if (!post) return next();
  res.render('postPage', { title: 'Post', post });
};

exports.searchPosts = async (req, res) => {
  // check doc on mongob $text serach index
  const posts = await Post.find({
    $text: {
      $search: req.query.q
    }
  }, {
    score: { $meta: 'textScore' }
  })
  .sort({
    score: { $meta: 'textScore' }
  })
  .limit(5);
  res.json(posts);
};

exports.likePost = async (req, res) => {

  // Voting user's likes
  const likes = req.user.likes.map(obj => obj.toString());

  // Pull it if already liked, addtoset allow to not add it again
  const operator = likes.includes(req.params.id) ? '$pull' : '$addToSet';

  const user = await User
    .findByIdAndUpdate(req.user._id,
      { 
        [operator]: { likes: req.params.id } 
      },
      { new: true }
    );

  const val = likes.includes(req.params.id) ? -1 : 1;

  // For trending, (== to scrap ==)
  // Update post's total likesCount & datesOfLikes array (schema adds date.now)
  const post = await Post
    .findByIdAndUpdate(req.params.id, 
      { 
        $inc: { likesCount: val }, 
        [operator]: { 
          datesOfLikes: {
            author: req.user._id
          }  
        }
      },
      { new: true }
    );

  // Karma
  const postAuthor = await User.findOneAndUpdate(
    { _id: post.author, _id: { $ne: user.id } }, 
    { $inc: { karma: val } 
  });

    res.json({user, post});
};

exports.getLikes = async (req, res) => {
  // $in let us search for an id the is in an array
  const posts = await Post.find({
    _id: { $in: req.user.likes }
  });
  res.render('all', { title: 'My Liked Posts.', posts });
};

const checkQuery = async (query, res, modelFieldName, title) => {
  const time = parseInt(query.time) || 500000; 
  let sort = modelFieldName;
  if (Object.keys(query).length) sort = query.sort == 'trending' ? 'trendingScore' : modelFieldName;

  const posts = await Post.getPosts(sort, time);
  res.render('all', { posts, title });
};

exports.getTrending = async (req, res) => {
  checkQuery(req.query, res, 'trendingScore', 'Trending');
};

exports.getTopPosts = async (req, res) => {
  checkQuery(req.query, res, 'likesCount', 'Top');
};

exports.getNewPosts = async (req, res) => {
  checkQuery(req.query, res, 'timeSincePosted', 'New');
};

exports.getPosts = async (req, res) => {

  let sort;
  if (req.query.length) {
    sort = req.query.sort;
  } else {
    sort = 'trending';
  }
  // const sort = req.query.length ? req.query.sort : 'trending';
  const time = req.query.time || 168;

  const posts = await Post.getPosts(sort, time);
  res.json(posts);
  // title = query.sort
  // res.render('all', { posts, title: 'New Posts' });
};

exports.getProfilePage = async (req, res) => {
  const userProfile = await User.findOne({ username: req.params.user });
  const userPosts = await Post.find({
    author: userProfile._id
  });

  res.render('profilePage', { title: `${userProfile.username}`, userProfile, userPosts });
};

