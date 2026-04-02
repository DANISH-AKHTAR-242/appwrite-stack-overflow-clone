import { IndexType, Permission } from "node-appwrite";
import { db, voteCollection } from "../name";
import { databases } from "./config";

export default async function createVoteCollection() {
  // Creating Collection
  // Document security enabled - permissions set per document on creation
  await databases.createCollection(db, voteCollection, voteCollection, [
    Permission.create("users"),  // Only authenticated users can create
    Permission.read("any"),      // Anyone can read votes
    // Update and delete permissions are set per-document (user can only modify their own vote)
  ], true);  // Enable document security
  console.log("Vote Collection Created");

  // Creating Attributes
  await Promise.all([
    databases.createEnumAttribute(
      db,
      voteCollection,
      "type",
      ["question", "answer"],
      true,
    ),
    databases.createStringAttribute(db, voteCollection, "typeId", 50, true),
    databases.createEnumAttribute(
      db,
      voteCollection,
      "voteStatus",
      ["upvoted", "downvoted"],
      true,
    ),
    databases.createStringAttribute(db, voteCollection, "votedById", 50, true),
  ]);
  console.log("Vote Attributes Created");

  // Create composite index for efficient vote lookup
  // This helps ensure one vote per user per target through query
  await databases.createIndex(
    db,
    voteCollection,
    "unique_vote",
    IndexType.Key,
    ["type", "typeId", "votedById"],
    ["asc", "asc", "asc"],
  );
  console.log("Vote Index Created");
}
