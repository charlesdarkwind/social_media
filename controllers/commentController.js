const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');

exports.addComment = async (req, res) => {
  req.body.author = req.user._id;
  req.body.post = req.params.id;
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

  const comment = await (new Comment(req.body)).save();
  const parent = await Comment.findByIdAndUpdate(
    req.params.parentCommentId, 
    { '$push': { 'childComments': comment } },
    { new: true }
  );
  const post = await Post.findByIdAndUpdate(
    req.params.postId,
    { $inc: { 'commentsCount': 1 } }
  );
  res.redirect('back');
};