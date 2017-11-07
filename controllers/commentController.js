const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');

exports.addComment = async (req, res) => {
  req.body.author = req.user._id;
  req.body.post = req.params.id;
  req.body.isPostComment = true;

  const comment = await (new Comment(req.body)).save();
  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'commentsCount': 1 } }
  );
  res.redirect('back');
};

exports.addChildComment = async (req, res) => {
  req.body.author = req.user._id;
  req.body.post = req.params.postId;
  req.body.parent = req.params.parentCommentId;

  // 1. find parent and its parentCount
  const parent = await Comment.findById(req.params.parentCommentId);
  // 2. Save new Comment with the new parentCount
  req.body.parentsCount = parent.parentsCount + 1;
  const comment = await (new Comment(req.body)).save();
  // 3. Update parent replies, push the new comment
  await Comment.findByIdAndUpdate(
    req.params.parentCommentId, 
    { '$push': { 'replies': comment } },
    { new: true }
  );

  // Update the Post's Comment Count
  const post = await Post.findByIdAndUpdate(
    req.params.postId,
    { $inc: { 'commentsCount': 1 } }
  );

  res.redirect('back');
};

exports.likeComment = async (req, res) => {
  // User's liked comments
  const likes = req.user.likedComments.map(obj => obj.toString());

  // Pull it if already liked, addToSet allow to not add it again
  const operator = likes.includes(req.params.id) ? '$pull' : 'addToSet';

  const user = await User
  .findByIdAndUpdate(req.user.id,
  {
    [operator]: { likedComments: req.params.id }
  },
  { new: true }
  );

  const val = likedComments.includes(req.params.id) ? -1 : 1;

  // Update comment's total like count
  const comment = await Comment
  .findByIdAndUpdate(req.params.id, 
    { 
      $inc: { likesCount: val }, 
    },
    { new: true }
  );

  // Update user's Karma, current user can't vote his own comments
  const commentAuthor = await User.findByIdAndUpdate(
    { _id: comment.author, _id: { $ne: user.id } },
    { $inc: { karma: val } }
  );
  res.json({user, comment});
};