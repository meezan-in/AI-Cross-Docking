import { packageSchema } from "@shared/schema";

app.post("/api/packages", async (req, res) => {
  try {
    const validatedData = packageSchema.parse(req.body);
    // ... existing code ...
  } catch (error) {
    // ... existing error handling code ...
  }
});
