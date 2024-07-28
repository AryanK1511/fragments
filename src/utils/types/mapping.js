// Define a dictionary containing the content type associates with a particular extension
module.exports.TYPES_MAPPING = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.yaml': 'application/yaml',
  '.yml': 'application/yaml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

module.exports.CHARSET_TYPES = ['text/plain', 'text/html', 'text/css', 'application/json'];
