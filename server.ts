import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Initialize server-side Supabase client (bypasses browser CORS / fetch restrictions)
  const SUPABASE_URL = (
    process.env.VITE_SUPABASE_URL || "https://gapnfllazdqklnylomnn.supabase.co"
  ).trim().replace(/\/+$/, "");
  const SUPABASE_ANON_KEY = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhcG5mbGxazdqklnylomnnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxNzM0NDMsImV4cCI6MjEwMTc0OTQ0M30.B0Ak3QxoTEFH7a93i65GEsjCpZsELfNC1Gm_cpQNQXk"
  ).trim();

  const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Supabase Proxy API Endpoints
  app.get("/api/supabase/test", async (req, res) => {
    try {
      const { error } = await supabaseServer.from("app_users").select("id").limit(1);
      if (error && error.code !== "PGRST116") {
        return res.status(400).json({ success: false, message: `Database error (${error.code}): ${error.message}` });
      }
      return res.json({ success: true, message: "Successfully connected to Supabase database!" });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || "Connection failed." });
    }
  });

  app.get("/api/supabase/users", async (req, res) => {
    try {
      const { data, error } = await supabaseServer.from("app_users").select("*");
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json({ data: data || [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/supabase/users", async (req, res) => {
    try {
      const user = req.body;
      const payload = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email || "",
        department: user.department || "",
        password: user.password || "",
        created_at: user.createdAt || new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabaseServer.from("app_users").upsert(payload, { onConflict: "id" });
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/supabase/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseServer.from("app_users").delete().eq("id", id);
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/supabase/records", async (req, res) => {
    try {
      const { data, error } = await supabaseServer.from("financial_records").select("*");
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      const result: Record<number, any> = {};
      if (data) {
        data.forEach((row: any) => {
          if (row.year && row.data) {
            result[row.year] = row.data;
          }
        });
      }
      return res.json({ data: result });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/supabase/records", async (req, res) => {
    try {
      const { year, data } = req.body;
      const payload = {
        year,
        data,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabaseServer.from("financial_records").upsert(payload, { onConflict: "year" });
      if (error) {
        return res.status(400).json({ success: false, message: `Sync failed: ${error.message}` });
      }
      return res.json({ success: true, message: `FY ${year} records successfully synced to Supabase!` });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || "Sync failed." });
    }
  });

  // API Route to parse financial screenshot using Gemini Vision
  app.post("/api/parse-financial-screenshot", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ success: false, error: "No image payload provided" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: "GEMINI_API_KEY environment variable is missing on server."
        });
      }

      // Strip data URL header if present (e.g., data:image/png;base64,...)
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/, "").trim();

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `Analyze this financial statement / expense report screenshot.
Extract:
1. The month name shown in the table header or title (e.g. "July", "January", "August", etc.). If not found, return an empty string.
2. Every line item in the table along with its numerical values for Actual, Budget, and Last Year.
Note:
- Ignore all percentage columns (columns with '%' header).
- Clean formatted numbers like "23,091" or "$1,151" to integer numbers (e.g. 23091, 1151).
- If a value is 0, blank, or missing, set it to 0.
- Extract individual expense line items accurately (e.g., Salaries & Wages, Cost of Cell Phones, Dues and Subscriptions, etc.).`;

      // Supported Gemini API model names in order of preference
      const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
      let response: any = null;
      let lastModelError: any = null;

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  monthName: {
                    type: Type.STRING,
                    description: "Name of the month if visible in table headers",
                  },
                  items: {
                    type: Type.ARRAY,
                    description: "List of extracted financial line items",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        lineItemName: {
                          type: Type.STRING,
                          description: "Exact or raw line item label",
                        },
                        actual: {
                          type: Type.NUMBER,
                          description: "Actual dollar amount",
                        },
                        budget: {
                          type: Type.NUMBER,
                          description: "Budget dollar amount",
                        },
                        lastYear: {
                          type: Type.NUMBER,
                          description: "Last Year dollar amount",
                        },
                      },
                      required: ["lineItemName", "actual", "budget", "lastYear"],
                    },
                  },
                },
                required: ["monthName", "items"],
              },
            },
          });
          if (response) {
            break;
          }
        } catch (mErr: any) {
          console.warn(`Gemini model ${modelName} failed:`, mErr?.message || mErr);
          lastModelError = mErr;
        }
      }

      if (!response) {
        throw new Error(
          lastModelError?.message || "All Gemini API models failed to process the screenshot."
        );
      }

      const responseText = response.text || "{}";
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (_jsonErr) {
        const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
          parsedData = JSON.parse(cleaned);
        } catch (_2) {
          console.error("Failed to parse Gemini response text:", responseText);
          return res.status(500).json({
            success: false,
            error: "Gemini AI response could not be parsed into valid JSON."
          });
        }
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error("Error parsing financial screenshot:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to process screenshot with AI",
      });
    }
  });

  // Vite middleware for development vs production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
