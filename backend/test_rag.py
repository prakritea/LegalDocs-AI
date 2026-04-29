import os
import sys
import asyncio
from dotenv import load_dotenv

# Add backend to path so we can import modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.model_pipeline import RAGManager

load_dotenv()

async def test_legal_rag_v2():
    # Use the dummy court case in the root directory
    test_pdf_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', "dummy court case.pdf"))
    
    if not os.path.exists(test_pdf_path):
        print(f"❌ Test PDF not found at: {test_pdf_path}")
        return False
        
    try:
        print("\n=== Testing Legal RAG v2 System ===\n")
        
        manager = RAGManager()
        
        print(f"Step 1: Processing PDF (Hierarchical Chunking & Metadata)...")
        # Test executive format
        summary, sources = await manager.get_summary(test_pdf_path, format_type="legal")
        
        print("\n=== Results (Legal Brief Format) ===\n")
        print("Model-Generated Summary:")
        print("-" * 50)
        print(summary)
        print("\n" + "=" * 50 + "\n")
        
        print("Retrieved Sources with Sections:")
        print("-" * 50)
        for idx, source in enumerate(sources[:3], 1):
            print(f"\nSource {idx}:")
            print(f"Section: {source.get('section', 'General')}")
            print(f"Page: {source['page']}")
            print(f"Text excerpt: {source['text'][:150]}...")
        
        if "[Section" in summary or "[Article" in summary:
            print("\n✅ Citations detected in summary!")
        else:
            print("\n⚠️ No citations detected in summary. Check chunking/prompting.")

        print("\n✅ Legal RAG v2 system verification successful!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error during Legal RAG v2 testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_legal_rag_v2())