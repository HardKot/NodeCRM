export async function getPatientById(db, id) {
  return db.get('patient').find({ id }).value();
}

export async function updatePatient(db, id, updates) {
  return db.get('patient').find({ id }).assign(updates).write();
}

export async function deletePatient(db, id) {
  return db.get('patient').remove({ id }).write();
}

export async function createPatient(db, patientData) {
  return db.get('patient').insert(patientData).write();
}

export async function listPatients(db, filter = {}) {
  return db.get('patient').filter(filter).value();
}
