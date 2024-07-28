const { randomUUID } = require('crypto');
const contentType = require('content-type');
const {
  listFragments,
  writeFragment,
  writeFragmentData,
  readFragment,
  readFragmentData,
  deleteFragment,
} = require('./data');

// ===== FRAGMENT CLASS =====
class Fragment {
  // Define a dictionary of convertible types
  static #CONVERSIONS = {
    'text/plain': ['text/plain'],
    'text/markdown': ['text/markdown', 'text/html', 'text/plain'],
    'text/html': ['text/html', 'text/plain'],
    'text/csv': ['text/csv', 'text/plain', 'application/json'],
    'application/json': ['application/json', 'application/yaml', 'text/plain'],
    'application/yaml': ['application/yaml', 'text/plain'],
    'image/png': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/jpeg': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/webp': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/avif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
    'image/gif': ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'],
  };

  // Fragment class constructor
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    // Make sure owner ID and type are required
    if (!ownerId || !type) {
      throw new Error('Owner Id and type are required');
    }

    // Make sure the type is valid
    if (!Fragment.isSupportedType(type)) {
      throw new Error(`Invalid Type: ${type}`);
    }

    // Size should be >= 0 and a number
    if (typeof size !== 'number' || size < 0) {
      throw new Error('Size should be a number which is >= 0');
    }

    // The fragment should get a created and updated datetimestring by default
    const datetime = new Date().toISOString();

    // Assign the properties to the object
    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.created = created;
    this.updated = updated;
    this.type = type;
    this.size = size;
    this.created = created || datetime;
    this.updated = updated || datetime;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    let userFragments = await listFragments(ownerId, expand);
    return userFragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (!fragment) {
      throw new Error('Fragment does not exist');
    }
    return fragment;
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  async getData() {
    return await readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Invalid Data. Data is not a buffer');
    }
    this.updated = new Date().toISOString();
    this.size = data.length;
    await writeFragmentData(this.ownerId, this.id, data);
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    const type = this.mimeType;
    return type.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    return Fragment.#CONVERSIONS[contentType.parse(this.type).type];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    // Parse the value
    let parsedValue = contentType.parse(value);
    return Object.keys(Fragment.#CONVERSIONS).includes(parsedValue.type);
  }
}

module.exports.Fragment = Fragment;
