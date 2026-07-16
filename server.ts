import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Chat, ChatMessage, Document, PromptTemplate, AuditLog, AnalyticsStats } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for JSON parsing and CORS
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Ensure data folder exists
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "db.json");

// Helper to load database
function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDB = {
      users: [
        { id: "u-1", email: "admin@enterprise.com", name: "Sarah Jenkins", role: "Admin", joinedDate: "2026-01-10", status: "Active" },
        { id: "u-2", email: "analyst@enterprise.com", name: "David K.", role: "User", joinedDate: "2026-03-15", status: "Active" }
      ],
      chats: [
        {
          id: "chat-1",
          title: "Legal Document Comparison",
          userId: "u-1",
          isPinned: true,
          folder: "Legal Reviews",
          messages: [
            { id: "m-1", role: "user", text: "Explain the standard indemnification clauses inside our corporate documents.", timestamp: "2026-07-14T14:30:00Z" },
            {
              id: "m-2",
              role: "assistant",
              text: "Based on standard corporate templates, our indemnification clause limits aggregate liability to the total fees paid in the trailing 12 months, with carve-outs for gross negligence, willful misconduct, and IP infringement. Refer to Exhibit B of the NDA document.",
              timestamp: "2026-07-14T14:31:12Z",
              modelUsed: "gemini-3.5-flash",
              tokensUsed: 142,
              rating: "up"
            }
          ],
          createdAt: "2026-07-14T14:28:00Z",
          updatedAt: "2026-07-14T14:31:12Z"
        },
        {
          id: "chat-2",
          title: "Financial Projections Q3",
          userId: "u-1",
          isPinned: false,
          folder: "Financials",
          messages: [
            { id: "m-3", role: "user", text: "What was our quarterly active user growth target?", timestamp: "2026-07-15T09:12:00Z" },
            {
              id: "m-4",
              role: "assistant",
              text: "Our target quarterly active user growth was set at 12.5% quarter-over-quarter, aiming for a milestone of 2.4M active users by the end of Q3. Currently, our performance is sitting at approximately 11.2% growth.",
              timestamp: "2026-07-15T09:12:35Z",
              modelUsed: "gemini-3.5-flash",
              tokensUsed: 98,
              rating: null
            }
          ],
          createdAt: "2026-07-15T09:10:00Z",
          updatedAt: "2026-07-15T09:12:35Z"
        }
      ],
      documents: [
        {
          id: "doc-1",
          name: "Standard_NDA_Template.txt",
          size: 12400,
          type: "text/plain",
          category: "Legal",
          chunkCount: 8,
          status: "indexed",
          uploadedAt: "2026-07-10T10:00:00Z",
          enabled: true,
          content: "Enterprise Confidentiality and Non-Disclosure Agreement.\nThis Agreement is entered into by and between Enterprise Corp and the Receiving Party.\n\nINDEMNIFICATION & LIABILITY:\nEach party agrees to indemnify, defend, and hold harmless the other party from and against any third-party claims, liabilities, losses, or costs arising out of intellectual property breaches.\nExcept for breach of confidentiality or gross negligence, neither party's aggregate liability shall exceed $100,000 USD or total contract values paid in the trailing twelve (12) months, whichever is greater."
        },
        {
          id: "doc-2",
          name: "Q2_Financial_Report.csv",
          size: 8520,
          type: "text/csv",
          category: "Finance",
          chunkCount: 15,
          status: "indexed",
          uploadedAt: "2026-07-12T11:45:00Z",
          enabled: true,
          content: "Quarter,Revenue_USD,Operating_Expenses,Net_Income,Active_Users_Growth_Rate\nQ1,4500000,3100000,1400000,10.2%\nQ2,5100000,3250000,1850000,11.2%\nQ3_Target,5500000,3300000,2200000,12.5%"
        }
      ],
      prompts: [
        { id: "p-1", name: "Corporate Legal Analyst", description: "Strict, objective corporate law and risk advisor.", systemPrompt: "You are a professional Enterprise Legal Advisor. Your style is strict, cautious, objective, and highly precise. When answering questions, reference standard legal terminology. If grounded in document context, cite specific paragraphs and exhibit titles. Always highlight liabilities or regulatory risks.", category: "Legal" },
        { id: "p-2", name: "Clean Code Reviewer", description: "Strict SOLID compliance and syntax auditing.", systemPrompt: "You are a Senior Software Engineer. Review the code provided by the user. Highlight violations of SOLID principles, security issues (SQL injection, XSS, loose credentials), performance bottlenecks, and suggest clean Refactored implementations with concise explanations.", category: "Coding" },
        { id: "p-3", name: "Executive Summarizer", description: "High-level summary with bullet points for decision-makers.", systemPrompt: "You are a Chief of Staff. Summarize complex texts, data, or conversations into ultra-concise executive briefings. Start with a 2-sentence bottom-line-up-front (BLUF), followed by 3-5 structured bullet points highlighting key decisions, financial impacts, and immediate next steps.", category: "Enterprise" }
      ],
      logs: [
        { id: "log-1", userId: "u-1", userEmail: "admin@enterprise.com", action: "User Login", details: "Successful login from IP 192.168.1.52", timestamp: "2026-07-15T10:30:15Z", type: "info" },
        { id: "log-2", userId: "u-1", userEmail: "admin@enterprise.com", action: "Document Uploaded", details: "Uploaded 'Q2_Financial_Report.csv' successfully (8.3 KB)", timestamp: "2026-07-12T11:45:00Z", type: "info" }
      ],
      analytics: {
        totalUsers: 142,
        dailyChats: 38,
        averageResponseTimeMs: 420,
        userGrowth: [
          { date: "2026-07-10", count: 125 },
          { date: "2026-07-11", count: 128 },
          { date: "2026-07-12", count: 132 },
          { date: "2026-07-13", count: 137 },
          { date: "2026-07-14", count: 140 },
          { date: "2026-07-15", count: 142 }
        ],
        aiTokenUsage: [
          { date: "2026-07-10", input: 24500, output: 48000 },
          { date: "2026-07-11", input: 28900, output: 52400 },
          { date: "2026-07-12", input: 35000, output: 68100 },
          { date: "2026-07-13", input: 41200, output: 82000 },
          { date: "2026-07-14", input: 49500, output: 95300 },
          { date: "2026-07-15", input: 54100, output: 104200 }
        ],
        feedbackScore: 94,
        uploadedDocuments: 2,
        knowledgeBaseSizeKb: 21,
        popularQuestions: [
          { question: "Indemnification clause liability limit?", count: 14 },
          { question: "Q3 user growth rate targets?", count: 12 },
          { question: "Review standard security audit criteria", count: 9 },
          { question: "How to reset enterprise SMTP config?", count: 6 }
        ],
        dailyVolume: [
          { date: "2026-07-10", chats: 24, tokens: 72500 },
          { date: "2026-07-11", chats: 28, tokens: 81300 },
          { date: "2026-07-12", chats: 31, tokens: 103100 },
          { date: "2026-07-13", chats: 35, tokens: 123200 },
          { date: "2026-07-14", chats: 39, tokens: 144800 },
          { date: "2026-07-15", chats: 38, tokens: 158300 }
        ]
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDB, null, 2), "utf8");
    return initialDB;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(data: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

// In-Memory storage initialized from file
let db = loadDB();

// Initialize Google GenAI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
  try {
    aiClient = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
    console.log("Secure Google GenAI client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Google GenAI SDK client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found in .env; falling back to simulated high-quality AI mode.");
}

// Custom semantic keyword search for RAG
function searchKnowledgeBase(query: string, documents: Document[]) {
  const activeDocs = documents.filter(d => d.enabled && d.status === "indexed");
  if (activeDocs.length === 0) return [];

  // Parse words from search query
  const searchWords = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2);

  if (searchWords.length === 0) return [];

  const chunks: { snippet: string; docId: string; docName: string; score: number }[] = [];

  for (const doc of activeDocs) {
    // Simple block splitter (by double newlines, or paragraphs)
    const paragraphs = doc.content
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20);

    for (const p of paragraphs) {
      let score = 0;
      const lowerParagraph = p.toLowerCase();
      
      for (const word of searchWords) {
        if (lowerParagraph.includes(word)) {
          // Extra weight if word matches exactly with boundaries
          const regex = new RegExp(`\\b${word}\\b`, "i");
          if (regex.test(lowerParagraph)) {
            score += 2;
          } else {
            score += 1;
          }
        }
      }

      if (score > 0) {
        chunks.push({
          snippet: p,
          docId: doc.id,
          docName: doc.name,
          score
        });
      }
    }
  }

  // Sort by score descending and return top 3 citations
  return chunks.sort((a, b) => b.score - a.score).slice(0, 3);
}

// Log audit helper
function logAudit(userId: string, email: string, action: string, details: string, type: 'info' | 'error' | 'security' = 'info') {
  const newLog: AuditLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    userEmail: email,
    action,
    details,
    timestamp: new Date().toISOString(),
    type
  };
  db.logs.unshift(newLog);
  // Keep logs capped at 100 entries to save storage
  if (db.logs.length > 100) {
    db.logs = db.logs.slice(0, 100);
  }
  saveDB(db);
}

// --- REST API ENDPOINTS ---

// Auth endpoints
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  
  if (user) {
    if (user.status === "Suspended") {
      logAudit("guest", email, "Failed Login", "Suspended account attempted login", "security");
      return res.status(403).json({ error: "Account is suspended. Please contact your system administrator." });
    }
    
    logAudit(user.id, user.email, "User Login", `Admin-verified console login from email: ${email}`, "info");
    return res.json({
      token: `mock-jwt-token-for-${user.id}-${Math.random().toString(36).substring(7)}`,
      user
    });
  }

  // Auto create a Standard user if login matches someone new
  const isNewAdmin = email.includes("admin");
  const newUser = {
    id: `u-${Date.now()}`,
    email: email.toLowerCase(),
    name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    role: (isNewAdmin ? "Admin" : "User") as 'Admin' | 'User',
    joinedDate: new Date().toISOString().split("T")[0],
    status: "Active" as 'Active' | 'Suspended'
  };

  db.users.push(newUser);
  saveDB(db);
  
  logAudit(newUser.id, newUser.email, "User Registered", `Auto-provisioned login for new workspace user: ${email}`, "info");
  
  res.json({
    token: `mock-jwt-token-for-${newUser.id}`,
    user: newUser
  });
});

app.post("/api/auth/register", (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required" });
  }

  const exists = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "A user with this email already exists" });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    email: email.toLowerCase(),
    name,
    role: (role || "User") as 'Admin' | 'User',
    joinedDate: new Date().toISOString().split("T")[0],
    status: "Active" as 'Active' | 'Suspended'
  };

  db.users.push(newUser);
  // Increment active users count in stats
  db.analytics.totalUsers += 1;
  saveDB(db);

  logAudit(newUser.id, newUser.email, "User Created", `Created account for ${name} (${newUser.role})`, "info");
  res.json(newUser);
});

// Logs fetch for Admin Panel
app.get("/api/logs", (req, res) => {
  res.json(db.logs);
});

// Prompt Templates CRUD
app.get("/api/prompts", (req, res) => {
  res.json(db.prompts);
});

app.post("/api/prompts", (req, res) => {
  const { name, description, systemPrompt, category } = req.body;
  if (!name || !systemPrompt) {
    return res.status(400).json({ error: "Name and system prompt are required" });
  }

  const newPrompt: PromptTemplate = {
    id: `p-${Date.now()}`,
    name,
    description: description || "",
    systemPrompt,
    category: category || "General"
  };

  db.prompts.push(newPrompt);
  saveDB(db);
  
  logAudit("admin-api", "system", "Prompt Template Created", `Created template: ${name}`, "info");
  res.json(newPrompt);
});

app.delete("/api/prompts/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = db.prompts.length;
  db.prompts = db.prompts.filter((p: any) => p.id !== id);
  
  if (db.prompts.length < initialLen) {
    saveDB(db);
    logAudit("admin-api", "system", "Prompt Template Deleted", `Removed template with ID: ${id}`, "info");
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Template not found" });
});

// Manage Users (Admin panel)
app.get("/api/users", (req, res) => {
  res.json(db.users);
});

app.put("/api/users/:id/toggle", (req, res) => {
  const { id } = req.params;
  const user = db.users.find((u: any) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  user.status = user.status === "Active" ? "Suspended" : "Active";
  saveDB(db);
  logAudit("admin-api", "system", "User State Changed", `Modified status of ${user.email} to ${user.status}`, "security");
  res.json(user);
});

app.delete("/api/users/:id", (req, res) => {
  const { id } = req.params;
  db.users = db.users.filter((u: any) => u.id !== id);
  db.analytics.totalUsers = db.users.length;
  saveDB(db);
  logAudit("admin-api", "system", "User Account Deleted", `Deleted account ID: ${id}`, "security");
  res.json({ success: true });
});

// Chats endpoints
app.get("/api/chats", (req, res) => {
  res.json(db.chats);
});

app.post("/api/chats", (req, res) => {
  const { title, userId, folder } = req.body;
  const newChat: Chat = {
    id: `chat-${Date.now()}`,
    title: title || "New Dialogue Session",
    userId: userId || "u-1",
    isPinned: false,
    folder: folder || null,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.chats.unshift(newChat);
  saveDB(db);
  res.json(newChat);
});

app.put("/api/chats/:id", (req, res) => {
  const { id } = req.params;
  const { title, isPinned, folder } = req.body;
  const chat = db.chats.find((c: any) => c.id === id);
  
  if (!chat) {
    return res.status(404).json({ error: "Chat session not found" });
  }

  if (title !== undefined) chat.title = title;
  if (isPinned !== undefined) chat.isPinned = isPinned;
  if (folder !== undefined) chat.folder = folder;
  
  chat.updatedAt = new Date().toISOString();
  saveDB(db);
  res.json(chat);
});

app.delete("/api/chats/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = db.chats.length;
  db.chats = db.chats.filter((c: any) => c.id !== id);
  
  if (db.chats.length < initialLen) {
    saveDB(db);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Chat not found" });
});

// Feedback endpoint (Ratings)
app.post("/api/feedback", (req, res) => {
  const { chatId, messageId, rating, feedbackText } = req.body;
  const chat = db.chats.find((c: any) => c.id === chatId);
  if (!chat) {
    return res.status(404).json({ error: "Chat session not found" });
  }

  const msg = chat.messages.find((m: any) => m.id === messageId);
  if (!msg) {
    return res.status(404).json({ error: "Message not found" });
  }

  msg.rating = rating;
  if (feedbackText !== undefined) {
    msg.feedbackText = feedbackText;
  }

  // Re-calculate average feedback score in db
  let upvotes = 0;
  let ratedCount = 0;
  for (const c of db.chats) {
    for (const m of c.messages) {
      if (m.rating === "up") {
        upvotes++;
        ratedCount++;
      } else if (m.rating === "down") {
        ratedCount++;
      }
    }
  }

  if (ratedCount > 0) {
    db.analytics.feedbackScore = Math.round((upvotes / ratedCount) * 100);
  }

  saveDB(db);
  logAudit(chat.userId, "user", "Submitted AI Feedback", `Rated message ${messageId} in chat ${chatId} as ${rating}`, "info");
  res.json({ success: true, updatedScore: db.analytics.feedbackScore });
});

// Documents / Knowledge Base endpoints
app.get("/api/documents", (req, res) => {
  res.json(db.documents);
});

app.post("/api/documents/upload", (req, res) => {
  const { name, content, size, type, category } = req.body;
  if (!name || !content) {
    return res.status(400).json({ error: "Document name and content are required" });
  }

  const chunkCount = Math.max(1, Math.ceil(content.length / 400));
  const newDoc: Document = {
    id: `doc-${Date.now()}`,
    name,
    size: size || content.length,
    type: type || "text/plain",
    category: category || "Enterprise Knowledge Base",
    chunkCount,
    status: "indexed",
    uploadedAt: new Date().toISOString(),
    enabled: true,
    content
  };

  db.documents.push(newDoc);
  // Update kb stats
  db.analytics.uploadedDocuments = db.documents.length;
  db.analytics.knowledgeBaseSizeKb = Math.round(
    db.documents.reduce((acc: number, d: Document) => acc + (d.size / 1024), 0)
  );

  saveDB(db);
  logAudit("admin-api", "system", "Document Uploaded", `Added knowledge file: ${name} (${category})`, "info");
  res.json(newDoc);
});

app.put("/api/documents/:id/toggle", (req, res) => {
  const { id } = req.params;
  const doc = db.documents.find((d: any) => d.id === id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  doc.enabled = !doc.enabled;
  saveDB(db);
  res.json(doc);
});

app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const initialLen = db.documents.length;
  db.documents = db.documents.filter((d: any) => d.id !== id);
  
  if (db.documents.length < initialLen) {
    db.analytics.uploadedDocuments = db.documents.length;
    db.analytics.knowledgeBaseSizeKb = Math.round(
      db.documents.reduce((acc: number, d: Document) => acc + (d.size / 1024), 0)
    );
    saveDB(db);
    logAudit("admin-api", "system", "Document Deleted", `Removed knowledge source with ID: ${id}`, "info");
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Knowledge document not found" });
});

// Analytics Dashboard Endpoint
app.get("/api/analytics", (req, res) => {
  res.json(db.analytics);
});

// --- AI Gemini Chat and Streaming Endpoint ---
app.post("/api/chats/:id/messages", async (req, res) => {
  const { id } = req.params;
  const { text, stream, customSystemPrompt, model, temperature } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Message text is required" });
  }

  const chat = db.chats.find((c: any) => c.id === id);
  if (!chat) {
    return res.status(404).json({ error: "Chat session not found" });
  }

  const startTime = Date.now();
  const selectedModel = model || "gemini-3.5-flash";

  // Step 1: Perform custom semantic RAG search on enabled files
  const citationsMatched = searchKnowledgeBase(text, db.documents);
  const hasGrounding = citationsMatched.length > 0;

  // Append user message
  const userMsg: ChatMessage = {
    id: `m-u-${Date.now()}`,
    role: "user",
    text,
    timestamp: new Date().toISOString()
  };
  chat.messages.push(userMsg);
  chat.updatedAt = new Date().toISOString();

  // Keep daily usage charts updated
  const todayStr = new Date().toISOString().split("T")[0];
  let dailyVolumeDay = db.analytics.dailyVolume.find((d: any) => d.date === todayStr);
  if (!dailyVolumeDay) {
    dailyVolumeDay = { date: todayStr, chats: 0, tokens: 0 };
    db.analytics.dailyVolume.push(dailyVolumeDay);
  }
  dailyVolumeDay.chats += 1;
  db.analytics.dailyChats += 1;

  // Add search grounding context to prompt instructions
  let finalSystemInstruction = customSystemPrompt || "You are an Enterprise Virtual AI Coworker. Answer questions professionally, objectively, and highlight metrics when appropriate.";
  if (hasGrounding) {
    const contextText = citationsMatched
      .map((c, idx) => `[Source ${idx + 1}: ${c.docName}]\n"${c.snippet}"`)
      .join("\n\n");

    finalSystemInstruction += `\n\nADDITIONAL CONTEXT & GROUNDING DOCUMENT INFORMATION:\n${contextText}\n\nRULES:\n1. Answer the user's prompt as thoroughly as possible. Prioritize answering using ONLY the grounded facts provided above. If the context does not contain the answer, answer objectively but indicate you are drawing from general knowledge, citing clearly.\n2. When referencing facts from a source, add citation tags like [Source 1], [Source 2] inline precisely where relevant.\n3. Show clear, professional bulleted citations at the very end of your response under a '## Citations' header.`;
  }

  // Format full chat history for Gemini (excluding the final assistant response we are generating)
  const conversationContents = chat.messages.map((m: any) => {
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }]
    };
  });

  const citationsForMessage = citationsMatched.map((c) => ({
    documentId: c.docId,
    documentName: c.docName,
    snippet: c.snippet
  }));

  const assistantMsgId = `m-a-${Date.now()}`;

  // Check if streaming is requested
  if (stream) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    let fullAnswer = "";
    
    if (aiClient) {
      try {
        const streamResponse = await aiClient.models.generateContentStream({
          model: selectedModel,
          contents: conversationContents,
          config: {
            systemInstruction: finalSystemInstruction,
            temperature: temperature !== undefined ? Number(temperature) : 0.7,
          }
        });

        for await (const chunk of streamResponse) {
          const chunkText = chunk.text || "";
          fullAnswer += chunkText;
          res.write(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`);
        }
      } catch (err: any) {
        console.error("Gemini stream error:", err);
        res.write(`data: ${JSON.stringify({ error: err.message || "Gemini API Stream Error" })}\n\n`);
      }
    } else {
      // Simulate fully working high-quality local AI stream for prompt testing/key failure gracefully
      const baseResponse = hasGrounding 
        ? `According to the uploaded company records in **${citationsMatched[0].docName}**, our official policy is clearly defined [Source 1]. \n\nHere is a high-level overview grounded in the document context:\n\n- **Indemnification Scope**: The clause ensures aggregate liability protection capping liability limits at $100k or trailing 12-month contract value [Source 1].\n- **Grounded Scope**: This directly addresses the liability standards for IP and confidentiality breaches.\n\nIs there any additional section of standard policies you would like me to retrieve?`
        : `Greetings! I am simulated in **Offline Enterprise Demo Mode** because a valid GEMINI_API_KEY was not supplied in the workspace secrets panel. However, here is how the enterprise chat responds to your query: "${text}".\n\nTo unlock true real-time Gemini reasoning and document search, simply supply a \`GEMINI_API_KEY\` via the **Settings > Secrets** panel in the AI Studio platform interface. It is instantly injected into our secure backend.`;

      const words = baseResponse.split(" ");
      for (let i = 0; i < words.length; i++) {
        const chunk = words[i] + (i === words.length - 1 ? "" : " ");
        fullAnswer += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        // Fast streaming interval simulation
        await new Promise(resolve => setTimeout(resolve, 35));
      }
    }

    // Append generated assistant response in memory database
    const finalAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      text: fullAnswer,
      timestamp: new Date().toISOString(),
      modelUsed: selectedModel,
      tokensUsed: Math.round(fullAnswer.length / 3.8),
      citations: citationsForMessage
    };

    chat.messages.push(finalAssistantMsg);
    chat.updatedAt = new Date().toISOString();

    // Log stats
    const duration = Date.now() - startTime;
    db.analytics.averageResponseTimeMs = Math.round((db.analytics.averageResponseTimeMs * 9 + duration) / 10);
    
    // Update daily volume token usage
    const approxTokens = Math.round(fullAnswer.length / 3.8) + Math.round(text.length / 3.8);
    dailyVolumeDay.tokens += approxTokens;

    // Track AI token usage history
    let usageDay = db.analytics.aiTokenUsage.find((d: any) => d.date === todayStr);
    if (!usageDay) {
      usageDay = { date: todayStr, input: 0, output: 0 };
      db.analytics.aiTokenUsage.push(usageDay);
    }
    usageDay.input += Math.round(text.length / 3.8);
    usageDay.output += Math.round(fullAnswer.length / 3.8);

    saveDB(db);
    res.write("data: [DONE]\n\n");
    res.end();

  } else {
    // Normal POST (Non-streaming response)
    let aiText = "";

    if (aiClient) {
      try {
        const response = await aiClient.models.generateContent({
          model: selectedModel,
          contents: conversationContents,
          config: {
            systemInstruction: finalSystemInstruction,
            temperature: temperature !== undefined ? Number(temperature) : 0.7,
          }
        });
        aiText = response.text || "No response received from Gemini.";
      } catch (err: any) {
        console.error("Gemini non-stream error:", err);
        aiText = `Error occurred during Gemini invocation: ${err.message || "API Connection Error"}. Please check your GEMINI_API_KEY or connection.`;
      }
    } else {
      aiText = hasGrounding
        ? `According to the uploaded company records in **${citationsMatched[0].docName}**, our official policy is clearly defined [Source 1]. \n\nHere is a high-level overview grounded in the document context:\n\n- **Indemnification Scope**: The clause ensures aggregate liability protection capping liability limits at $100k or trailing 12-month contract value [Source 1].\n- **Grounded Scope**: This directly addresses the liability standards for IP and confidentiality breaches.\n\nIs there any additional section of standard policies you would like me to retrieve?`
        : `Greetings! This is a mock AI response representing: "${text}". Please provide a GEMINI_API_KEY in the secrets menu to connect to the actual model.`;
    }

    const approxTokens = Math.round(aiText.length / 3.8) + Math.round(text.length / 3.8);
    const finalAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      text: aiText,
      timestamp: new Date().toISOString(),
      modelUsed: selectedModel,
      tokensUsed: approxTokens,
      citations: citationsForMessage
    };

    chat.messages.push(finalAssistantMsg);
    chat.updatedAt = new Date().toISOString();

    const duration = Date.now() - startTime;
    db.analytics.averageResponseTimeMs = Math.round((db.analytics.averageResponseTimeMs * 9 + duration) / 10);
    dailyVolumeDay.tokens += approxTokens;

    let usageDay = db.analytics.aiTokenUsage.find((d: any) => d.date === todayStr);
    if (!usageDay) {
      usageDay = { date: todayStr, input: 0, output: 0 };
      db.analytics.aiTokenUsage.push(usageDay);
    }
    usageDay.input += Math.round(text.length / 3.8);
    usageDay.output += Math.round(aiText.length / 3.8);

    saveDB(db);
    res.json({ message: finalAssistantMsg });
  }
});

// Configure Vite middleware in development or serve static assets in production
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving Production Static Assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise Full Stack Server running on port ${PORT}`);
  });
}

setupVite().catch(err => {
  console.error("Vite setup error:", err);
});
