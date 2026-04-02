import env from "../../app/env";

import { Avatars, Client, Databases, Storage, Users } from "node-appwrite";

const isMockMode = process.env.APPWRITE_MOCK === "true";

const client = new Client();

if (!isMockMode) {
  client
    .setEndpoint(env.appwrite.endpoint) // Your API Endpoint
    .setProject(env.appwrite.projectId) // Your project ID
    .setKey(env.appwrite.apiKey); // Your secret API key
}

const mockStore = {
  databases: new Map<string, { $id: string; name: string }>(),
  collections: {
    questions: new Map<string, any>([
      [
        "q-1",
        {
          $id: "q-1",
          title: "Sample question title for testing",
          content: "Sample question body content for testing.",
          authorId: "user-1",
          tags: ["nextjs"],
          voteCount: 2,
          answerCount: 0,
          attachmentId: null,
          $createdAt: new Date().toISOString(),
        },
      ],
    ]),
    answers: new Map<string, any>([
      [
        "a-seed",
        {
          $id: "a-seed",
          content: "Seeded mock answer content for deterministic test flows.",
          authorId: "user-1",
          questionId: "q-1",
          voteCount: 0,
          $createdAt: new Date().toISOString(),
        },
      ],
    ]),
    comments: new Map<string, any>(),
    votes: new Map<string, any>(),
  },
  users: new Map<string, any>([
    [
      "user-1",
      {
        $id: "user-1",
        name: "Test User",
        email: "qa@example.com",
        prefs: { reputation: 10 },
      },
    ],
  ]),
  buckets: new Map<string, any>([["question-attachment", { $id: "question-attachment" }]]),
};

const mockDatabases = {
  async get(id: string) {
    const db = mockStore.databases.get(id);
    if (!db) throw new Error("Database not found");
    return db;
  },
  async create(id: string, name: string) {
    const db = { $id: id, name };
    mockStore.databases.set(id, db);
    return db;
  },
  async getDocument(_db: string, collection: string, id: string) {
    const col = (mockStore.collections as any)[collection];
    if (!col) throw new Error("Collection not found");
    const doc = col.get(id);
    if (!doc) throw new Error("Document not found");
    return doc;
  },
  async listDocuments(_db: string, collection: string) {
    const col = (mockStore.collections as any)[collection];
    if (!col) throw new Error("Collection not found");
    const documents = Array.from(col.values());
    return { total: documents.length, documents };
  },
  async createDocument(_db: string, collection: string, id: string, data: any) {
    const col = (mockStore.collections as any)[collection];
    if (!col) throw new Error("Collection not found");
    const doc = { $id: id, ...data, $createdAt: new Date().toISOString() };
    col.set(id, doc);
    return doc;
  },
  async updateDocument(_db: string, collection: string, id: string, data: any) {
    const col = (mockStore.collections as any)[collection];
    if (!col) throw new Error("Collection not found");
    const existing = col.get(id);
    if (!existing) throw new Error("Document not found");
    const updated = { ...existing, ...data };
    col.set(id, updated);
    return updated;
  },
  async deleteDocument(_db: string, collection: string, id: string) {
    const col = (mockStore.collections as any)[collection];
    if (!col) throw new Error("Collection not found");
    col.delete(id);
    return {};
  },
};

function getOrCreateMockUser(id: string) {
  const existing = mockStore.users.get(id);
  if (existing) return existing;

  const created = {
    $id: id,
    name: `Mock User ${id}`,
    email: `${id}@example.com`,
    prefs: { reputation: 0 },
  };
  mockStore.users.set(id, created);
  return created;
}

const mockUsers = {
  async get(id: string) {
    return getOrCreateMockUser(id);
  },
  async list() {
    return {
      total: mockStore.users.size,
      users: Array.from(mockStore.users.values()).map((u) => ({
        ...u,
        $updatedAt: new Date().toISOString(),
      })),
    };
  },
  async getPrefs(id: string) {
    const user = getOrCreateMockUser(id);
    return user.prefs || {};
  },
  async updatePrefs(id: string, prefs: any) {
    const user = getOrCreateMockUser(id);
    const updated = { ...user, prefs: { ...user.prefs, ...prefs } };
    mockStore.users.set(id, updated);
    return updated.prefs;
  },
};

const mockStorage = {
  async getBucket(id: string) {
    const bucket = mockStore.buckets.get(id);
    if (!bucket) throw new Error("Bucket not found");
    return bucket;
  },
  async createBucket(id: string) {
    const bucket = { $id: id };
    mockStore.buckets.set(id, bucket);
    return bucket;
  },
  async deleteFile() {
    return {};
  },
};

const users = (isMockMode ? mockUsers : new Users(client)) as any;
const databases = (isMockMode ? mockDatabases : new Databases(client)) as any;
const avatars = new Avatars(client);
const storage = (isMockMode ? mockStorage : new Storage(client)) as any;

export { client, users, databases, avatars, storage };
