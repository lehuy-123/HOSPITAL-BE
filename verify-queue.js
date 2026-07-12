import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ticket from './models/Ticket.js';
import Department from './models/Department.js';
import { DEPT_EXPANSION_MAP, seedDepartments } from './config/departmentsConfig.js';

dotenv.config();

// Atomic Room queue helpers replication
async function joinDepartmentQueue(ticketId, deptId) {
  const dept = await Department.findOne({ deptId });
  if (!dept) return;

  if (!dept.currentTicketId && dept.queue.length === 0) {
    await Department.findOneAndUpdate(
      { deptId },
      { $set: { currentTicketId: ticketId } }
    );
    await Ticket.findOneAndUpdate(
      { ticketId, 'routine.deptId': deptId },
      { $set: { 'routine.$.status': 'PROCESSING' } }
    );
    console.log(`- Patient ${ticketId} entered direct examination at ${deptId} (PROCESSING).`);
  } else {
    await Department.findOneAndUpdate(
      { deptId },
      { $push: { queue: ticketId } }
    );
    console.log(`- Patient ${ticketId} joined the queue at ${deptId}.`);
  }
}

async function completeAndPromote(deptId, ticketId) {
  console.log(`- Patient ${ticketId} left room ${deptId}. Vacating slot...`);
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
      console.log(`  * Auto-Promoted Patient ${nextTicketId} to active room slot (PROCESSING) at ${deptId}.`);
    } else {
      await Department.findOneAndUpdate(
        { deptId },
        { $set: { currentTicketId: null } }
      );
      console.log(`  * Room ${deptId} is now vacant (currentTicketId = null).`);
    }
  }
}

async function handleConfirmNext(ticketId) {
  const ticket = await Ticket.findOne({ ticketId });
  if (!ticket || ticket.status === 'COMPLETED') return;

  const currentDeptId = ticket.currentDeptId;
  const currentStepIndex = ticket.routine.findIndex(step => step.deptId === currentDeptId);
  if (currentStepIndex === -1) return;

  // Complete current room
  await Ticket.findOneAndUpdate(
    { ticketId, 'routine.deptId': currentDeptId },
    { $set: { 'routine.$.status': 'DONE' } }
  );
  await completeAndPromote(currentDeptId, ticketId);

  // Find next step
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
    await joinDepartmentQueue(ticketId, nextDeptId);
  } else {
    ticket.currentDeptId = null;
    ticket.status = 'COMPLETED';
    await ticket.save();
    console.log(`- Patient ${ticketId} finished all routing steps. Status: COMPLETED.`);
  }
}

async function runTest() {
  console.log('--- STARTING CLINICAL EXPANSION QUEUE INTEGRATION TEST ---');
  try {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Clear previous tests
    await Ticket.deleteMany({ phone: { $in: ['0900111222', '0900333444'] } });
    await Department.deleteMany({});

    console.log(`Seeding all ${seedDepartments.length} sub-rooms to establish authentic base state...`);
    await Department.insertMany(seedDepartments);

    // Test Scenario:
    // Nguyen Van A (KB-TEST01): wants KKB -> KNTM
    // Nguyen Van B (KB-TEST02): wants KKB
    const step1Name = 'KKB_HS';
    const step2Name = 'KKB_LS';
    const nextDeptStep1Name = 'KNTM_TN';

    console.log('\n[Scenario 1] Nguyen Van A registers KKB and KNTM...');
    const t1Id = 'KB-TEST01';
    const subRoute1 = [];
    ['KKB', 'KNTM'].forEach(id => subRoute1.push(...DEPT_EXPANSION_MAP[id]));

    let t1 = new Ticket({
      ticketId: t1Id,
      name: 'Nguyen Van A',
      phone: '0900111222',
      routine: subRoute1.map(d => ({ deptId: d, status: 'WAITED' })),
      currentDeptId: subRoute1[0],
      status: 'WAITING'
    });
    await t1.save();
    await joinDepartmentQueue(t1Id, subRoute1[0]); // Joins KKB_HS

    // Assert T1 goes straight to active
    let roomHS = await Department.findOne({ deptId: step1Name });
    if (roomHS.currentTicketId !== t1Id) throw new Error(`Patient 1 should be active in ${step1Name}!`);
    t1 = await Ticket.findOne({ ticketId: t1Id });
    if (t1.routine[0].status !== 'PROCESSING') throw new Error('Patient 1 step 1 should be PROCESSING!');
    console.log(`>>> Passed: Nguyen Van A went straight in ${step1Name}.`);

    console.log('\n[Scenario 2] Nguyen Van B registers KKB only...');
    const t2Id = 'KB-TEST02';
    const subRoute2 = [...DEPT_EXPANSION_MAP['KKB']];

    let t2 = new Ticket({
      ticketId: t2Id,
      name: 'Nguyen Van B',
      phone: '0900333444',
      routine: subRoute2.map(d => ({ deptId: d, status: 'WAITED' })),
      currentDeptId: subRoute2[0],
      status: 'WAITING'
    });
    await t2.save();
    await joinDepartmentQueue(t2Id, subRoute2[0]); // Joins KKB_HS

    // Assert T2 joins queue (not active since T1 is in it)
    roomHS = await Department.findOne({ deptId: step1Name });
    if (!roomHS.queue.includes(t2Id)) throw new Error(`Patient 2 should be queued at ${step1Name}!`);
    if (roomHS.currentTicketId === t2Id) throw new Error('Patient 2 should NOT enter active slot!');
    console.log(`>>> Passed: Nguyen Van B is waiting in ${step1Name} queue.`);

    console.log(`\n[Scenario 3] Nguyen Van A completes ${step1Name}...`);
    await handleConfirmNext(t1Id);

    // Nguyen Van A should be moved to KKB_LS (and be active there since KKB_LS is free)
    t1 = await Ticket.findOne({ ticketId: t1Id });
    if (t1.currentDeptId !== step2Name) throw new Error(`Nguyen Van A should have transitioned to ${step2Name}!`);
    let roomLS = await Department.findOne({ deptId: step2Name });
    if (roomLS.currentTicketId !== t1Id) throw new Error(`Nguyen Van A should be active in ${step2Name}!`);

    // Nguyen Van B should be auto-promoted in KKB_HS
    roomHS = await Department.findOne({ deptId: step1Name });
    if (roomHS.currentTicketId !== t2Id) throw new Error(`Nguyen Van B should be promoted to ${step1Name} active slot!`);
    t2 = await Ticket.findOne({ ticketId: t2Id });
    if (t2.routine[0].status !== 'PROCESSING') throw new Error('Nguyen Van B step 1 status should be PROCESSING!');
    console.log(`>>> Passed: Nguyen Van A transitioned; Nguyen Van B auto-promoted to ${step1Name}.`);

    console.log(`\n[Scenario 4] Nguyen Van B completes ${step1Name}...`);
    await handleConfirmNext(t2Id);

    // Nguyen Van B should move to KKB_LS, but since Nguyen Van A is currently active, B must wait in queue
    t2 = await Ticket.findOne({ ticketId: t2Id });
    if (t2.currentDeptId !== step2Name) throw new Error(`Nguyen Van B should trigger ${step2Name} transition!`);
    roomLS = await Department.findOne({ deptId: step2Name });
    if (!roomLS.queue.includes(t2Id)) throw new Error(`Nguyen Van B should be added to ${step2Name} queue!`);
    console.log(`>>> Passed: Nguyen Van B queued at ${step2Name} since Nguyen Van A is still in there.`);

    console.log(`\n[Scenario 5] Nguyen Van A completes all KKB sub-rooms...`);
    // Complete KKB_LS (index 1) -> moves to step 3 (KKB_CD)
    await handleConfirmNext(t1Id);
    // Complete KKB_CD (index 2) -> moves to step 4 (KKB_TV)
    await handleConfirmNext(t1Id);
    // Complete KKB_TV (index 3) -> moves to next department KNTM_TN
    await handleConfirmNext(t1Id);

    // A moves to KNTM_TN (active)
    t1 = await Ticket.findOne({ ticketId: t1Id });
    if (t1.currentDeptId !== nextDeptStep1Name) throw new Error(`Nguyen Van A should be at ${nextDeptStep1Name}!`);
    let roomN1 = await Department.findOne({ deptId: nextDeptStep1Name });
    if (roomN1.currentTicketId !== t1Id) throw new Error(`Nguyen Van A should be active at ${nextDeptStep1Name}!`);
    console.log(`>>> Passed: Nguyen Van A transitioned to KNTM; Current room active.`);

    // Cleanup collections
    await Ticket.deleteMany({ phone: { $in: ['0900111222', '0900333444'] } });
    
    // Restore clean room data by reseeding config
    await Department.deleteMany({});
    await Department.insertMany(seedDepartments);

    console.log('\n[SUCCESS] --- ALL CLINICAL EXPANSION SCENARIOS PASSED ---');
  } catch (err) {
    console.error('\n[FAIL] Test runtime error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
    process.exit(0);
  }
}

runTest();
