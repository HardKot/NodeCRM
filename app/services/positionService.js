export async function createPatient(db, patient) {
  return db.get('position').insert(patient).write();
}

export async function updatePatient(db, id, updates) {
  return db.get('position').find({ id }).assign(updates).write();
}

export async function deletePatient(db, id) {
  return db.get('position').remove({ id }).write();
}

export async function getPatientById(db, id) {
  return db.get('position').find({ id }).value();
}

export async function listPatients(db, filter = {}) {
  return db.get('position').filter(filter).value();
}
