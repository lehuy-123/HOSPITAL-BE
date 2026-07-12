import express from 'express';
import EmergencyChat from '../models/EmergencyChat.js';

const router = express.Router();

// Get all chat sessions (Admin/Staff view)
router.get('/all', async (req, res) => {
  try {
    const messages = await EmergencyChat.find({}).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching all chats:', error);
    res.status(500).json({ message: 'Lỗi server khi tải lịch sử chat' });
  }
});

// Get chat history for a specific ticket (Patient view)
router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const messages = await EmergencyChat.find({ ticketId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    console.error(`Error fetching chat for ${req.params.ticketId}:`, error);
    res.status(500).json({ message: 'Lỗi server khi tải lịch sử chat' });
  }
});


router.delete('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    await EmergencyChat.deleteMany({ ticketId });

    // Broadcast delete event via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency_chat_delete', { ticketId });
    }

    res.json({ message: 'Đã xóa phiên chat' });
  } catch (error) {
    console.error(`Error deleting chat for ${req.params.ticketId}:`, error);
    res.status(500).json({ message: 'Lỗi server khi xóa lịch sử chat' });
  }
});

export default router;
