const mongoose = require('mongoose');
const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');
const User = mongoose.model('User');
const crypto = require('crypto');

exports.addComment = async (req, res) => {
  req.body.author = req.user._id;
  req.body.post = req.params.postId;
  const created = Date.now();
  req.body.created = created;

  // If it has a parent or not
  let parent;
  if (req.params.parentId == 'rootComment') { 
    req.body.parent = null;
    parent = null;
  } else { 
    req.body.parent = req.params.parentId;
    parent = await Comment.findById(req.params.parentId);
    req.body.parentsCount = parent.parentsCount + 1;
  }

  // Generate the unique portions of the slug and fullSlug
  const slugPart = crypto.randomBytes(2).toString('hex');
  const fullSlugPart = `${created}:${slugPart}`;

  if (parent) {
    req.body.slug = `${parent.slug}/${slugPart}`;
    req.body.fullSlug = `${parent.fullSlug}/${fullSlugPart}`
  } else {
    req.body.slug = slugPart;
    req.body.fullSlug = fullSlugPart;
  }

  const comment = await (new Comment(req.body)).save();
  
  res.redirect('back');

  // Update post's commentCount
  await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: { 'commentsCount': 1 } }
  );
};

exports.likeComment = async (req, res) => {
  // Current user's liked comments
  const likedComments = req.user.likedComments.map(obj => obj.toString());

  // Update user's likedComments
  const operator = likedComments.includes(req.params.id) ? '$pull' : '$addToSet';
  const user = await User
  .findByIdAndUpdate(req.user.id,
    {
      [operator]: { likedComments: req.params.id }
    },
    { new: true }
  );  

  // Update comment's likeCount
  const val = likedComments.includes(req.params.id) ? -1 : 1;
  const comment = await Comment
  .findByIdAndUpdate(req.params.id, 
    { 
      $inc: { likesCount: val }, 
    },
    { new: true }
  );

  res.json({ comment });

  // Update author's Karma
  const author = await User.findOneAndUpdate(
    { _id: comment.author, _id: { $ne: user.id } },
    { $inc: { karma: val } }
  );
};