import { storage } from "./storage";
import fetch from "node-fetch";

const BLYNK_AUTH_TOKEN = "CtxzRD2H1lbcWuSWFzRhO7NThVBDoLgo";
const POLL_INTERVAL_MS = 3000;

// Pin mapping
const PINS = {
  id: "V0",
  city: "V1",
  weight: "V2",
  priority: "V3",
};

async function pollBlynkAndInsert() {
  await storage.connect();
  console.log("[Blynk Poller] Connected to DB. Starting polling...");
  let lastPackageId = "";

  setInterval(async () => {
    try {
      // Fetch data from Blynk
      const url = `https://blynk.cloud/external/api/get?token=${BLYNK_AUTH_TOKEN}&${PINS.id}&${PINS.city}&${PINS.weight}&${PINS.priority}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(
          `[Blynk Poller] Failed to fetch from Blynk: ${res.status}`
        );
        return;
      }
      const data = (await res.json()) as Record<string, any>;
      const id = data[PINS.id];
      const city = data[PINS.city];
      const weight = parseFloat(data[PINS.weight]);
      const priority = data[PINS.priority];

      if (!id || !city || !weight || !priority) {
        // Incomplete data, skip
        return;
      }

      // Only act if the package ID is new (not the same as last seen)
      if (id === lastPackageId) {
        return;
      }

      // Check if package already exists
      const existing = await storage.getPackage(id);
      if (existing) {
        // Already in DB, do nothing
        lastPackageId = id;
        return;
      }

      // Insert new package
      const pkg = {
        id,
        destination: city,
        weight,
        priority,
        source: "rfid",
      };
      await storage.createPackage(pkg);
      console.log(`[Blynk Poller] Inserted new package: ${id}`);
      lastPackageId = id;
    } catch (err) {
      console.error("[Blynk Poller] Error:", err);
    }
  }, POLL_INTERVAL_MS);
}

pollBlynkAndInsert();
