export async function getStaffById(db, id) {
  return db.get('staff').find({ id }).value();
}

export async function updateStaff(db, id, updates) {
  updates.position = null;

  return db.get('staff').find({ id }).assign(updates).write();
}

export async function deleteStaff(db, id) {
  return db.get('staff').remove({ id }).write();
}

export async function createStaff(db, staffData) {
  staffData.position = null;

  return db.get('staff').insert(staffData).write();
}

export async function listStaffs(db, filter = {}) {
  return db.get('staff').filter(filter).value();
}

export async function updateStaffPosition(db, staffId, positionId) {
  return db.get('staff').find({ id: staffId }).assign({ position: positionId }).write();
}
