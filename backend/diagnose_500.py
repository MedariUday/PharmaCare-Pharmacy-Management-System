import asyncio
import os
import sys
import traceback

sys.path.append(os.path.abspath(os.curdir))

from app.api.inventory_routes import get_inventory_predictions

async def debug_endpoint():
    try:
        mock_user = {"id": "test", "role": "Pharmacist"}
        res = await get_inventory_predictions(current_user=mock_user)
        print("Success")
    except Exception as e:
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        # Get the frames
        tb = traceback.extract_tb(sys.exc_info()[2])
        for frame in tb:
            # Only print frames from the project
            if "inventory_routes.py" in frame.filename or "medicine_model.py" in frame.filename:
                print(f"File: {os.path.basename(frame.filename)}, Line: {frame.lineno}, Code: {frame.line}")

if __name__ == "__main__":
    asyncio.run(debug_endpoint())
