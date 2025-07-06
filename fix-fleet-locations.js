const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://logistics-manager:hello123@cluster0.dczks2z.mongodb.net/";
const validCities = [
  "Bengaluru",
  "Mumbai",
  "Delhi",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
  "Surat",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Nagpur",
  "Indore",
  "Bhopal",
  "Visakhapatnam",
  "Kochi",
  "Coimbatore",
  "Mysore",
];

(async () => {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("bengaluru-logistics");
    const fleet = db.collection("fleet");
    const result = await fleet.updateMany(
      { currentLocation: { $nin: validCities } },
      { $set: { currentLocation: "Bengaluru" } }
    );
    console.log(
      "Updated",
      result.modifiedCount,
      "fleet vehicles with invalid locations."
    );
  } catch (err) {
    console.error("Error updating fleet locations:", err);
  } finally {
    await client.close();
  }
})();
