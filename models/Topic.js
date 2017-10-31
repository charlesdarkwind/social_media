const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const topicSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  post: {
    type: mongoose.Schema.ObjectId,
    ref: 'Post'
  },
  comment: String,
  children: {
    type: [{
      mongoose.Schema.ObjectId,
      ref: 'Comment'
    }],
    default: []
  }
});