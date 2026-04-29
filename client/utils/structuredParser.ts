export interface ParsedAnalysis {
  classification: {
    documentType: string;
    relevanceScore: string;
    confidenceScore: string;
    jurisdiction: string;
    urgencyLevel: string;
    importanceScore: string;
  };
  executiveSummary: string[];
  keyClauses: { title: string; summary: string }[];
  risks: { riskLevel: string; score?: number; explanation: string; mitigation: string }[];
  pages: { pageNumber: string; topics: string; clauses: string; risks: string; summary: string }[];
  entities: { category: string; items: string[] }[];
  timeline: { date: string; event: string; importance: string }[];
  definitions: { term: string; definition: string }[];
  relationships: { relationship: string; type: string }[];
  actionableInsights: string[];
  finalAssessment: {
    overallRisk: string;
    importance: string;
    primaryRecommendation: string;
  };
}

export const parseLLMSummary = (text: string): ParsedAnalysis => {
  const result: ParsedAnalysis = {
    classification: {
      documentType: "General Legal Document",
      relevanceScore: "N/A",
      confidenceScore: "85",
      jurisdiction: "Not detected",
      urgencyLevel: "Medium",
      importanceScore: "70"
    },
    executiveSummary: [],
    keyClauses: [],
    risks: [],
    pages: [],
    entities: [],
    timeline: [],
    definitions: [],
    relationships: [],
    actionableInsights: [],
    finalAssessment: {
      overallRisk: "Medium",
      importance: "Normal",
      primaryRecommendation: "Legal review advised"
    }
  };

  if (!text) return result;

  // Utility to extract numeric values safely
  const safeParseScore = (val: string, fallback: string) => {
    const num = val.replace(/[^0-9]/g, '');
    return num || fallback;
  };

  // NEW: JSON Detection & Extraction
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*"timeline"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const jsonData = JSON.parse(jsonStr);
      
      if (jsonData.timeline) result.timeline = jsonData.timeline;
      if (jsonData.definitions) result.definitions = jsonData.definitions;
      if (jsonData.risks) result.risks = jsonData.risks;
      if (jsonData.relationships) result.relationships = jsonData.relationships;
      if (jsonData.entities) result.entities = jsonData.entities;
      if (jsonData.actionable_insights) result.actionableInsights = jsonData.actionable_insights;
      
      if (jsonData.key_clauses) result.keyClauses = jsonData.key_clauses.map((c: any) => ({
        title: c.title || "Key Clause",
        summary: c.summary || ""
      }));

      if (jsonData.pages) result.pages = jsonData.pages.map((p: any) => ({
        pageNumber: (p.page_number || p.pageNumber || "").toString(),
        summary: p.summary || p.text || "",
        topics: p.topics || "",
        clauses: p.clauses || "",
        risks: p.risks || ""
      }));
      
      if (jsonData.classification) {
        result.classification.documentType = jsonData.classification.doc_type || result.classification.documentType;
        result.classification.relevanceScore = safeParseScore(jsonData.classification.relevance_score?.toString() || "", "95");
        result.classification.confidenceScore = safeParseScore(jsonData.classification.confidence_score?.toString() || "", "90");
        result.classification.jurisdiction = jsonData.classification.jurisdiction || result.classification.jurisdiction;
      }
      
      console.log("Successfully parsed structured JSON intelligence");
    } catch (e) {
      console.warn("Found JSON block but failed to parse:", e);
    }
  }

  const isJunkLine = (l: string) => {
    const trimmed = l.trim();
    if (!trimmed) return true;
    if (/^[^a-zA-Z0-9]{3,}$/.test(trimmed)) return true;
    const alphanumericCount = (trimmed.match(/[a-zA-Z0-9]/g) || []).length;
    return alphanumericCount < 3 && trimmed.length > 5;
  };

  const isMetadataLine = (l: string) => {
    const lower = l.toLowerCase();
    return lower.includes("document type:") || 
           lower.includes("relevance score:") || 
           lower.includes("confidence score:") || 
           lower.includes("jurisdiction:") ||
           lower.includes("risk level:") ||
           lower.includes("urgency level:");
  };

  try {
    const sectionPattern = /(?:[-*#=]{3,}\s*)?(DOCUMENT CLASSIFICATION|EXECUTIVE SUMMARY|KEY CLAUSES|LEGAL RISK ANALYSIS|URGENCY|PAGE-BY-PAGE SUMMARY|KEY ENTITIES|ACTIONABLE INSIGHTS|FINAL ASSESSMENT)(?:\s*[-*#=]{3,})?/gi;
    
    const sectionMatches = Array.from(text.matchAll(sectionPattern));
    let sections: {name: string, content: string}[] = [];
    
    if (sectionMatches.length > 0) {
      for (let i = 0; i < sectionMatches.length; i++) {
        const match = sectionMatches[i];
        const nextMatch = sectionMatches[i + 1];
        const start = match.index! + match[0].length;
        const end = nextMatch ? nextMatch.index : text.length;
        sections.push({
          name: match[1].toUpperCase(),
          content: text.substring(start, end).trim()
        });
      }
    } else {
      sections = text.split(/[-*#=]{10,}/).map(s => ({
        name: "UNKNOWN",
        content: s.trim()
      })).filter(s => s.content);
    }

    for (const section of sections) {
      const lines = section.content.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;
      
      let currentSectionName = section.name;
      
      if (currentSectionName === "UNKNOWN") {
        const firstFewLines = lines.slice(0, 3).map(l => l.toUpperCase());
        if (firstFewLines.some(l => l.includes("DOCUMENT CLASSIFICATION"))) currentSectionName = "DOCUMENT CLASSIFICATION";
        else if (firstFewLines.some(l => l.includes("EXECUTIVE SUMMARY"))) currentSectionName = "EXECUTIVE SUMMARY";
        else if (firstFewLines.some(l => (l.includes("PAGE-BY-PAGE") || l.includes("PAGE SUMMARY")))) currentSectionName = "PAGE-BY-PAGE SUMMARY";
        else if (firstFewLines.some(l => l.includes("FINAL ASSESSMENT"))) currentSectionName = "FINAL ASSESSMENT";
      }

      if (currentSectionName.includes("DOCUMENT CLASSIFICATION")) {
        lines.forEach(l => {
          if (l.includes("Document Type:")) result.classification.documentType = l.split(":")[1]?.trim() || result.classification.documentType;
          if (l.includes("Relevance Score")) result.classification.relevanceScore = safeParseScore(l.split(":")[1] || "", "95");
          if (l.includes("Confidence Score")) result.classification.confidenceScore = safeParseScore(l.split(":")[1] || "", "85");
          if (l.includes("Jurisdiction")) result.classification.jurisdiction = l.split(":")[1]?.trim() || result.classification.jurisdiction;
        });
      }
      
      else if (currentSectionName.includes("EXECUTIVE SUMMARY")) {
        // Handle long paragraphs from synthesis
        const paragraphs = section.content
          .split(/\n\s*\n/)
          .map(p => p.trim())
          .filter(p => p.length > 50 && !isMetadataLine(p) && !isJunkLine(p));
        
        if (paragraphs.length > 0) {
          result.executiveSummary = paragraphs;
        } else {
          const bullets = lines
            .filter(l => (l.startsWith("-") || l.startsWith("*") || l.startsWith("•")) && !isJunkLine(l) && !isMetadataLine(l))
            .map(l => l.replace(/^([-*•])\s*/, "").trim());
          if (bullets.length > 0) result.executiveSummary = bullets;
        }
      }

      else if (currentSectionName.includes("PAGE-BY-PAGE SUMMARY")) {
        let currentPage: any = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes("Page Number:") || line.startsWith("Page ") || line.startsWith("**Page ")) {
                if (currentPage) result.pages.push(currentPage);
                currentPage = {
                    pageNumber: line.replace(/[^0-9]/g, '').trim() || (result.pages.length + 1).toString(),
                    topics: "",
                    clauses: "",
                    risks: "",
                    summary: ""
                };
            } else if (currentPage) {
                if (line.toLowerCase().includes("summary:") || line.toLowerCase().startsWith("summary")) {
                    currentPage.summary = line.split(":")[1]?.trim() || line.replace(/^summary:?/i, '').trim();
                } else if (line.length > 5 && !line.includes("Page")) {
                    currentPage.summary += (currentPage.summary ? " " : "") + line;
                }
            }
        }
        if (currentPage) result.pages.push(currentPage);
      }
      
      else if (currentSectionName.includes("KEY CLAUSES")) {
        if (result.keyClauses.length === 0) {
          let currentClause: any = null;
          lines.forEach(l => {
            if (l.startsWith("**") || (l.includes(":") && l.length < 50)) {
               if (currentClause) result.keyClauses.push(currentClause);
               const parts = l.split(":");
               currentClause = {
                 title: parts[0].replace(/\*\*/g, "").replace(/^[-*•]\s*/, "").trim(),
                 summary: parts.slice(1).join(":").trim()
               };
            } else if (currentClause && l.length > 5) {
               currentClause.summary += (currentClause.summary ? " " : "") + l;
            }
          });
          if (currentClause) result.keyClauses.push(currentClause);
        }
      }
      
      else if (currentSectionName.includes("FINAL ASSESSMENT")) {
         lines.forEach(l => {
           if (l.includes("Overall Risk:")) result.finalAssessment.overallRisk = l.split(":")[1]?.trim() || result.finalAssessment.overallRisk;
           if (l.includes("Primary Recommendation:")) result.finalAssessment.primaryRecommendation = l.split(":")[1]?.trim() || result.finalAssessment.primaryRecommendation;
         });
      }
    }

    // Ensure pages are unique
    const seenPages = new Set();
    result.pages = result.pages.filter(p => {
       if (!p.pageNumber || seenPages.has(p.pageNumber)) return false;
       seenPages.add(p.pageNumber);
       return true;
    });

    return result;
  } catch (error) {
    console.error("Error parsing LLM summary:", error);
    return result;
  }
};
