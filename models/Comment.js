const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: 'No post origin supplied.'
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment'
  },
  slug: String,
  fullSlug: String,
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'No author supplied.'
  },
  text: {
    type: String,
    trim: true,
    required: 'Comments cannot be blank'
  },
  parentsCount: {
    type: Number,
    default: 0
  },
  likesCount: {
    type: Number,
    default: 0
  },
});

function autopopulate(next) {
  this.populate('author');
  next();
}

commentSchema.pre('find', autopopulate);
commentSchema.pre('findOne', autopopulate);


module.exports = mongoose.model('Comment', commentSchema);