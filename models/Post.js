const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');
const getVideoId = require('get-video-id');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    maxlength: 70,
    required: 'Please enter a title!'
  },
  text: {
    type: String,
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  urlId: String,
  service: String,
  created: {
    type: Date,
    default: Date.now
  },
  image: String,
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: 'You must supply an author!'
  },
  likesCount: {
    type: Number,
    default: 0
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// find comments where the post field's id is same as the post id
postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post'
});

// Define our indexes
postSchema.index({
  title: 'text',
  text: 'text'
});

postSchema.pre('save', function(next) {
  if (!this.isModified('title')) {
    next(); // skip it
    return; // stop this function from running
  };
  this.service = this.url ? getVideoId(this.url).service : '';
  this.urlId = this.url ? getVideoId(this.url).id : '';
  next();
});

postSchema.pre('find', autopopulate);
postSchema.pre('findOne', autopopulate);

function autopopulate(next) {
  this.populate('author');
  next();
};

postSchema.statics.getTopPosts = function() {
  return this.aggregate([
    // Lookup posts and populate their comments
    // 'fom:' mondgb takes the model and lower cases it and adds an 's'
    { $lookup: {from: 'comments', localField: '_id', foreignField: 'post', as: 'comments'} },
    // Filter for only items that have 1 or more likes
    //{ $match:  }

  ]);
};

module.exports = mongoose.model('Post', postSchema);