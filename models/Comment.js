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
  },
  isPostComment: {
    type: Boolean,
    default: false
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Comment'
  },
  replies: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Comment'
    }
  ],
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

commentSchema.statics.getSortedParentComments = function(postId) {
  return this.aggregate([
    { $match: { $and: [ { post: postId }, { isPostComment: true } ] } },
    { $sort: { likesCount: -1 } }
  ]);
};

commentSchema.statics.getSortedChildComments = function(parentComment) {
  return this.aggregate([
    { $match: { parent: parentComment._id } },
    { $sort: { likesCount: -1 } }
  ]);
};

// commentSchema.statics.sortChildsByLikes = function(comments) {
  // Takes an array of parent comments 
  // Returns an array containing objects of post comments as keys and an array of its replies as value
  // Example: 
  // [
  //  {
  //     comment 1: [
  //       child comment,
  //       child comment
  //     ],
  //   }
  // ]
  
  // 1. 

  //   const parentCommentsArray = this.aggregate([

  //   ]);
  // });
// };

// commentSchema.pre('save', function(next) {
  // Find parent's parentCount, the new comment's parentCount is this number + 1 
  // const query = Comment.where({ parent: this.parent._id.toString() });
  // query.findOne(function (err, parent) {
  //   if (err) {
  //     console.log(err);
  //     next();
  //     return;
  //   }
  //   if (parent) {
  //     this.parentsCount = parent.parentsCount + 1;
  //   }
  // });

  // this.parentsCount = 
  // if (Object.keys(this.parent).length > 0) {
  //   this.parentsCount++; 
  // }
  // const query = Comment.where({ parent: { $not: { $size: 0 } } })
  // console.log(query);
  // let currentParent = this.parent;
  // let parentsCount = 0;
  // while (currentParent && parentsCount < 6) {
  //   parentsCount++;
  //   currentParent = currentParent.parent;
  // }
  // this.count = parentsCount;
  // next();
// });

commentSchema.pre('find', autopopulate);
commentSchema.pre('findOne', autopopulate);


module.exports = mongoose.model('Comment', commentSchema);