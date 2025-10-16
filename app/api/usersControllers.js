async function get(req, res) {
  res.json({ message: 'GET request to /api/users' });
}

get.access = 'public';

module.exports = {
  get,
};
