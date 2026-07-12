import express from 'express';
import Department from '../models/Department.js';
import Ticket from '../models/Ticket.js';
import { joinDepartmentQueue, completeAndPromote } from '../utils/queueHelper.js';
import { DEPARTMENTS_CONFIG } from '../config/departmentsConfig.js';

const router = express.Router();

// Helper to broadcast queue updates via WebSockets
const broadcastUpdate = (req) => {
  const io = req.app.get('io');
  if (io) {
    io.emit('queue-updated');
  }
};

// GET /api/departments/config - Get parent departments configuration list for intake setup
router.get('/config', (req, res) => {
  return res.json(DEPARTMENTS_CONFIG);
});

// GET /api/departments - Get all departments and their current queue/active patient info enriched
router.get('/', async (req, res) => {
  try {
    const departments = await Department.find();
    
    // Query active tickets including routine and symptoms
    const activeTickets = await Ticket.find({ status: { $ne: 'COMPLETED' } });
    const ticketMap = activeTickets.reduce((map, ticket) => {
      map[ticket.ticketId] = ticket.toObject();
      return map;
    }, {});

    // Map each department queue to details
    const enrichedDepartments = departments.map((dept) => {
      const deptObj = dept.toObject();
      deptObj.queueDetails = deptObj.queue.map(id => ({
        ticketId: id,
        name: ticketMap[id]?.name || 'Không rõ',
        phone: ticketMap[id]?.phone || ''
      }));
      if (deptObj.currentTicketId) {
        deptObj.currentTicketDetails = ticketMap[deptObj.currentTicketId] || {
          ticketId: deptObj.currentTicketId,
          name: 'Không rõ',
          phone: '',
          symptoms: '',
          routine: []
        };
      } else {
        deptObj.currentTicketDetails = null;
      }
      return deptObj;
    });

    return res.json(enrichedDepartments);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách phòng ban:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu phòng ban.' });
  }
});

// POST /api/departments/:deptId/call - Call next patient in queue (Doctor manual override)
router.post('/:deptId/call', async (req, res) => {
  try {
    const { deptId } = req.params;

    const department = await Department.findOne({ deptId });
    if (!department) {
      return res.status(404).json({ message: 'Phòng ban không tồn tại.' });
    }

    if (department.queue.length === 0) {
      return res.status(400).json({ message: 'Hàng đợi phòng khám hiện tại đang trống.' });
    }

    // Retrieve the first patient ticket ID in the queue
    const nextTicketId = department.queue[0];

    // Atomically pull the ID from queue and set as currentTicketId
    await Department.findOneAndUpdate(
      { deptId },
      {
        $pull: { queue: nextTicketId },
        $set: { currentTicketId: nextTicketId }
      }
    );

    // Update patient status in routine to PROCESSING
    await Ticket.findOneAndUpdate(
      { ticketId: nextTicketId, 'routine.deptId': deptId },
      { $set: { 'routine.$.status': 'PROCESSING' } }
    );

    broadcastUpdate(req);

    return res.json({ message: `Đã gọi bệnh nhân ${nextTicketId}.`, currentTicketId: nextTicketId });
  } catch (error) {
    console.error('Lỗi khi gọi bệnh nhân:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi gọi khám.' });
  }
});

// POST /api/departments/:deptId/complete - Complete current patient examination (Doctor)
router.post('/:deptId/complete', async (req, res) => {
  try {
    const { deptId } = req.params;

    const department = await Department.findOne({ deptId });
    if (!department) {
      return res.status(404).json({ message: 'Phòng ban không tồn tại.' });
    }

    const ticketId = department.currentTicketId;
    if (!ticketId) {
      return res.status(400).json({ message: 'Không có bệnh nhân nào đang được khám tại phòng này.' });
    }

    const ticket = await Ticket.findOne({ ticketId });
    if (!ticket) {
      return res.status(404).json({ message: 'Lỗi: Số khám không tồn tại.' });
    }

    // Set clinical step to DONE in the patient's record
    await Ticket.findOneAndUpdate(
      { ticketId, 'routine.deptId': deptId },
      { $set: { 'routine.$.status': 'DONE' } }
    );

    // Vacate current active patient and promote the next patient in the queue
    await completeAndPromote(deptId, ticketId);

    // Find next step in routine
    const currentStepIndex = ticket.routine.findIndex(step => step.deptId === deptId);
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

    return res.json({ message: 'Đã hoàn thành khám cho bệnh nhân.', ticketId });
  } catch (error) {
    console.error('Lỗi khi hoàn thành khám:', error);
    return res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật kết quả.' });
  }
});

export default router;
