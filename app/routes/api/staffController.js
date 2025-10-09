export async function getStaff({ params }) {}
getStaff.mapping = '/api/staff/:id';
getStaff.method = 'GET';
getStaff.access = 'staff_manage';

export async function updateStaff({ params, body }) {}
updateStaff.mapping = '/api/staff/:id';
updateStaff.method = 'PUT';
updateStaff.access = 'staff_manage';

export async function deleteStaff({ id }) {}
deleteStaff.mapping = '/api/staff/:id';
deleteStaff.method = 'DELETE';
deleteStaff.access = 'staff_manage';

export async function addStaff({ body }) {}
addStaff.mapping = '/api/staff';
addStaff.method = 'POST';
addStaff.access = 'staff_manage';

export async function getStaffList({ query }) {}
getStaffList.mapping = '/api/staff';
getStaffList.method = 'GET';
getStaffList.access = 'staff_manage';

export async function updateStaffPosition({ params, body }) {}
updateStaffPosition.mapping = '/api/staff/:id/position';
updateStaffPosition.method = 'PUT';
updateStaffPosition.access = 'has(staff_manage, security)';
