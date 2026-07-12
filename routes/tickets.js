import express from 'express';
import Ticket from '../models/Ticket.js';
import { joinDepartmentQueue, completeAndPromote } from '../utils/queueHelper.js';
import { DEPT_EXPANSION_MAP } from '../config/departmentsConfig.js';

const router = express.Router();

// Helper to broadcast queue updates via WebSockets
const broadcastUpdate = (req) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('queue-updated');
  }
};

// GET /api/tickets/pending - Fetch pending triage tickets
router.get('/pending', async (req, res) => {
  try {
    const pendingTickets = await Ticket.find({ status: 'PENDING_TRIAGE' }).sort({ createdAt: 1 });
    res.json(pendingTickets);
  } catch (error) {
    console.error('Error fetching pending tickets:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tickets/pre-register - Patient pre-registration
router.post('/pre-register', async (req, res) => {
  try {
    const { name, phone, symptoms, gender, dob, address, insurance, medicalHistory } = req.body;
    if (!name || !phone) return res.status(400).json({ message: 'Thiếu thông tin đăng ký bắt buộc.' });
    
    // Generate sequential ticket ID carefully handling concurrency if needed
    const lastTicket = await Ticket.findOne({ ticketId: { $regex: /^KB-/ } }).sort({ ticketId: -1 });
    let nextNum = 1;
    if (lastTicket && lastTicket.ticketId.startsWith('KB-')) {
      const lastNum = parseInt(lastTicket.ticketId.replace('KB-', ''), 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const ticketId = `KB-${String(nextNum).padStart(3, '0')}`;

    const newTicket = new Ticket({
      ticketId,
      name,
      phone,
      symptoms: symptoms || '',
      gender: gender || '',
      dob: dob || '',
      address: address || '',
      insurance: insurance || '',
      medicalHistory: medicalHistory || '',
      routine: [],
      currentDeptId: null,
      status: 'PENDING_TRIAGE'
    });

    await newTicket.save();

    const io = req.app.get('io');
    if (io) io.emit('new_pre_registration', newTicket);

    res.status(201).json(newTicket);
  } catch (error) {
     console.error('Lỗi pre-register:', error);
     res.status(500).json({ message: 'Lỗi server khi đăng ký trước.' });
  }
});

// PUT /api/tickets/:ticketId/approve - Staff appoving routine
router.put('/:ticketId/approve', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { routineDeptIds } = req.body;

    if (!routineDeptIds || !Array.isArray(routineDeptIds) || routineDeptIds.length === 0) {
      return res.status(400).json({ message: 'Thiếu lộ trình khoa phòng.' });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket || ticket.status !== 'PENDING_TRIAGE') {
      return res.status(404).json({ message: 'Ticket không hợp lệ hoặc đã được xử lý.' });
    }

    // Expand main departments to sub-rooms
    const expandedDeptIds = [];
    routineDeptIds.forEach((id) => {
      const subRooms = DEPT_EXPANSION_MAP[id];
      if (subRooms) {
        expandedDeptIds.push(...subRooms);
      } else {
        expandedDeptIds.push(id);
      }
    });

    if (!expandedDeptIds.includes('K_PHARMACY_RX')) expandedDeptIds.push('K_PHARMACY_RX');

    const routine = expandedDeptIds.map((deptId) => ({ deptId, status: 'WAITED' }));
    
    ticket.routine = routine;
    ticket.currentDeptId = expandedDeptIds[0];
    ticket.status = 'WAITING';
    
    await ticket.save();

    await joinDepartmentQueue(ticket.ticketId, ticket.currentDeptId);

    broadcastUpdate(req);
    const io = req.app.get('io');
    if (io) {
      io.emit('ticket_approved', ticket);
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Lỗi approve:', error);
    res.status(500).json({ message: 'Lỗi server khi phân tuyến.' });
  }
});

// POST /api/tickets - Register new patient ticket (Intake Staff)
router.post('/', async (req, res) => {
  try {
    const { name, phone, symptoms, gender, dob, address, insurance, medicalHistory, routineDeptIds } = req.body;

    if (!name || !phone || !routineDeptIds || !Array.isArray(routineDeptIds) || routineDeptIds.length === 0) {
      return res.status(400).json({ message: 'Thiếu thông tin đăng ký bắt buộc hoặc lộ trình trống.' });
    }

    // Generate ticket ID sequentially: KB-001, KB-002, etc.
    const lastTicket = await Ticket.findOne().sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastTicket && lastTicket.ticketId.startsWith('KB-')) {
      const lastNum = parseInt(lastTicket.ticketId.replace('KB-', ''), 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const ticketId = `KB-${String(nextNum).padStart(3, '0')}`;

    // Expand main departments to sub-rooms
    const expandedDeptIds = [];
    routineDeptIds.forEach((id) => {
      const subRooms = DEPT_EXPANSION_MAP[id];
      if (subRooms) {
        expandedDeptIds.push(...subRooms);
      } else {
        expandedDeptIds.push(id); // fallback if it's already a sub-room ID
      }
    });

    // Final universal step for all patients to collect medicinal prescriptions before exiting
    if (!expandedDeptIds.includes('K_PHARMACY_RX')) {
       expandedDeptIds.push('K_PHARMACY_RX');
    }

    if (expandedDeptIds.length === 0) {
      return res.status(400).json({ message: 'Lộ trình sau khi phân tách trống.' });
    }

    // Create routine structure
    const routine = expandedDeptIds.map((deptId) => ({
      deptId,
      status: 'WAITED'
    }));

    const firstDeptId = expandedDeptIds[0];

    const newTicket = new Ticket({
      ticketId,
      name,
      phone,
      symptoms: symptoms || '',
      gender: gender || '',
      dob: dob || '',
      address: address || '',
      insurance: insurance || '',
      medicalHistory: medicalHistory || '',
      routine,
      currentDeptId: firstDeptId,
      status: 'WAITING'
    });

    await newTicket.save();

    // Push patient ID to the first department's queue
    await joinDepartmentQueue(ticketId, firstDeptId);

    // Broadcast queue sync to all clients
    broadcastUpdate(req);

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error('Lỗi khi đăng ký bệnh nhân:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tạo số khám.' });
  }
});

// GET /api/tickets/track/:searchQuery - Track patient queue status by phone number or Ticket ID
router.get('/track/:searchQuery', async (req, res) => {
  try {
    const { searchQuery } = req.params;

    const tickets = await Ticket.find({
      $or: [
        { ticketId: searchQuery.toUpperCase() },
        { phone: searchQuery }
      ]
    }).sort({ createdAt: -1 });

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin bệnh nhân tương ứng.' });
    }

    return res.json(tickets);
  } catch (error) {
    console.error('Lỗi khi tra cứu bệnh nhân:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi tra cứu.' });
  }
});

// POST /api/tickets/:ticketId/confirm-next - Patient Self-Confirm
router.post('/:ticketId/confirm-next', async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: 'Lỗi: Số khám không tồn tại.' });
    }

    const currDeptId = ticket.currentDeptId;
    if (!currDeptId) {
      return res.status(400).json({ message: 'Lỗi: Bệnh nhân đã hoàn thành lộ trình khám.' });
    }

    // Set clinical step to DONE
    await Ticket.findOneAndUpdate(
      { ticketId, 'routine.deptId': currDeptId },
      { $set: { 'routine.$.status': 'DONE' } }
    );

    // Vacate current active patient and promote the next patient in the queue
    await completeAndPromote(currDeptId, ticketId);

    // Find next step in routine
    const currentStepIndex = ticket.routine.findIndex(step => step.deptId === currDeptId);
    let nextStepIndex = -1;
    for (let i = currentStepIndex + 1; i < ticket.routine.length; i++) {
      if (ticket.routine[i].status === 'WAITED') {
        nextStepIndex = i;
        break;
      }
    }

    if (nextStepIndex !== -1) {
      const nextDeptId = ticket.routine[nextStepIndex].deptId;
      ticket.currentDeptId = nextDeptId;
      await ticket.save();

      // Push into the next department's queue
      await joinDepartmentQueue(ticketId, nextDeptId);
    } else {
      // Completed all clinic paths
      ticket.currentDeptId = null;
      ticket.status = 'COMPLETED';
      await ticket.save();
    }

    broadcastUpdate(req);

    return res.json({ message: 'Đã hoàn tất bước khám và chuyển tiếp thành công.' });
  } catch (error) {
    console.error('Lỗi khi tự xác nhận hoàn thành khám:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật kết quả.' });
  }
});

export default router;
