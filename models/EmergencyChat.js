import mongoose from 'mongoose';

const emergencyChatSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
    index: true
  },
  sender: {
    type: String, // 'PATIENT' or 'STAFF'
    required: true
  },
  text: {
    type: String
  },
  isPhoto: {
    type: Boolean,
    default: false
  },
  photoUrl: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 43200 // 12 hours = 12 * 60 * 60 = 43200 seconds TTL index
  }
});

const EmergencyChat = mongoose.model('EmergencyChat', emergencyChatSchema);
export default EmergencyChat;
