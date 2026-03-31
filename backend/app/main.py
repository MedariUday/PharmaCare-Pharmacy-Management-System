from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files (Invoices) ──────────────────────────────────
app.mount("/static", StaticFiles(directory="static"), name="static")

# ── Friendly validation error responses ──────────────────────
_FIELD_MESSAGES = {
    "name": "Full name must be at least 2 characters.",
    "email": "Please enter a valid email address.",
    "phone": "Phone number must be 10–15 digits.",
    "password": "Password must be at least 8 characters.",
}

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    # Build a human-readable message from the first error
    first = errors[0] if errors else {}
    field = first.get("loc", ["", ""])[-1] if first else ""
    msg = _FIELD_MESSAGES.get(str(field), first.get("msg", "Validation error"))
    # Strip "Value error, " prefix added by Pydantic v2
    msg = msg.replace("Value error, ", "")
    return JSONResponse(status_code=422, content={"detail": msg})

from app.api.auth_routes import router as AuthRouter
from app.api.medicine_routes import router as MedicineRouter
from app.api.supplier_routes import router as SupplierRouter
from app.api.customer_routes import router as CustomerRouter
from app.api.inventory_routes import router as InventoryRouter
from app.api.sales_routes import router as SalesRouter
from app.api.report_routes import router as ReportRouter
from app.api.customer_portal import router as CustomerPortalRouter
from app.api.cart_routes import router as CartRouter
from app.api.admin_billing_routes import router as AdminBillingRouter
from app.api.staff_billing_routes import router as StaffBillingRouter
from app.api.pharmacist_routes import router as PharmacistRouter
from app.api.alert_routes import router as AlertRouter
from app.api.bill_routes import router as BillRouter
from app.api.admin_routes import router as AdminRouter
from app.api.recommendation_routes import router as RecommendationRouter
from app.api.chatbot_routes import router as ChatbotRouter

app.include_router(AuthRouter)
app.include_router(MedicineRouter)
app.include_router(SupplierRouter)
app.include_router(CustomerRouter)
app.include_router(InventoryRouter)
app.include_router(SalesRouter)
app.include_router(ReportRouter)
app.include_router(CustomerPortalRouter)
app.include_router(CartRouter)
app.include_router(AdminBillingRouter)
app.include_router(StaffBillingRouter)
app.include_router(PharmacistRouter)
app.include_router(AlertRouter)
app.include_router(BillRouter)
app.include_router(AdminRouter)
app.include_router(RecommendationRouter)
app.include_router(ChatbotRouter)





