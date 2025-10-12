import { IndexType, Permission } from "node-appwrite";
import { db, questionCollection } from "../name";
import { databases } from "./config";

export default async function createQuestionCollection() {
  //create collection
  await databases.createCollection(
    db,
    questionCollection,
    questionCollection,
    [
      Permission.read("any"),
      Permission.read("users"),
      Permission.create("users"),
      Permission.update("users"),
      Permission.delete("users"),
    ],
    true, // Explicitly enable document security
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
  ]);

  console.log("Indexes created successfully.");
}
