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

exports.getPosts = async (req, res) => {
  // 1. Query the DB for a list of all posts
  const posts = await Post.find();
  res.render('all', { title: 'All', posts });
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
  // User's likes
  let likes = req.user.likes.map(obj => obj.toString());
  console.log('_______________-')
  console.log(likes.length)
  // Pull it if already liked, addtoset allow to not add it again
  const operator = likes.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
    .findByIdAndUpdate(req.user._id,
      { [operator]: { likes: req.params.id } },
      { new: true }
    );
  likes = req.user.likes.map(obj => obj.toString());
  console.log(likes.length)
  const val = likes.includes(req.params.id) ? -1 : 1;
  const post = await Post
    .findByIdAndUpdate(req.params.id, 
      { $inc: { likesCount: val }}
    );

    // return user and post in res (res.data)
    res.json({user, post});
};

exports.getLikes = async (req, res) => {
  // $in let us search for an id the is in an array
  const posts = await Post.find({
    _id: { $in: req.user.likes }
  });
  //res.json(posts);
  res.render('all', { title: 'My Liked Posts.', posts })
};

exports.getTopPosts = async (req, res) => {
  const posts = await Post.getTopPosts();
  res.json(posts);
  // res.render('all', { posts, title: 'Top posts' });
};