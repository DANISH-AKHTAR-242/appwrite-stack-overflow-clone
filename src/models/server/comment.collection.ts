import { Permission } from "node-appwrite";
import { commentCollection, db } from "../name";
import { databases } from "./config";

export default async function createCommentCollection() {
  // Creating Collection
  // Document security enabled - permissions set per document on creation
  await databases.createCollection(db, commentCollection, commentCollection, [
    Permission.create("users"),  // Only authenticated users can create
    Permission.read("any"),      // Anyone can read comments
    // Update and delete permissions are set per-document
  ], true);  // Enable document security
  console.log("Comment Collection Created");

  // Creating Attributes
  await Promise.all([
    databases.createStringAttribute(
      db,
      commentCollection,
      "content",
      10000,
      true,
    ),
    databases.createEnumAttribute(
      db,
      commentCollection,
      "type",
      ["answer", "question"],
      true,
    ),
    databases.createStringAttribute(db, commentCollection, "typeId", 50, true),
    databases.createStringAttribute(
      db,
      commentCollection,
      "authorId",
      50,
      true,
    ),
  ]);
  console.log("Comment Attributes Created");
}
