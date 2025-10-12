import env from "../../app/env";

import { Avatars, Client, Databases, Storage, Users } from "node-appwrite";

// const sdk = require("node-appwrite");

const client = new Client();

client
  .setEndpoint(env.appwrite.endpoint) // Your API Endpoint
  .setProject(env.appwrite.projectId) // Your project ID
  .setKey(env.appwrite.apiKey); // Your secret API key
//   .setSelfSigned(); // Use only on dev mode with a self-signed SSL cert
const users = new Users(client);
const databases = new Databases(client);
const avatars = new Avatars(client);
const storage = new Storage(client);

export { client, users, databases, avatars, storage };
