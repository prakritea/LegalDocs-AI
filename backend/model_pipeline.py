import os
import traceback
import logging
from typing import List, Tuple, Dict, Optional
from dotenv import load_dotenv

# LangChain core and community packages
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load .env from root - forcing override to ensure .env changes are picked up
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)

# Constants
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "arcee-ai/trinity-large-preview")

logger.info(f"Loaded OPENROUTER_MODEL from env: {OPENROUTER_MODEL}")

class DocMetadata(BaseModel):
    doc_type: str = Field(description="Type of document: Contract, Judgment, Statute, etc.")
    jurisdiction: str = Field(description="Applicable jurisdiction (e.g., Delaware, India, UK)")
    parties: List[str] = Field(description="Names of the parties involved")
    definitions: Dict[str, str] = Field(description="Key defined terms and their meanings")
    sections: List[str] = Field(description="List of chapter or section headings found in the document")

class RAGManager:
    """
    Optimized for Render Free Tier (512MB RAM).
    Uses 'Stuffing' logic instead of local vector databases to save memory.
    """
    def __init__(self):
        if not OPENROUTER_API_KEY:
            raise ValueError("OPENROUTER_API_KEY not found in environment. Please check your Render environment settings.")
            
        # OpenRouter LLM setup
        model_name = os.getenv("OPENROUTER_MODEL", "arcee-ai/trinity-large-preview")
        logger.info(f"Initializing RAGManager with model: {model_name}")
        
        self.llm = ChatOpenAI(
            model=model_name,
            temperature=0.1,
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://legaldocs-ai.netlify.app", 
                "X-Title": "LegalDocs AI",
            }
        )
        self.fast_llm = ChatOpenAI(
            model=model_name, 
            temperature=0.0, 
            openai_api_key=OPENROUTER_API_KEY,
            openai_api_base="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://legaldocs-ai.netlify.app", 
                "X-Title": "LegalDocs AI",
            }
        )

    def extract_metadata(self, text: str) -> DocMetadata:
        """Uses a fast LLM pass to extract high-level legal metadata."""
        try:
            logger.info(f"Extracting legal metadata using {OPENROUTER_MODEL}...")
            # Sample only the beginning for metadata
            sample_text = text[:10000]
            
            prompt = f"""
            Analyze the following legal text excerpt and extract metadata in JSON format.
            Identify: doc_type, jurisdiction, parties (list), definitions (dict of Term: Definition), sections (list of main headings).
            
            Text:
            {sample_text}
            """
            
            # Simple metadata extraction logic to avoid structured output fragility on free models
            try:
                structured_llm = self.fast_llm.with_structured_output(DocMetadata)
                metadata = structured_llm.invoke(prompt)
                return metadata
            except Exception as e:
                logger.warning(f"Structured output failed, falling back to unstructured: {e}")
                # Fallback to a basic object if structured parsing fails
                return DocMetadata(doc_type="Legal Document", jurisdiction="Unknown", parties=[], definitions={}, sections=[])
                
        except Exception as e:
            logger.error(f"Error extracting metadata: {e}")
            return DocMetadata(doc_type="Legal Document", jurisdiction="Unknown", parties=[], definitions={}, sections=[])

    async def get_summary(self, pdf_path: str, format_type: str = "executive") -> Tuple[str, List[dict]]:
        """
        Generates a summary using a 2-pass chunked approach for maximum accuracy.
        1. Split doc into chunks.
        2. Analyze each chunk for key legal intel.
        3. Synthesize chunks into a structured final report.
        """
        try:
            logger.info(f"Processing PDF in v2.0 Chunked Mode: {pdf_path}")
            loader = PyMuPDFLoader(pdf_path)
            documents = loader.load()
            
            if not documents:
                raise ValueError("PDF extraction yielded no text.")
            
            full_text = "\n".join([doc.page_content for doc in documents])
            
            # 1. Faster metadata pre-pass for context
            doc_meta = self.extract_metadata(full_text[:10000])

            # 2. Split into chunks for deep recall
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=7000,
                chunk_overlap=600
            )
            chunks = text_splitter.split_text(full_text)
            logger.info(f"Split document into {len(chunks)} chunks.")

            # 3. Fault-tolerant chunk analysis
            chunk_results = []
            for i, chunk in enumerate(chunks[:10]): # Analyze up to 10 chunks
                try:
                    logger.info(f"Analyzing chunk {i+1}/{min(len(chunks), 10)}...")
                    chunk_query = f"""
                    Analyze this document segment (Part of a {doc_meta.doc_type} in {doc_meta.jurisdiction}):
                    Extract: Obligations, Deadlines, Critical Definitions, and Legal Risks.
                    Segment:
                    {chunk}
                    """
                    resp = await self.fast_llm.ainvoke(chunk_query)
                    chunk_results.append(resp.content)
                    
                except Exception as chunk_err:
                    logger.warning(f"Error analyzing chunk {i+1}, skipping: {chunk_err}")
                    continue

            combined_chunk_intelligence = "\n\n--- SEGMENT INTELLIGENCE ---\n\n".join(chunk_results)

            # 4. Final Robust Synthesis
            query = f"""
            You are an expert Legal AI Analyst. Synthesize the following segment-level intelligence into a COMPREHENSIVE FINAL LEGAL ANALYSIS.
            DOCUMENT CONTEXT:
            Type: {doc_meta.doc_type}
            Jurisdiction: {doc_meta.jurisdiction}
            Parties: {", ".join(doc_meta.parties)}

            ----------------------------------
            STRICT OUTPUT RULES
            ----------------------------------
            1. Provide a long narrative EXECUTIVE SUMMARY (4-6 paragraphs).
            2. For all structured data (Timeline, Risks, Definitions, etc.), you MUST return a single valid JSON block inside ```json tags.
            3. Keep the "Score" and "Confidence" fields strictly numeric (0-100).
            4. If the document is NOT a legal document (e.g., resume, blog, article, etc), keep relevance_score below 30 and risk MUST be "Low".
            5. If it is semi-legal (agreements, policies), use 40–70 for relevance.
            7. Even for non-legal documents like resumes or reports, you MUST populate the 'key_clauses' field by treating major sections (e.g., 'Professional Experience', 'Education', 'Core Competencies') as clauses.
            8. Ensure every field in the JSON is populated with relevant data from the document. Do NOT return empty lists if there is relevant content.

            RISK SCORING RULES:
            - Low → No legal consequences (e.g., resume, informational docs)
            - Medium → Some obligations or unclear terms
            - High → Legal liability, penalties, financial exposure

            URGENCY RULES:
            - Low → No deadlines or actions required
            - Medium → Some timelines mentioned
            - High → Immediate deadlines or legal consequences

            ----------------------------------
            STRUCTURED DATA (JSON)
            ----------------------------------
            ```json
            {{
              "timeline": [
                {{"date": "YYYY-MM-DD or Month YYYY", "event": "Significant event or milestone", "importance": "High/Medium/Low"}}
              ],
              "definitions": [
                {{"term": "Key Term", "definition": "Explanation of the term as used in the document"}}
              ],
              "risks": [
                {{"riskLevel": "High/Medium/Low", "score": 8, "explanation": "Detailed explanation of the legal or professional risk", "mitigation": "How to address or minimize this risk"}}
              ],
              "relationships": [
                {{"relationship": "Connection between entities", "type": "Type of relationship"}}
              ],
              "entities": [
                {{"category": "People", "items": ["Names detected"]}},
                {{"category": "Organizations", "items": ["Firms, Companies, Institutions"]}},
                {{"category": "Dates", "items": ["Important dates mentioned"]}},
                {{"category": "Legal/Professional Terms", "items": ["Key terminology"]}}
              ],
              "key_clauses": [
                {{
                  "title": "Clause Title or Section Header (e.g., 'Indemnification' or 'Work Experience')", 
                  "summary": "Comprehensive summary of the obligations, rights, or highlights in this section."
                }}
              ],
              "pages": [
                {{
                  "page_number": 1, 
                  "summary": "Detailed 5-8 sentence summary for this page.",
                  "topics": "Keywords",
                  "clauses": "Sections found",
                  "risks": "Any specific concerns"
                }}
              ],
              "actionable_insights": [
                "Concrete step or recommendation for the user"
              ],
              "classification": {{
                "doc_type": "{doc_meta.doc_type}",
                "relevance_score": 95,
                "confidence_score": 90,
                "jurisdiction": "{doc_meta.jurisdiction}",
                "urgency_level": "Low/Medium/High"
              }}
            }}
            ```

----------------------------------
PAGE-BY-PAGE SUMMARY
----------------------------------
Provide a 5-8 sentence detailed textual summary for each major page/section based on the intelligence below.

--- SEGMENT INTELLIGENCE ---
{combined_chunk_intelligence}
"""

            logger.info("Performing final synthesis pass...")
            response = await self.llm.ainvoke(query)
            summary = response.content
            
            # Sources for UI
            sources = []
            for i, doc in enumerate(documents[:5]):
                sources.append({
                    "page": i + 1,
                    "section": "Index Page",
                    "text": doc.page_content.strip()[:500] + "..."
                })

            return summary, sources

        except Exception as e:
            logger.error(f"Error during v2.0 hardened analysis: {e}")
            traceback.print_exc()
            raise e

# Legacy compatibility function
def process_pdf_and_summarize(pdf_path: str):
    rag = RAGManager()
    import asyncio
    return asyncio.run(rag.get_summary(pdf_path))
