from fastapi import APIRouter, HTTPException, Depends, Query
from app.api.deps import get_current_user, get_current_admin, get_current_staff
from app.models.order_model import get_bill, get_all_bills, count_all_bills
from app.utils.pdf_service import generate_invoice_pdf
from fastapi.responses import Response
from app.database.mongodb import get_database
import os

router = APIRouter(prefix="/api/bills", tags=["Bills"])


@router.get("/")
async def list_all_bills(
    current_user: dict = Depends(get_current_staff),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: str = Query(None),
    status: str = Query(None)
):
    """Admin/Staff: list all bills with optional search and filter."""
    query = {}
    if search:
        query["$or"] = [
            {"bill_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["payment_status"] = status

    db = get_database()
    bills = []
    cursor = db["bills"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    async for b in cursor:
        from app.models.order_model import bill_helper
        bills.append(bill_helper(b))
        
    total = await db["bills"].count_documents(query)
    return {"bills": bills, "total": total}


@router.get("/{bill_id}")
async def get_bill_data(bill_id: str, current_user: dict = Depends(get_current_user)):
    customer_id = current_user.get("id")
    print(f"DEBUG: Requested GET Bill ID: {bill_id}")
    print(f"DEBUG: Requester ID: {customer_id}, Role: {current_user.get('role')}")
    
    bill = await get_bill(bill_id)
    if not bill:
        print(f"DEBUG: Bill {bill_id} not found in database")
        raise HTTPException(status_code=404, detail="Bill not found")

    # Ownership check — customers can only view their own bills
    if current_user.get("role") == "Customer":
        if str(customer_id) != str(bill["customer_id"]):
            print(f"DEBUG: Access Denied. Bill belongs to {bill['customer_id']}, not {customer_id}")
            raise HTTPException(status_code=403, detail="You do not have access to this bill")

    return bill


@router.get("/{bill_id}/pdf")
async def download_bill_pdf(bill_id: str, current_user: dict = Depends(get_current_user)):
    """
    Unified PDF download endpoint for Admin, Staff, and Customer.
    (Task 4, 7, 9)
    """
    print(f"DEBUG: PDF Download Requested for Bill ID: {bill_id}")
    
    bill = await get_bill(bill_id)
    if not bill:
        print(f"ERROR: Bill {bill_id} not found for PDF generation.")
        raise HTTPException(status_code=404, detail="Bill not found")

    # Role-based access check (Task 7)
    if current_user.get("role") == "Customer":
        if str(current_user.get("id")) != str(bill["customer_id"]):
            print(f"SECURITY: Unauthorized access attempt to Bill {bill_id} by {current_user.get('id')}")
            raise HTTPException(status_code=403, detail="Access denied")

    # 1. Try to serve stored file (Task 2 & 4)
    if bill.get("invoice_url"):
        # Relativize path: strip leading slash and ensure absolute project root context
        rel_path = bill["invoice_url"].lstrip("/")
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        abs_file_path = os.path.join(base_dir, rel_path)
        
        print(f"DEBUG: Attempting to serve PDF from: {abs_file_path}")

        if os.path.exists(abs_file_path):
            from fastapi.responses import FileResponse
            return FileResponse(
                path=abs_file_path,
                media_type="application/pdf",
                filename=f"invoice_{bill.get('bill_number', bill_id)}.pdf"
            )
        else:
            print(f"WARNING: Stored PDF file not found at {abs_file_path}. Falling back to generation.")

    # 2. Fallback: generate on the fly (Task 9)
    try:
        from app.utils.pdf_service import generate_invoice_pdf
        pdf_content = generate_invoice_pdf(bill)
        
        print(f"SUCCESS: On-the-fly PDF generated for {bill_id}")
        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{bill.get('bill_number', bill_id)}.pdf"}
        )
    except Exception as e:
        print(f"CRITICAL: On-the-fly PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF invoice")
