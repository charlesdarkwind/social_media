const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
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
  },
  commentsCount: {
    type: Number,
    default: 0
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
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

postSchema.statics.getPosts = function(sort, time) {
  const sortOrder = sort == 'timeSincePosted' ? 1 : -1;
  return this.aggregate([
    // Lookup post and populate its author
    { $lookup: { from: 'users', localField: 'author', foreignField: '_id', as: 'author' } },
    { $unwind: "$author" },
    // Add a time from now field in hours
    { $addFields: { 
        timeSincePosted: {
          $divide: [
            { $subtract: [new Date(), "$created"] },
            60 * 60 * 1000
          ]
        }
      } 
    },
    // Filter for posts with less than specified hours old, default is infinity (MaxKey)
    { $match: { timeSincePosted: { $lte: time } } },
    // Add simple trending score field, condition: check if there is any likes or comments 
    { $addFields: 
      { trendingScore: 
        { $cond: [ 
            { $or: [ { $gt: [ "$likesCount", 0 ] }, { $gt: [ "$commentsCount", 0 ] } ] }, 
            { $divide: [
                { $add: [ { $multiply: [ "$likesCount", 2 ] }, "$commentsCount" ] },
                "$timeSincePosted"
              ]
            },
            0
          ]
        } 
      }        
    },
    { $sort: { [sort]: sortOrder } }
  ]);
};

module.exports = mongoose.model('Post', postSchema);