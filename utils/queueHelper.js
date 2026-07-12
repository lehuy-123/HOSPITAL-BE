import Department from '../models/Department.js';
import Ticket from '../models/Ticket.js';

export async function joinDepartmentQueue(ticketId, deptId) {
  const dept = await Department.findOne({ deptId });
  if (!dept) return;

  if (!dept.currentTicketId && dept.queue.length === 0) {
    // Room is free
    await Department.findOneAndUpdate(
      { deptId },
      { $set: { currentTicketId: ticketId } }
    );
    await Ticket.findOneAndUpdate(
      { ticketId, 'routine.deptId': deptId },
      { $set: { 'routine.$.status': 'PROCESSING' } }
    );
  } else {
    // Join queue
    await Department.findOneAndUpdate(
      { deptId },
      { $push: { queue: ticketId } }
    );
  }
}

export async function completeAndPromote(deptId, ticketId) {
  const dept = await Department.findOne({ deptId });
  if (!dept) return;

  if (dept.currentTicketId === ticketId) {
    if (dept.queue.length > 0) {
      const nextTicketId = dept.queue[0];
      await Department.findOneAndUpdate(
        { deptId },
        {
          $pull: { queue: nextTicketId },
          $set: { currentTicketId: nextTicketId }
        }
      );
      await Ticket.findOneAndUpdate(
        { ticketId: nextTicketId, 'routine.deptId': deptId },
        { $set: { 'routine.$.status': 'PROCESSING' } }
      );
    } else {
      await Department.findOneAndUpdate(
        { deptId },
        { $set: { currentTicketId: null } }
      );
    }
  }
}
