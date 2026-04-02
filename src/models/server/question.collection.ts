import { IndexType, Permission } from "node-appwrite";
import { db, questionCollection } from "../name";
import { databases } from "./config";

export default async function createQuestionCollection() {
  //create collection
  // Document security enabled - permissions set per document on creation
  await databases.createCollection(
    db,
    questionCollection,
    questionCollection,
    [
      Permission.read("any"),  // Anyone can read questions
      Permission.create("users"),  // Only authenticated users can create
      // Update and delete permissions are set per-document
    ],
    true, // Enable document security - each document has its own permissions
  );

  console.log("Question collection created successfully.");

  //creating attributes
  await Promise.all([
    databases.createStringAttribute(db, questionCollection, "title", 100, true),
    databases.createStringAttribute(
      db,
      questionCollection,
      "content",
      10000,
      true,
    ),
    databases.createStringAttribute(
      db,
      questionCollection,
      "authorId",
      100,
      true,
    ),
    databases.createStringAttribute(
      db,
      questionCollection,
      "tags",
      100,
      true,
      undefined,
      true,
    ),
    databases.createStringAttribute(
      db,
      questionCollection,
      "attachmentId",
      100,
      false,
    ),
    // Vote counts for efficient sorting/display (updated on vote)
    databases.createIntegerAttribute(db, questionCollection, "voteCount", false, 0),
    // Answer count for "unanswered" filter
    databases.createIntegerAttribute(db, questionCollection, "answerCount", false, 0),
  ]);

  console.log("Attributes created successfully.");

  //create index
  await Promise.all([
    databases.createIndex(
      db,
      questionCollection,
      "title",
      IndexType.Fulltext,
      ["title"],
      ["asc"],
    ),
    databases.createIndex(
      db,
      questionCollection,
      "content",
      IndexType.Fulltext,
      ["content"],
      ["asc"],
    ),
    // Index for sorting by votes
    databases.createIndex(
      db,
      questionCollection,
      "voteCount_idx",
      IndexType.Key,
      ["voteCount"],
      ["desc"],
    ),
    // Index for finding unanswered questions
    databases.createIndex(
      db,
      questionCollection,
      "answerCount_idx",
      IndexType.Key,
      ["answerCount"],
      ["asc"],
    ),
  ]);

  console.log("Indexes created successfully.");
}
