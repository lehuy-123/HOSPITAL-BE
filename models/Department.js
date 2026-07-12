import mongoose from 'mongoose';

const DepartmentSchema = new mongoose.Schema({
  deptId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  roomNumber: { type: String, required: true },
  queue: { type: [String], default: [] },
  currentTicketId: { type: String, default: null }
});

export default mongoose.model('Department', DepartmentSchema);
