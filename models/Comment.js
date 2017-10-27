const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    trim: true,
    required: 'Comments cannot be blank'
  },
  created: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'No author supplied.'
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post',
    required: 'No post origin supplied.'
  }
});

function autopopulate(next) {
  this.populate('author');
  next();
}

commentSchema.pre('find', autopopulate);
commentSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('Comment', commentSchema);