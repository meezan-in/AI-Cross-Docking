const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const uri =
  "mongodb+srv://logistics-manager:hello123@cluster0.dczks2z.mongodb.net/";
const dbName = "bengaluru-logistics";

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");
    const username = "admin";
    const password = "admin123";
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await users.findOne({ username, role: "admin" });
    if (existing) {
      console.log("Admin user already exists.");
    } else {
      await users.insertOne({
        username,
        passwordHash,
        role: "admin",
        createdAt: new Date(),
      });
      console.log("Admin user created: admin / admin123");
    }
  } catch (err) {
    console.error("Error creating admin user:", err);
  } finally {
    await client.close();
  }
})();
