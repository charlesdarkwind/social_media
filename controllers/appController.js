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
  const post = await Post.findOne({ _id: req.params.id }).populate('author');
  if (!post) return next();

  // Query all post's comments and apply initial sorting
  const comments = await Comment
  .find({ post: req.params.id })
  .sort({ 'parentsCount': 1, 'likesCount': -1, 'fullSlug': 1  });
  // .skip(pageNum * pageSize)
  // .limit(pageSize);

  // Sort comments in their final hierarchical order, like reddit.
  const maxParentsCount = comments[comments.length - 1].parentsCount;
  let count = 0;
  let finalTree;
  
  buildTree(comments);

  // Check comments in order of their parentsCount (0 means is root, not a child) 
  // and return all of its childs and put them directly after it.
  function buildTree(array) {
    const currentArray = []; 

    array.forEach(item => {
      if (item.parentsCount == count) { 
        // push item into currentArray
        currentArray.push(item);
        // find all of its childs 
        const re = new RegExp(`^${item.fullSlug}/`);
        const childs = comments.filter(comment => comment.parentsCount == count + 1 && re.test(comment.fullSlug));
        // push the childs
        currentArray.push(...childs);
      } else if (item.parentsCount < count) { // comment has already been checked for childs
        // push item into currentArray
        currentArray.push(item);
      }
    });
  
    // Check previous result array recursively 
    if (count < maxParentsCount) {
      count++;
      buildTree(currentArray);
    } else {
      finalTree = currentArray;
    }
  }

  res.render('postPage', { title: 'Post', post, comments: finalTree });
  // res.json(comments);
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
  // Current user's likes
  const likes = req.user.likes.map(obj => obj.toString());

  // Update user's likes 
  const operator = likes.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
  .findByIdAndUpdate(req.user._id,
    { 
      [operator]: { likes: req.params.id } 
    },
    { new: true }
  );

  // Update post's likesCount
  const val = likes.includes(req.params.id) ? -1 : 1;
  const post = await Post
  .findByIdAndUpdate(req.params.id, 
    { 
      $inc: { likesCount: val }, 
    },
    { new: true }
  );

  // Update user's Karma, current user can't vote his own posts
  const postAuthor = await User.findOneAndUpdate(
    { _id: post.author, _id: { $ne: user.id } }, 
    { $inc: { karma: val } }
  );
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

exports.getProfilePage = async (req, res) => {
  const userProfile = await User.findOne({ username: req.params.user });
  const userPosts = await Post.find({
    author: userProfile._id
  });

  res.render('profilePage', { title: `${userProfile.username}`, userProfile, userPosts });
};

