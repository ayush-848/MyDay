const mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  dateSubscribed: {
    type: Date,
    default: Date.now
  },
  unsubscribeToken: {
    type: String
  }
});

module.exports = mongoose.model('Subscriber', SubscriberSchema);
