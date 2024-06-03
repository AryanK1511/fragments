const {
  writeFragment,
  readFragment,
  listFragments,
  writeFragmentData,
  readFragmentData,
  deleteFragment,
} = require('../../src/model/data/memory');
const { Fragment } = require('../../src/model/fragment');

describe('memory module', () => {
  let fragment;

  // Create a new database instance before running each test
  beforeEach(() => {
    fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 3 });
  });

  describe('writeFragment(fragment)', () => {
    test("Writes a fragment's metadata to the DB and does not return anything", async () => {
      const result = await writeFragment(fragment);
      expect(result).toBe(undefined);
    });

    test('Throws an error when the owner ID is not a string', async () => {
      let erroneousFragment = new Fragment({ ownerId: 1234, type: 'text/plain', size: 3 });
      expect(async () => await writeFragment(erroneousFragment)).rejects.toThrow();
    });

    test('Throws an error when the fragment ID is not a string', async () => {
      let erroneousFragment = new Fragment({
        id: 123,
        ownerId: '1234',
        type: 'text/plain',
        size: 3,
      });
      expect(async () => await writeFragment(erroneousFragment)).rejects.toThrow();
    });
  });

  describe('readFragment(ownerId, id)', () => {
    test("Gets a fragment's metadata from memory db", async () => {
      // Write to the DB
      await writeFragment(fragment);

      // Fetch from the DB
      const readResult = await readFragment(fragment.ownerId, fragment.id);
      expect(readResult).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          ownerId: expect.any(String),
          created: expect.any(String),
          updated: expect.any(String),
          type: expect.any(String),
          size: expect.any(Number),
        })
      );
    });

    test('Throws an error if the owner ID is not a string', async () => {
      await writeFragment(fragment);
      expect(async () => await readFragment(1234, fragment.id)).rejects.toThrow();
    });

    test('Throws an error if the fragment ID is not a string', async () => {
      await writeFragment(fragment);
      expect(async () => await readFragment('1234', undefined)).rejects.toThrow();
    });

    test('Returns undefined when an invalid owner ID is passed', async () => {
      await writeFragment(fragment);
      const result = await readFragment('123', fragment.id);
      expect(result).toBe(undefined);
    });

    test('Returns undefined when an invalid fragment ID is passed', async () => {
      await writeFragment(fragment);
      const result = await readFragment('1234', 'abc');
      expect(result).toBe(undefined);
    });
  });

  describe('writeFragmentData(ownerId, id, buffer)', () => {
    test("Writes the data of a fragment to the DB and doesn't return anything", async () => {
      const data = Buffer.from([1, 2, 3]);
      const writeResult = await writeFragmentData(fragment.ownerId, fragment.id, data);
      expect(writeResult).toBe(undefined);
    });

    test('Throws an error if the owner ID is not a string', async () => {
      const data = Buffer.from([1, 2, 3]);
      expect(async () => await writeFragmentData(1234, fragment.id, data)).rejects.toThrow();
    });

    test('Throws an error if the fragment ID is not a string', async () => {
      const data = Buffer.from([1, 2, 3]);
      expect(async () => await writeFragmentData('1234', undefined, data)).rejects.toThrow();
    });
  });

  describe('readFragmentData(ownerId, id)', () => {
    test('readFragmentData(ownerId, id) reads a fragment from the DB', async () => {
      // Write to the DB
      const data = Buffer.from([1, 2, 3]);
      await writeFragmentData(fragment.ownerId, fragment.id, data);

      // Fetch from the DB
      const readResult = await readFragmentData(fragment.ownerId, fragment.id);
      expect(readResult).toEqual(data);
    });

    test('Throws an error if the owner ID is not a string', async () => {
      await writeFragment(fragment);
      expect(async () => await readFragment(1234, fragment.id)).rejects.toThrow();
    });

    test('Throws an error if the fragment ID is not a string', async () => {
      await writeFragment(fragment);
      expect(async () => await readFragment('1234', undefined)).rejects.toThrow();
    });

    test('Returns undefined when an invalid owner ID is passed', async () => {
      await writeFragment(fragment);
      const result = await readFragment('123', fragment.id);
      expect(result).toBe(undefined);
    });

    test('Returns undefined when an invalid fragment ID is passed', async () => {
      await writeFragment(fragment);
      const result = await readFragment('1234', 'abc');
      expect(result).toBe(undefined);
    });
  });

  describe('listFragments(ownerId, expand)', () => {
    test('Returns a list of fragment IDs for the given user when not expanded', async () => {
      // Write fragment to DB
      await writeFragment(fragment, false);

      // Pull frgament list from DB
      const fragmentsList = await listFragments(fragment.ownerId);

      // Check if the result is an array
      expect(Array.isArray(fragmentsList)).toBe(true);

      // Check if the result is an array of strings
      expect(fragmentsList).toBeInstanceOf(Array);
      fragmentsList.forEach((item) => {
        expect(typeof item).toBe('string');
      });
    });

    test('Returns a list of fragment IDs for the given user when not expanded and the expand parameter is not passed', async () => {
      // Write fragment to DB
      await writeFragment(fragment);

      // Pull frgament list from DB
      const fragmentsList = await listFragments(fragment.ownerId);

      // Check if the result is an array
      expect(Array.isArray(fragmentsList)).toBe(true);

      // Check if the result is an array of strings
      expect(fragmentsList).toBeInstanceOf(Array);
      fragmentsList.forEach((item) => {
        expect(typeof item).toBe('string');
      });
    });

    test('Returns a list of fragments for the given user when expanded', async () => {
      // Write fragment to DB
      await writeFragment(fragment);

      // Pull frgament list from DB
      const fragmentsList = await listFragments(fragment.ownerId, true);

      // Check if the result is an array
      expect(Array.isArray(fragmentsList)).toBe(true);

      // Check if the result is an array of strings
      expect(fragmentsList).toBeInstanceOf(Array);
      fragmentsList.forEach((item) => {
        expect(typeof item).toBe('object');
      });
    });

    test('Returns an empty array when an invalid owner ID is passed', async () => {
      await writeFragment(fragment);
      const fragmentsList = await listFragments('123', true);
      expect(fragmentsList).toEqual([]);
    });

    test('Throws an error if the owner ID is not a string', async () => {
      await writeFragment(fragment);
      expect(async () => await listFragments(123, true)).rejects.toThrow();
    });
  });

  describe('deleteFragment(ownerId, id)', () => {
    test('Deletes a fragments data and metadata from the DB', async () => {
      // Write a fragment and its metadata to the DB
      await writeFragment(fragment);
      await writeFragmentData(fragment.ownerId, fragment.id, Buffer.from([1, 2, 3]));

      // Delete the fragment and its metadata from the DB
      const deletionResult = await deleteFragment(fragment.ownerId, fragment.id);
      expect(deletionResult).toEqual([undefined, undefined]);
    });

    test('Throws an error if the owner ID is not a string', async () => {
      await writeFragment(fragment);
      expect(async () => await deleteFragment(1234, fragment.id)).rejects.toThrow();
    });

    test('Throws an error if the fragment ID is not a string', async () => {
      await writeFragment(fragment);
      expect(async () => await deleteFragment(fragment.ownerId, undefined)).rejects.toThrow();
    });

    test("Throws an error if the fragment ID doesn't exist", async () => {
      await writeFragment(fragment);
      expect(async () => await deleteFragment(fragment.ownerId, '123')).rejects.toThrow();
    });

    test("Throws an error if the owner ID doesn't exist", async () => {
      await writeFragment(fragment);
      expect(async () => await deleteFragment('123456', fragment.id)).rejects.toThrow();
    });
  });
});
