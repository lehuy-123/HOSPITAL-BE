import mongoose from 'mongoose';

const RoutineStepSchema = new mongoose.Schema({
  deptId: { type: String, required: true },
  status: { type: String, enum: ['WAITED', 'PROCESSING', 'DONE'], default: 'WAITED' }
}, { _id: false });

const TicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true, index: true },
  symptoms: { type: String, default: '' },
  gender: { type: String, default: '' },
  dob: { type: String, default: '' },
  address: { type: String, default: '' },
  insurance: { type: String, default: '' },
  medicalHistory: { type: String, default: '' },
  routine: { type: [RoutineStepSchema], default: [] },
  currentDeptId: { type: String, default: null },
  status: { type: String, enum: ['PENDING_TRIAGE', 'WAITING', 'COMPLETED'], default: 'WAITING' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Ticket', TicketSchema);
