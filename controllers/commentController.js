const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');

exports.addComment = async (req, res) => {
  req.body.author = req.user._id;
  req.body.post = req.params.id;
  const comment = await (new Comment(req.body)).save();
  res.redirect('back');
  // console.log(req.params.id);
};