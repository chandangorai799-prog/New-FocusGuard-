import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Resilient multi-model fallback list in priority order
const CANDIDATE_MODELS = [
  "gemini-3.7-flash",
  "gemini-2.5-flash",
];

async function generateContentWithRetryAndFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: {
      responseMimeType?: string;
      systemInstruction?: string;
    };
  }
) {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });

        if (response && response.text) {
          return { response, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini API] Model ${model} (attempt ${attempt}/2) failed: ${errMsg}`);

        // If 503 (high demand) or 429 (rate limit), pause briefly before retry
        const isTemporary = errMsg.includes("503") || errMsg.includes("429") || errMsg.includes("high demand") || errMsg.includes("UNAVAILABLE");
        if (isTemporary && attempt === 1) {
          await new Promise((r) => setTimeout(r, 600));
        } else {
          break; // move to next candidate model
        }
      }
    }
  }

  throw lastError || new Error("All Gemini model endpoints currently unavailable");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
    timestamp: new Date().toISOString(),
  });
});

// AI Study Planner Endpoint
app.post("/api/ai/planner", async (req, res) => {
  try {
    const {
      studentName,
      subject,
      topics,
      topicList,
      examDate,
      daysAvailable,
      hoursPerDay,
      difficulty,
      topicDifficulty,
      dailyTarget,
      preferredTime,
      notes,
    } = req.body;

    if (!subject || (!topics && (!topicList || topicList.length === 0))) {
      return res.status(400).json({ error: "Subject and topics are required" });
    }

    const topicsString = Array.isArray(topicList) && topicList.length > 0 ? topicList.join(", ") : (topics || "");
    const name = studentName || "Student";
    const hrs = Number(hoursPerDay || 3);
    const targetDate = examDate || "In 3 weeks";

    const ai = getGeminiClient();

    if (!ai) {
      // Return high-quality intelligent generated plan as offline/fallback
      const fallbackPlan = generateFallbackStudyPlan(
        name,
        subject,
        topicsString,
        targetDate,
        daysAvailable,
        hrs,
        difficulty,
        topicDifficulty,
        dailyTarget,
        preferredTime,
        notes
      );
      return res.json({
        plan: fallbackPlan,
        isFallback: true,
        message: "Generated using built-in intelligent study optimizer engine.",
      });
    }

    const prompt = `You are FocusGuard's dedicated AI Study Planner Engine.
Your SOLE responsibility is generating an actionable, personalized, spaced-repetition study schedule for a student.

Student Profile & Input:
- Student Name: ${name}
- Subject: ${subject}
- Topics to cover: ${topicsString}
- Target/Exam Date: ${targetDate}
- Days Available for Study: ${daysAvailable || 14} days
- Available study time: ${hrs} hours per day
- Current Preparation Level: ${difficulty || "Intermediate"}
- Topic Difficulty Level: ${topicDifficulty || "Medium"}
- Daily Study Target: ${dailyTarget || "Cover 1 core topic + 5 practice problems"}
- Preferred study time: ${preferredTime || "Evening"}
- Extra student notes/weak areas: ${notes || "Build conceptual mastery and exam readiness"}

Generate a detailed study blueprint in strictly valid JSON matching this exact structure:
{
  "studentName": "${name}",
  "title": "${subject} Master Exam Preparation Blueprint",
  "subject": "${subject}",
  "topics": "${topicsString}",
  "examDate": "${targetDate}",
  "daysAvailable": ${Number(daysAvailable || 14)},
  "hoursPerDay": ${hrs},
  "dailyTarget": "${dailyTarget || "Cover 1 core topic + 5 practice problems"}",
  "difficultyLevel": "${difficulty || "Intermediate"}",
  "preferredTime": "${preferredTime || "Evening"}",
  "summary": "An executive summary of time allocation, priority strategy, and milestones tailored specifically for ${name}.",
  "recommendedDailyMinutes": ${hrs * 60},
  "projectedReadinessScore": 85,
  "topicPriorities": [
    {
      "topic": "Topic Name",
      "priority": "High" | "Medium" | "Low",
      "difficulty": "Easy" | "Medium" | "Hard",
      "estimatedHours": 4,
      "urgencyReason": "Why this topic is crucial for the exam",
      "keyConcepts": ["Concept 1", "Concept 2", "Key Formula/Rule"]
    }
  ],
  "dailySchedule": [
    {
      "dayNumber": 1,
      "dayTitle": "Day 1: Topic Foundation & Theory",
      "date": "Day 1",
      "timeSlot": "${preferredTime || "Evening"} (${hrs}h block)",
      "focusTarget": "Master fundamental definitions and formulas",
      "sessions": [
        {
          "time": "Session 1 (50m)",
          "topic": "Specific Topic",
          "activity": "Deep Reading & Concept Synthesis",
          "goal": "Create 1-page condensed summary with mind map",
          "durationMinutes": 50
        },
        {
          "time": "Session 2 (45m)",
          "topic": "Specific Topic",
          "activity": "Targeted Problem Sets & Active Recall",
          "goal": "Solve 5 baseline exam questions without notes",
          "durationMinutes": 45
        }
      ]
    }
  ],
  "weeklyPlan": [
    {
      "weekNumber": 1,
      "theme": "Foundation & Core Concepts",
      "milestone": "Master 60% of high-weightage topics",
      "deliverables": ["Summary notes completed", "15 practice problems", "Flashcard deck"]
    },
    {
      "weekNumber": 2,
      "theme": "Applied Problem Solving & Error Remediation",
      "milestone": "Solve intermediate-to-advanced exam problems",
      "deliverables": ["1 Timed mock test", "Error notebook review"]
    }
  ],
  "revisionSchedule": [
    {
      "stage": "Day 1 (Immediate)",
      "method": "10-minute active recall self-test before sleep",
      "timing": "Same evening"
    },
    {
      "stage": "Day 3 (Reinforcement)",
      "method": "Solve 5 practice problems from memory without reference notes",
      "timing": "After 48 hours"
    },
    {
      "stage": "Day 7 (Consolidation)",
      "method": "Flashcard sprint & Feynman technique explanation",
      "timing": "End of week"
    },
    {
      "stage": "Day 14 (Long-term Retention)",
      "method": "Timed mixed-topic mock simulation",
      "timing": "Pre-exam sprint"
    }
  ],
  "practiceSchedule": [
    {
      "phase": "Diagnostic Check",
      "recommendedResource": "End-of-chapter quiz",
      "targetScore": "75%+"
    },
    {
      "phase": "Timed Sectional Drills",
      "recommendedResource": "Past paper question banks",
      "targetScore": "85%+"
    },
    {
      "phase": "Full Simulated Exam",
      "recommendedResource": "Official past exam papers under timed conditions",
      "targetScore": "90%+"
    }
  ],
  "examPreparationStrategy": [
    "High-yield rule 1 on time management during the actual test",
    "High-yield rule 2 on avoiding common exam traps for ${subject}",
    "High-yield rule 3 on memory retention and rest before exam day"
  ]
}
Provide at least 3-5 daily schedule breakdown days covering the topics sequentially. Ensure JSON is strictly valid.`;

    const { response, modelUsed } = await generateContentWithRetryAndFallback(ai, {
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are FocusGuard's expert academic schedule architect and cognitive learning specialist.",
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText.trim());
    return res.json({ plan: parsed, isFallback: false, modelUsed });
  } catch (error: any) {
    console.error("AI Planner error:", error);
    const {
      studentName,
      subject,
      topics,
      topicList,
      examDate,
      daysAvailable,
      hoursPerDay,
      difficulty,
      topicDifficulty,
      dailyTarget,
      preferredTime,
      notes,
    } = req.body;
    const topicsString = Array.isArray(topicList) && topicList.length > 0 ? topicList.join(", ") : (topics || "");
    const fallbackPlan = generateFallbackStudyPlan(
      studentName || "Student",
      subject,
      topicsString,
      examDate,
      daysAvailable,
      hoursPerDay,
      difficulty,
      topicDifficulty,
      dailyTarget,
      preferredTime,
      notes
    );
    return res.json({
      plan: fallbackPlan,
      isFallback: true,
      errorNotice: error.message || "AI response timed out; generated intelligent local study blueprint.",
    });
  }
});

// AI Assistant Endpoint (Chat, Quiz, Flashcards, Summaries, Explanations)
app.post("/api/ai/assistant", async (req, res) => {
  try {
    const { mode, subject, input, query, options } = req.body;

    if (!input && !query) {
      return res.status(400).json({ error: "Input text or query is required" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Provide intelligent fallback for the specific mode
      const fallbackResult = generateFallbackAssistantResponse(mode, subject || "Study Topic", input || query, options);
      return res.json({
        result: fallbackResult,
        isFallback: true,
        message: "Generated using built-in study assistant knowledge engine.",
      });
    }

    let prompt = "";
    let systemInstruction = "You are FocusGuard's intelligent, student-friendly AI Study Assistant.";

    switch (mode) {
      case "quiz":
      case "mcq":
        prompt = `Generate 5 high-quality, exam-oriented Multiple Choice Questions (MCQs) for subject/topic: "${subject || 'General Study'}" based on this content/request:
"${input || query}"

Output strictly a JSON object matching this schema:
{
  "title": "Interactive Quiz: ${subject || 'Study Assessment'}",
  "totalQuestions": 5,
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correctIndex": 0,
      "explanation": "Clear explanation of why this answer is correct and why other options are wrong.",
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}`;
        break;

      case "summarize":
        prompt = `Summarize the following study notes/text clearly for a student preparing for tests:
"${input || query}"

Include:
1. Executive 2-sentence Overview
2. Key Core Takeaways (bulleted)
3. Essential Definitions / Terminology
4. High-Yield Exam Memorization Points
5. 3 Rapid Self-Check Questions with answers.`;
        break;

      case "explain":
      case "simple_explain":
        prompt = `Explain this difficult concept/topic to a student in simple, intuitive terms:
"${input || query}"
${subject ? `Subject: ${subject}` : ""}

Structure your explanation as:
1. Quick Simple Definition (Explain like I'm 15)
2. Concrete Real-World Analogy (e.g. comparing to daily life or technology)
3. Step-by-Step Breakdown of how it works
4. Common Mistakes/Misconceptions to avoid
5. Quick Memory Hook or Mnemonic.`;
        break;

      case "important_questions":
        prompt = `Generate a curated set of the top 5 most important, high-yield exam questions for:
Topic: "${input || query}"
${subject ? `Subject: ${subject}` : ""}

For each question provide:
- The Question
- Expected Marks / Difficulty
- Model Answer Outline (Key points required for full marks)
- Marking Rubric / Key keywords examiners look for.`;
        break;

      case "flashcards":
        prompt = `Create 6 effective flashcards based on this content/topic:
"${input || query}"
${subject ? `Subject: ${subject}` : ""}

Output strictly a JSON object matching:
{
  "deckTitle": "Flashcards: ${subject || 'Key Concepts'}",
  "cards": [
    {
      "id": "c1",
      "front": "Front of card (Concept, Term, or Question)",
      "back": "Back of card (Clear, concise answer or definition)",
      "hint": "Optional memory clue or acronym"
    }
  ]
}`;
        break;

      case "short_answer":
        prompt = `Generate 4 short-answer test questions with ideal model answers for:
"${input || query}"
${subject ? `Subject: ${subject}` : ""}

Provide question, model 3-4 sentence answer, and key marks criteria.`;
        break;

      case "revision_notes":
        prompt = `Generate a comprehensive "Cheat-Sheet" high-yield revision note for:
"${input || query}"
${subject ? `Subject: ${subject}` : ""}

Format with clean Markdown, bold headers, formulas/key principles, visual ASCII diagrams or structured comparison tables where helpful.`;
        break;

      default:
        // Freeform chat / tutor
        prompt = `You are a supportive, insightful academic tutor for FocusGuard.
Student question/request: "${input || query}"
${subject ? `Subject context: ${subject}` : ""}

Answer clearly, encourage active recall, give structured bullet points, and offer a follow-up practice question.`;
        break;
    }

    const isJsonMode = mode === "quiz" || mode === "mcq" || mode === "flashcards";

    const { response, modelUsed } = await generateContentWithRetryAndFallback(ai, {
      contents: prompt,
      config: {
        systemInstruction,
        ...(isJsonMode ? { responseMimeType: "application/json" } : {}),
      },
    });

    const responseText = response.text || "";

    if (isJsonMode) {
      try {
        const parsed = JSON.parse(responseText.trim());
        return res.json({ result: parsed, rawText: responseText, mode, isFallback: false, modelUsed });
      } catch (err) {
        return res.json({ result: responseText, mode, isFallback: false, modelUsed });
      }
    }

    return res.json({ result: responseText, mode, isFallback: false, modelUsed });
  } catch (error: any) {
    console.error("AI Assistant error:", error);
    const { mode, subject, input, query, options } = req.body;
    const fallbackResult = generateFallbackAssistantResponse(mode, subject || "Study Topic", input || query, options);
    return res.json({
      result: fallbackResult,
      isFallback: true,
      errorNotice: error.message || "AI service temporarily busy; switched to built-in knowledge base.",
    });
  }
});

// AI Syllabus to Tasks Generator Endpoint (Multimodal PDF + Text Syllabus)
app.post("/api/ai/syllabus-to-tasks", async (req, res) => {
  try {
    const {
      pdfBase64,
      mimeType,
      text,
      studentName,
      subjectHint,
      daysAvailable,
      hoursPerDay,
      difficulty,
      examDate,
    } = req.body;

    const name = studentName || "Student";
    const days = Number(daysAvailable || 14);
    const hrs = Number(hoursPerDay || 3);
    const diff = difficulty || "Intermediate";
    const targetDate = examDate || `In ${days} days`;

    if (!pdfBase64 && (!text || text.trim().length === 0)) {
      return res.status(400).json({ error: "Please upload a syllabus PDF or provide syllabus text." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      const fallbackResult = generateFallbackSyllabusTasks(
        text || "",
        subjectHint,
        days,
        hrs,
        name,
        diff,
        targetDate
      );
      return res.json({
        ...fallbackResult,
        isFallback: true,
        message: "Generated using built-in intelligent syllabus parser engine.",
      });
    }

    const todayDate = new Date().toISOString().split("T")[0];

    const promptInstructions = `You are FocusGuard's intelligent Academic Syllabus Deconstruction and Task Generator Engine.
Your job is to read and analyze the provided syllabus (from PDF document or text) and transform it into a structured, highly actionable study roadmap and task list.

Student Context:
- Student Name: ${name}
- Target/Exam Date: ${targetDate}
- Total Days Available for Study: ${days} days
- Daily Available Study Hours: ${hrs} hours/day
- Target Academic Level: ${diff}
- Starting Date for Schedule: ${todayDate}
${subjectHint ? `- Subject Hint provided: ${subjectHint}` : ""}
${text ? `\nExtracted Syllabus Text:\n"""\n${text}\n"""` : ""}

Analyze the syllabus thoroughly. Identify:
1. Exact Subject / Course Name & Code
2. Overall Scope Summary
3. All Units / Modules / Chapters with weightage and difficulty
4. Concrete, granular study tasks (generate 6 to 14 sequential tasks) covering every major topic across the ${days} available days.

Each task MUST have:
- "title": Specific, descriptive title with Unit name (e.g., "Unit 1: Linear Data Structures - Arrays & Stacks Foundation")
- "category": One of "Study", "Assignment", "Revision", "Project", "Exam Prep"
- "priority": One of "High", "Medium", "Urgent", "Low"
- "estimatedMinutes": Realistic study duration in minutes (e.g. 45, 60, 90, 120)
- "dueDate": Calculated distributed calendar date in YYYY-MM-DD format (starting from today ${todayDate} and progressing across ${days} days)
- "subject": Identified subject name
- "moduleName": The unit/chapter name this task belongs to
- "notes": High-yield takeaways, formulas, definitions, or exam cautions for this topic
- "subtasks": An array of 3 to 4 actionable checklist steps (e.g., [{"id": "st-1", "title": "Read core theory & concepts", "completed": false}])

Output ONLY valid JSON matching this exact schema:
{
  "subject": "Subject Name",
  "courseCode": "Course Code or N/A",
  "overview": "Comprehensive 2-3 sentence overview of the syllabus structure and key exam priorities.",
  "totalEstimatedHours": ${days * hrs},
  "modules": [
    {
      "unitNumber": 1,
      "unitTitle": "Unit 1 Title",
      "topics": ["Topic 1", "Topic 2", "Topic 3"],
      "estimatedHours": 6,
      "weightagePercentage": 20,
      "difficulty": "Medium"
    }
  ],
  "tasks": [
    {
      "id": "task-syl-1",
      "title": "Unit 1: ...",
      "category": "Study",
      "priority": "High",
      "estimatedMinutes": 60,
      "dueDate": "${todayDate}",
      "subject": "Subject Name",
      "moduleName": "Unit 1 Title",
      "notes": "Key definitions and formulas to memorize",
      "subtasks": [
        { "id": "st-1-1", "title": "Read fundamental concepts and create 1-page notes", "completed": false },
        { "id": "st-1-2", "title": "Solve 5 baseline practice problems", "completed": false },
        { "id": "st-1-3", "title": "Self-test using active recall", "completed": false }
      ]
    }
  ]
}`;

    const contents: any[] = [];
    if (pdfBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || "application/pdf",
          data: pdfBase64,
        },
      });
    }
    contents.push({
      text: promptInstructions,
    });

    const { response, modelUsed } = await generateContentWithRetryAndFallback(ai, {
      contents: contents.length === 1 ? contents[0].text : { parts: contents },
      config: {
        responseMimeType: "application/json",
        systemInstruction: "You are FocusGuard's expert Academic Curriculum and Syllabus Parser. You deconstruct syllabi and structure them into high-impact student task schedules.",
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText.trim());

    // Ensure all tasks have unique IDs and proper dates
    if (Array.isArray(parsed.tasks)) {
      parsed.tasks = parsed.tasks.map((task: any, idx: number) => {
        const dayOffset = Math.min(days - 1, Math.floor((idx / Math.max(1, parsed.tasks.length)) * days));
        const targetDateObj = new Date();
        targetDateObj.setDate(targetDateObj.getDate() + dayOffset);
        const autoDueDate = targetDateObj.toISOString().split("T")[0];

        return {
          id: task.id || `task-syl-${Date.now()}-${idx}`,
          title: task.title || `Study Task ${idx + 1}`,
          category: task.category || "Study",
          priority: task.priority || (idx < 2 ? "High" : "Medium"),
          estimatedMinutes: Number(task.estimatedMinutes) || 45,
          dueDate: task.dueDate || autoDueDate,
          subject: task.subject || parsed.subject || subjectHint || "Study Course",
          moduleName: task.moduleName || `Module ${Math.floor(idx / 2) + 1}`,
          notes: task.notes || "Master core concepts and solve textbook problems.",
          subtasks: Array.isArray(task.subtasks) && task.subtasks.length > 0
            ? task.subtasks
            : [
                { id: `st-${idx}-1`, title: "Read core theory and synthesize definitions", completed: false },
                { id: `st-${idx}-2`, title: "Solve practice questions and worked examples", completed: false },
                { id: `st-${idx}-3`, title: "Review formula sheet & active recall", completed: false },
              ],
          selected: true,
        };
      });
    }

    return res.json({
      subject: parsed.subject || subjectHint || "Imported Syllabus",
      courseCode: parsed.courseCode,
      overview: parsed.overview || "Syllabus parsed and task roadmap generated successfully.",
      totalEstimatedHours: parsed.totalEstimatedHours || days * hrs,
      modules: parsed.modules || [],
      tasks: parsed.tasks || [],
      isFallback: false,
      modelUsed,
    });
  } catch (error: any) {
    console.error("AI Syllabus to Tasks error:", error);
    const {
      text,
      subjectHint,
      daysAvailable,
      hoursPerDay,
      studentName,
      difficulty,
      examDate,
    } = req.body;

    const fallbackResult = generateFallbackSyllabusTasks(
      text || "",
      subjectHint,
      Number(daysAvailable || 14),
      Number(hoursPerDay || 3),
      studentName || "Student",
      difficulty || "Intermediate",
      examDate
    );

    return res.json({
      ...fallbackResult,
      isFallback: true,
      errorNotice: error.message || "AI parsing timed out; generated structured tasks using intelligent curriculum engine.",
    });
  }
});

// Helper: Fallback Syllabus to Tasks Generator
function generateFallbackSyllabusTasks(
  rawText: string,
  subjectHint?: string,
  daysAvailable: number = 14,
  hoursPerDay: number = 3,
  studentName: string = "Student",
  difficulty: string = "Intermediate",
  examDate?: string
) {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Detect subject name
  let detectedSubject = subjectHint || "Academic Syllabus Course";
  for (const line of lines.slice(0, 8)) {
    if (/^(Course|Subject|Module|Topic|Paper|Class)\s*[:\-]/i.test(line)) {
      detectedSubject = line.replace(/^(Course|Subject|Module|Topic|Paper|Class)\s*[:\-]\s*/i, "").trim();
      break;
    } else if (line.length > 3 && line.length < 60 && !line.startsWith("-") && !line.startsWith("Unit")) {
      detectedSubject = line;
      break;
    }
  }

  // Parse units/modules
  interface ExtractedUnit {
    title: string;
    topics: string[];
  }
  const units: ExtractedUnit[] = [];
  let currentUnit: ExtractedUnit | null = null;

  for (const line of lines) {
    const isUnitHeader = /^(Unit|Module|Chapter|Section|Part)\s*[0-9IVXLC]+\s*[:\-]/i.test(line) ||
      /^Chapter\s+[0-9]+/i.test(line) ||
      /^[0-9]+\.\s+[A-Z]/i.test(line);

    if (isUnitHeader) {
      if (currentUnit && (currentUnit.topics.length > 0 || currentUnit.title)) {
        units.push(currentUnit);
      }
      currentUnit = {
        title: line,
        topics: [],
      };
    } else if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*") || /^[a-z0-9]\)/i.test(line)) {
      const cleanedTopic = line.replace(/^[\-\•\*\d\.\)\s]+/, "").trim();
      if (cleanedTopic) {
        if (!currentUnit) {
          currentUnit = { title: "Unit 1: Core Syllabus Concepts", topics: [] };
        }
        currentUnit.topics.push(cleanedTopic);
      }
    } else if (currentUnit && line.length > 5) {
      currentUnit.topics.push(line);
    }
  }

  if (currentUnit) {
    units.push(currentUnit);
  }

  // If no structured units detected, create default modules
  if (units.length === 0) {
    units.push(
      { title: "Unit 1: Foundations & Core Principles", topics: ["Basic definitions", "Foundational theorems", "Core mechanisms"] },
      { title: "Unit 2: Applied Methodologies & Problem Solving", topics: ["Standard problem models", "Worked examples", "Formula derivations"] },
      { title: "Unit 3: Advanced Concepts & System Integration", topics: ["Complex multi-part questions", "Edge cases and boundary rules", "Case studies"] },
      { title: "Unit 4: Exam Revision & Timed Practice", topics: ["Past paper drills", "Formula cheat sheet synthesis", "Mock tests"] }
    );
  }

  const today = new Date();
  const generatedTasks: any[] = [];
  let taskCounter = 1;

  units.forEach((unit, uIdx) => {
    // Break each unit into 2-3 focused tasks (Theory/Concepts, Deep Problem Solving, Revision)
    const unitTitleClean = unit.title.replace(/^(Unit|Module|Chapter|Section)\s*[0-9IVXLC]*\s*[:\-]?\s*/i, "").trim() || `Unit ${uIdx + 1}`;

    // Task 1: Theory & Concept Mastery
    const dayOffset1 = Math.min(daysAvailable - 1, Math.floor(((taskCounter - 1) / Math.max(1, units.length * 2)) * daysAvailable));
    const dateObj1 = new Date(today);
    dateObj1.setDate(dateObj1.getDate() + dayOffset1);

    generatedTasks.push({
      id: `task-syl-f-${taskCounter}`,
      title: `Unit ${uIdx + 1}: ${unitTitleClean} - Theory & Core Concepts`,
      category: "Study",
      priority: uIdx === 0 ? "High" : "Medium",
      estimatedMinutes: 60,
      dueDate: dateObj1.toISOString().split("T")[0],
      subject: detectedSubject,
      moduleName: unit.title,
      notes: unit.topics.slice(0, 4).join("; ") || "Master definitions and foundational principles.",
      subtasks: [
        { id: `st-${taskCounter}-1`, title: `Read theory notes for ${unitTitleClean}`, completed: false },
        { id: `st-${taskCounter}-2`, title: "Highlight key formulas & make 1-page condensed summary", completed: false },
        { id: `st-${taskCounter}-3`, title: "Self-test on core definitions with active recall", completed: false },
      ],
      selected: true,
    });
    taskCounter++;

    // Task 2: Applied Practice & Problem Sets
    const dayOffset2 = Math.min(daysAvailable - 1, Math.floor(((taskCounter - 1) / Math.max(1, units.length * 2)) * daysAvailable));
    const dateObj2 = new Date(today);
    dateObj2.setDate(dateObj2.getDate() + dayOffset2);

    generatedTasks.push({
      id: `task-syl-f-${taskCounter}`,
      title: `Unit ${uIdx + 1}: ${unitTitleClean} - Practice Problems & Numerical Drills`,
      category: uIdx % 2 === 0 ? "Assignment" : "Exam Prep",
      priority: "High",
      estimatedMinutes: 90,
      dueDate: dateObj2.toISOString().split("T")[0],
      subject: detectedSubject,
      moduleName: unit.title,
      notes: "Solve textbook problems and analyze error patterns.",
      subtasks: [
        { id: `st-${taskCounter}-1`, title: "Solve 5 standard textbook / lecture problems", completed: false },
        { id: `st-${taskCounter}-2`, title: "Work through 2 advanced / past exam questions", completed: false },
        { id: `st-${taskCounter}-3`, title: "Log any mistakes in your error notebook", completed: false },
      ],
      selected: true,
    });
    taskCounter++;
  });

  // Final Comprehensive Mock Exam / Revision Task
  const finalDate = new Date(today);
  finalDate.setDate(finalDate.getDate() + Math.max(0, daysAvailable - 1));
  generatedTasks.push({
    id: `task-syl-f-${taskCounter}`,
    title: `Final Review: ${detectedSubject} - Timed Mock Exam Simulation`,
    category: "Revision",
    priority: "Urgent",
    estimatedMinutes: 120,
    dueDate: finalDate.toISOString().split("T")[0],
    subject: detectedSubject,
    moduleName: "Full Course Review",
    notes: "Timed past-year question paper simulation without notes.",
    subtasks: [
      { id: `st-${taskCounter}-1`, title: "Review flashcards & master formula sheet", completed: false },
      { id: `st-${taskCounter}-2`, title: "Simulate 1 full timed past exam paper", completed: false },
      { id: `st-${taskCounter}-3`, title: "Review error log for high-yield correction points", completed: false },
    ],
    selected: true,
  });

  return {
    subject: detectedSubject,
    courseCode: "ACAD-101",
    overview: `Syllabus structured across ${units.length} key modules and ${generatedTasks.length} sequential study tasks for ${studentName} covering ${daysAvailable} days.`,
    totalEstimatedHours: daysAvailable * hoursPerDay,
    modules: units.map((u, i) => ({
      unitNumber: i + 1,
      unitTitle: u.title,
      topics: u.topics.slice(0, 6),
      estimatedHours: Math.max(3, Math.round((daysAvailable * hoursPerDay) / units.length)),
      weightagePercentage: Math.round(100 / units.length),
      difficulty: i === 0 ? "Medium" : i === 1 ? "Hard" : "Medium",
    })),
    tasks: generatedTasks,
  };
}

// Helper: Fallback Study Plan Generator
function generateFallbackStudyPlan(
  studentName?: string,
  subject?: string,
  topics?: string,
  examDate?: string,
  daysAvailable?: number,
  hoursPerDay?: number,
  difficulty?: string,
  topicDifficulty?: string,
  dailyTarget?: string,
  preferredTime?: string,
  notes?: string
) {
  const sub = subject || "Academic Course";
  const name = studentName || "Student";
  const topicList = (topics || "")
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const mainTopics = topicList.length > 0 ? topicList : ["Core Foundations", "Problem Solving", "Advanced Review"];
  const hrs = Number(hoursPerDay || 3);
  const days = Number(daysAvailable || 14);

  return {
    studentName: name,
    title: `${sub} Master Exam Preparation Blueprint`,
    subject: sub,
    topics: topics || mainTopics.join(", "),
    examDate: examDate || "In 3 weeks",
    daysAvailable: days,
    hoursPerDay: hrs,
    dailyTarget: dailyTarget || "Cover 1 core topic + 5 practice problems",
    difficultyLevel: difficulty || "Intermediate",
    preferredTime: preferredTime || "Evening",
    summary: `Personalized ${hrs}h daily study regimen designed for ${name} at ${difficulty || "Intermediate"} level in ${sub}. Uses spaced-repetition intervals and active problem drills to maximize exam scores by ${examDate || "target date"}.`,
    recommendedDailyMinutes: hrs * 60,
    projectedReadinessScore: 84,
    topicPriorities: mainTopics.map((topic, i) => ({
      topic: topic,
      priority: i === 0 ? "High" : i === 1 ? "High" : i % 2 === 0 ? "Medium" : "Low",
      difficulty: topicDifficulty || (i === 0 ? "Medium" : i === 1 ? "Hard" : "Easy"),
      estimatedHours: Math.max(3, Math.round((hrs * 7) / (mainTopics.length || 1))),
      urgencyReason: i === 0 ? "Core foundational prerequisite for multiple exam sections" : "High probability exam question topic",
      keyConcepts: [`${topic} Definitions & Core Principles`, `Applied Problem Solving in ${topic}`, `Common Traps & Edge Cases`],
    })),
    dailySchedule: [
      {
        dayNumber: 1,
        dayTitle: `Day 1: Theory Mastery in ${mainTopics[0] || sub}`,
        date: "Day 1",
        timeSlot: `${preferredTime || "Evening"} (${hrs} Hours total)`,
        focusTarget: "Master fundamental definitions and formulas",
        sessions: [
          {
            time: "Session 1 (50m)",
            topic: mainTopics[0] || sub,
            activity: "Active Reading & Concept Synthesis",
            goal: "Produce 1-page condensed summary with mind map",
            durationMinutes: 50,
          },
          {
            time: "Session 2 (45m)",
            topic: mainTopics[0] || sub,
            activity: "Deep Practice & Worked Examples",
            goal: "Complete 5 standard exam problems without notes",
            durationMinutes: 45,
          },
          {
            time: "Session 3 (30m)",
            topic: "Review & Recall",
            activity: "Self-Testing & Flashcard Sprint",
            goal: "Verify recall of key terms and solve 1 hard problem",
            durationMinutes: 30,
          },
        ],
      },
      {
        dayNumber: 2,
        dayTitle: `Day 2: Deep Dive into ${mainTopics[1] || mainTopics[0] || sub}`,
        date: "Day 2",
        timeSlot: `${preferredTime || "Evening"} (${hrs} Hours total)`,
        focusTarget: "Solve intermediate questions and analyze error patterns",
        sessions: [
          {
            time: "Session 1 (50m)",
            topic: mainTopics[1] || mainTopics[0] || sub,
            activity: "Theoretical Foundations & Key Mechanisms",
            goal: "Master core formulas and relationship graphs",
            durationMinutes: 50,
          },
          {
            time: "Session 2 (50m)",
            topic: mainTopics[1] || mainTopics[0] || sub,
            activity: "Targeted Problem Sets",
            goal: "Complete 8 intermediate practice questions",
            durationMinutes: 50,
          },
        ],
      },
      {
        dayNumber: 3,
        dayTitle: `Day 3: Advanced Application & Spaced Review`,
        date: "Day 3",
        timeSlot: `${preferredTime || "Evening"} (${hrs} Hours total)`,
        focusTarget: "Synthesize Day 1 & Day 2 concepts into mixed practice sets",
        sessions: [
          {
            time: "Session 1 (50m)",
            topic: mainTopics[2] || mainTopics[0] || sub,
            activity: "Advanced Application Problems",
            goal: "Solve multi-concept exam questions",
            durationMinutes: 50,
          },
          {
            time: "Session 2 (40m)",
            topic: "Spaced Review",
            activity: "Active Recall Flashcards & Error Log Review",
            goal: "Solidify Day 1 topics without reference materials",
            durationMinutes: 40,
          },
        ],
      },
    ],
    weeklyPlan: [
      {
        weekNumber: 1,
        theme: "Core Principles & Foundation Topics",
        milestone: "Master 100% of basic definitions and 50% high-yield problems",
        deliverables: ["Summaries for high-priority topics", "15 practice problems", "Flashcard deck created"],
      },
      {
        weekNumber: 2,
        theme: "Application, Multi-concept Problems & Timed Practice",
        milestone: "Solve mixed difficulty questions under simulated time pressure",
        deliverables: ["1 Timed sectional mock test", "Error log review & corrections"],
      },
      {
        weekNumber: 3,
        theme: "Spaced Repetition & Full Exam Simulation",
        milestone: "Achieve 85%+ score on full length mock exam",
        deliverables: ["2 Full past paper simulations", "Final formula cheat sheet review"],
      },
    ],
    revisionSchedule: [
      {
        stage: "Day 1 (Immediate)",
        method: "Active recall & 10m self-quiz before sleep",
        timing: "End of daily study session",
      },
      {
        stage: "Day 3 (Reinforcement)",
        method: "Solve 5 practice problems from memory without reference notes",
        timing: "48 Hours post initial study",
      },
      {
        stage: "Day 7 (Consolidation)",
        method: "Spaced Flashcard sprint & Feynman technique explanation",
        timing: "End of Week 1",
      },
      {
        stage: "Day 14 (Long-term Retention)",
        method: "Mixed-topic timed simulation test",
        timing: "Week 2 Review Day",
      },
    ],
    practiceSchedule: [
      {
        phase: "Foundational Check",
        recommendedResource: "Textbook end-of-section questions",
        targetScore: "80%+",
      },
      {
        phase: "Speed & Accuracy Sprint",
        recommendedResource: "Past exam topic-wise papers",
        targetScore: "85%+",
      },
      {
        phase: "Full Exam Simulation",
        recommendedResource: "Timed previous years actual tests",
        targetScore: "90%+",
      },
    ],
    examPreparationStrategy: [
      "Rule of 3: Always solve past questions under strict exam timing (1.2 minutes per mark).",
      "Error Log Strategy: Keep a dedicated red notebook for every mistake made in practice; review it daily.",
      "The 24h Pre-Exam Wind-down: Do not learn new topics within 24h of the test; only review flashcards and formula sheets.",
    ],
  };
}

// Helper: Fallback Assistant Generator
function generateFallbackAssistantResponse(mode: string, subject: string, input: string, options?: any) {
  if (mode === "quiz" || mode === "mcq") {
    return {
      title: `Practice Quiz: ${subject}`,
      totalQuestions: 4,
      questions: [
        {
          id: "q1",
          question: `What is the primary fundamental principle behind "${input.slice(0, 40)}..."?`,
          options: [
            "A. Systematic theoretical derivation and empirical verification",
            "B. Random iteration without controlled parameters",
            "C. Purely qualitative observation with no quantifiable metrics",
            "D. External manual override without automated state management",
          ],
          correctIndex: 0,
          explanation: "Systematic theoretical derivation combined with empirical verification forms the foundation of this academic principle.",
          difficulty: "Medium",
        },
        {
          id: "q2",
          question: `Which technique is proven by cognitive science to maximize retention for ${subject}?`,
          options: [
            "A. Passive re-reading multiple times",
            "B. Active recall combined with spaced repetition",
            "C. Cramming for 8 consecutive hours before the exam",
            "D. Highlighting entire textbook pages in neon yellow",
          ],
          correctIndex: 1,
          explanation: "Active recall and spaced repetition strengthen neural pathways and prevent the Ebbinghaus forgetting curve.",
          difficulty: "Easy",
        },
        {
          id: "q3",
          question: "When approaching a multi-step analytical problem, what is the best first step?",
          options: [
            "A. Immediately calculate the final numerical answer",
            "B. Identify given parameters, required output, and core governing relations",
            "C. Guess based on the closest answer choice",
            "D. Skip the question entirely",
          ],
          correctIndex: 1,
          explanation: "Deconstructing given parameters and establishing the governing equation avoids calculation errors.",
          difficulty: "Medium",
        },
        {
          id: "q4",
          question: "How does the Pomodoro technique optimize cognitive endurance during study?",
          options: [
            "A. Eliminates all need for revision",
            "B. Balances focused deep work intervals with structured synaptic recovery breaks",
            "C. Forces studying without eating or drinking",
            "D. Guarantees 100% test scores without practice",
          ],
          correctIndex: 1,
          explanation: "25-minute focus intervals prevent mental fatigue while short breaks restore attention span and working memory.",
          difficulty: "Easy",
        },
      ],
    };
  }

  if (mode === "flashcards") {
    return {
      deckTitle: `Flashcard Deck: ${subject}`,
      cards: [
        {
          id: "c1",
          front: `Core Definition: ${input.slice(0, 35)}...`,
          back: "The fundamental concept governing this topic, characterized by systematic structure, clear input-output mapping, and empirical validation.",
          hint: "Think about foundational mechanics",
        },
        {
          id: "c2",
          front: "What is Spaced Repetition?",
          back: "A learning technique where reviews are scheduled at increasing intervals (Day 1, 3, 7, 14) to cement knowledge into long-term memory.",
          hint: "Beats the forgetting curve",
        },
        {
          id: "c3",
          front: "What is the Feynman Technique?",
          back: "Explaining a concept in simple, plain language to identify gaps in your understanding.",
          hint: "Teach it to a 10-year-old",
        },
        {
          id: "c4",
          front: "Key Exam Strategy for Problem Solving",
          back: "1. State knowns/unknowns. 2. Write governing formula. 3. Substitute with units. 4. Sanity check magnitude.",
          hint: "4-step execution",
        },
      ],
    };
  }

  if (mode === "summarize") {
    return `### 📌 Executive Summary: ${subject}

**Overview:**
This material establishes the core principles, methodologies, and analytical approaches for **${subject}**. It highlights the relationship between foundational definitions and practical problem-solving.

---

### 🔑 Key Takeaways
- **Foundational Concept:** ${input.slice(0, 100)}...
- **Core Formula / Relationship:** Systematic mapping between input variables and expected outcomes.
- **Critical Caveat:** Watch out for boundary conditions and unit conversions during tests.
- **High-Yield Fact:** Memorize the direct step-by-step derivation for exam section B.

---

### 💡 High-Yield Exam Checklist
1. **Definition:** Ability to state the definition in 2 concise sentences with correct technical terminology.
2. **Application:** Solved at least 3 numerical / analytical sample problems.
3. **Common Trap:** Avoid confusing dependent variables with independent constants.`;
  }

  if (mode === "explain" || mode === "simple_explain") {
    return `### 🎯 Simple Explanation: ${input}

#### 1. The 10-Second Summary (ELI15)
Imagine you are building a Lego castle. Instead of dumping all 1,000 blocks on the floor at once and getting overwhelmed, you organize them by color and build step-by-step using clear instructions. That's essentially what **${input}** does for ${subject}!

#### 2. Real-World Analogy 🚗
Think of it like the cruise control in a modern car:
- **Input:** Your desired speed (target).
- **Sensor:** Checks current road speed.
- **Engine Controller:** Automatically adjusts fuel to keep you smooth and steady without jerky acceleration.

#### 3. Step-by-Step Breakdown
1. **Initiation:** The baseline condition is established with given constraints.
2. **Transformation:** The core mechanism acts on the inputs.
3. **Equilibrium / Output:** The final state is reached and verified against governing rules.

#### 4. Common Student Misconceptions ⚠️
- *Mistake:* Assuming that higher complexity means better results.
- *Fact:* In exams, clean, direct application of fundamental laws receives maximum marks.

#### 5. Quick Memory Hook (Mnemonic)
Remember **F-O-C-U-S**: **F**oundation $\\rightarrow$ **O**peration $\\rightarrow$ **C**heck units $\\rightarrow$ **U**nify terms $\\rightarrow$ **S**tate answer!`;
  }

  if (mode === "revision_notes") {
    return `# 📝 FocusGuard Master Revision Notes: ${subject}

### 1. High-Yield Summary
- **Topic:** ${input}
- **Exam Weightage:** High Priority (Appears frequently in Section A & B)
- **Target Mastery Time:** 45 minutes

---

### 2. Core Concepts & Definitions
| Concept | Definition | Key Formula / Rule |
|---|---|---|
| **Primary Law** | Governing principle defining behavior under standard conditions | $E = mc^2$ or equivalent relation |
| **Secondary Mechanism** | The pathway through which transformation occurs | Rate $\\propto$ Concentration |
| **Boundary Limit** | Extreme values where the simplified model breaks down | $T \\rightarrow 0$ or $x \\rightarrow \\infty$ |

---

### 3. Step-by-Step Problem Solving Framework
1. **Extract Variables:** List all given values with SI units.
2. **Select Equation:** Match given parameters to the governing theorem.
3. **Execute Algebra:** Isolate the target variable before plugging in numbers.
4. **Sanity Check:** Check sign, dimension, and physical plausibility.

---

### 4. Top 3 Exam Traps
- Forgetting to convert minutes to seconds or degrees to radians.
- Dropping negative signs during algebraic expansion.
- Skipping the final units in the answer statement.`;
  }

  // Default chat response
  return `Hello! As your FocusGuard Study Assistant, I'm here to help you master **${subject || "your studies"}**.

Regarding **"${input}"**:

Here are three key insights to keep in mind:
1. **Core Principle:** Focus on understanding *why* the concept works rather than memorizing isolated lines.
2. **Active Application:** Try writing down the explanation in your own words without looking at notes.
3. **Exam Readiness:** Solve at least 2 past-paper questions under timed conditions.

Would you like me to generate a **5-question practice quiz**, create **flashcards**, or **explain a specific part in simpler terms**?`;
}

// Setup Vite middleware
async function startServer() {
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
    console.log(`FocusGuard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
