import { IndexType, Permission } from "node-appwrite";
import { answerCollection, db } from "../name";
import { databases } from "./config";

export default async function createAnswerCollection() {
  // Creating Collection
  // Document security enabled - permissions set per document on creation
  await databases.createCollection(db, answerCollection, answerCollection, [
    Permission.create("users"),  // Only authenticated users can create
    Permission.read("any"),      // Anyone can read answers
    // Update and delete permissions are set per-document
  ], true);  // Enable document security
  console.log("Answer Collection Created");

  // Creating Attributes
  await Promise.all([
    databases.createStringAttribute(
      db,
      answerCollection,
      "content",
      10000,
      true,
    ),
    databases.createStringAttribute(
      db,
      answerCollection,
      "questionId",
      50,
      true,
    ),
    databases.createStringAttribute(db, answerCollection, "authorId", 50, true),
    // Vote count for efficient sorting/display
    databases.createIntegerAttribute(db, answerCollection, "voteCount", false, 0),
  ]);
  console.log("Answer Attributes Created");

  // Index for sorting answers by votes
  await databases.createIndex(
    db,
    answerCollection,
    "voteCount_idx",
    IndexType.Key,
    ["voteCount"],
    ["desc"],
  );
  console.log("Answer Index Created");
}
