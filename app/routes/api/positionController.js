export async function getPosition({ params }) {}
getPosition.mapping = '/api/position/:id';
getPosition.method = 'GET';
getPosition.access = 'position_manage';

export async function updatePosition({ params, body }) {}
updatePosition.mapping = '/api/position/:id';
updatePosition.method = 'PUT';
updatePosition.access = 'position_manage';

export async function deletePosition({ id }) {}
deletePosition.mapping = '/api/position/:id';
deletePosition.method = 'DELETE';
deletePosition.access = 'position_manage';

export async function addPosition({ body }) {}
addPosition.mapping = '/api/position';
addPosition.method = 'POST';
addPosition.access = 'position_manage';
