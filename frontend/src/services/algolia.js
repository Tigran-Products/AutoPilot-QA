import { algoliasearch } from 'algoliasearch';

const appId      = import.meta.env.VITE_ALGOLIA_APP_ID;
const adminKey   = import.meta.env.VITE_ALGOLIA_ADMIN_KEY;
const searchKey  = import.meta.env.VITE_ALGOLIA_SEARCH_KEY;

// Client for write operations (uses admin key)
const writeClient  = algoliasearch(appId, adminKey);

// Client for search operations (uses search-only key, safe for frontend)
const searchClient = algoliasearch(appId, searchKey);

const INDEX_NAME = 'AutoPilot-data';

/**
 * Index a single test document in Algolia.
 */
export async function indexTest(uid, test) {
  const record = {
    objectID: `${uid}_${test.id}`,
    userId: uid,
    testId: test.id,
    name: test.name,
    steps: test.steps.map(s => s.text),
    createdAt: test.createdAt,
    _tags: [`user:${uid}`],
  };

  try {
    await writeClient.saveObject({ indexName: INDEX_NAME, body: record });
  } catch (err) {
    console.error('Algolia indexing error:', err.message);
  }
}

/**
 * Remove a test from Algolia index.
 */
export async function deleteTestFromIndex(uid, testId) {
  const objectID = `${uid}_${testId}`;
  try {
    await writeClient.deleteObject({ indexName: INDEX_NAME, objectID });
  } catch (err) {
    console.error('Algolia deletion error:', err.message);
  }
}

/**
 * Bulk index all tests for a user.
 */
export async function bulkIndexTests(uid, tests) {
  if (!tests.length) return;

  const records = tests.map(test => ({
    objectID: `${uid}_${test.id}`,
    userId: uid,
    testId: test.id,
    name: test.name,
    steps: test.steps.map(s => s.text),
    createdAt: test.createdAt,
    _tags: [`user:${uid}`],
  }));

  console.log('[Algolia] Bulk indexing', records.length, 'tests for uid', uid);
  try {
    const result = await writeClient.saveObjects({ indexName: INDEX_NAME, objects: records });
    console.log('[Algolia] Bulk index result:', result);
  } catch (err) {
    console.error('[Algolia] Bulk index failed:', err);
  }
}

export { searchClient };
