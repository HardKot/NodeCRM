export async function getPatient({ params }) {}
getPatient.mapping = '/api/patient/:id';
getPatient.method = 'GET';
getPatient.access = 'patient_manage';

export async function updatePatient({ params, body }) {}
updatePatient.mapping = '/api/patient/:id';
updatePatient.method = 'PUT';
updatePatient.access = 'patient_manage';

export async function deletePatient({ id }) {}
deletePatient.mapping = '/api/patient/:id';
deletePatient.method = 'DELETE';
deletePatient.access = 'patient_manage';

export async function addPatient({ body }) {}
addPatient.mapping = '/api/patient';
addPatient.method = 'POST';
addPatient.access = 'patient_manage';
