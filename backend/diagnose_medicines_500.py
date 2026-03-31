import asyncio
import os
import sys
import traceback
from pydantic import ValidationError

sys.path.append(os.path.abspath(os.curdir))

from app.models.medicine_model import retrieve_medicines
from app.database.mongodb import connect_to_mongo
from app.schemas.medicine_schema import PaginatedMedicineResponse

async def debug_endpoint():
    print("DEBUG: Checking /api/medicines and Pydantic validation...")
    try:
        await connect_to_mongo()
        
        # Test 1: Full retrieval
        print("🔍 Test: limit=1000...")
        res = await retrieve_medicines(limit=1000)
        print(f"✅ Model returned {len(res['data'])} raw items.")
        
        # TEST: Pydantic Validation (This represents what FastAPI does)
        print("🔍 Test: Pydantic validation of the response...")
        validated = PaginatedMedicineResponse(**res)
        print(f"✅ Validation successful! Number of validated items: {len(validated.data)}")
        
    except ValidationError as e:
        print(f"❌ PYDANTIC VALIDATION ERROR: {str(e)}")
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_endpoint())
