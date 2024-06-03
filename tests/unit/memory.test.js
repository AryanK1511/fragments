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
    fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 });
  });

  test("writeFragment(fragment) writes a fragment's metadata to the DB and does not return anything", async () => {
    const result = await writeFragment(fragment);
    expect(result).toBe(undefined);
  });

  test("readFragment(ownerId, id) gets a fragment's metadata from memory db", async () => {
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

  test("writeFragmentData(ownerId, id, buffer) writes the data of a fragment to the DB and doesn't return anything", async () => {
    const data = Buffer.from([1, 2, 3]);
    const writeResult = await writeFragmentData(fragment.ownerId, fragment.id, data);
    expect(writeResult).toBe(undefined);
  });

  test('readFragmentData(ownerId, id) reads a fragment from the DB', async () => {
    // Write to the DB
    const data = Buffer.from([1, 2, 3]);
    await writeFragmentData(fragment.ownerId, fragment.id, data);

    // Fetch from the DB
    const readResult = await readFragmentData(fragment.ownerId, fragment.id);
    expect(readResult).toEqual(data);
  });

  test('listFragments(ownerId, expand) returns a list of fragments for the given user', async () => {
    // Write fragment to DB
    await writeFragment(fragment);

    // Pull frgament list from DB
    const fragmentsList = await listFragments(fragment.ownerId);

    // Check if the result is an array
    expect(Array.isArray(fragmentsList)).toBe(true);

    // Check if the length of the array > 0 as we inserted a fragment earlier
    expect(fragmentsList.length).toBeGreaterThan(0);
  });

  test('deleteFragment(ownerId, id) deletes a fragments data and metadata from the DB', async () => {
    // Write a fragment and its metadata to the DB
    await writeFragment(fragment);
    await writeFragmentData(fragment.ownerId, fragment.id, Buffer.from([1, 2, 3]));

    // Delete teh fragment and its metadata from the DB
    const deletionResult = await deleteFragment(fragment.ownerId, fragment.id);
    expect(deletionResult).toEqual([undefined, undefined]);
  });
});
