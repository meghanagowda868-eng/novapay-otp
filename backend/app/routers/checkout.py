from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CheckoutOrder, User
from app.schemas import CheckoutRequest, CheckoutResponse
from app.dependencies import get_optional_current_user
from app.security import generate_order_reference

router = APIRouter(tags=["Checkout"])

@router.post("/checkout", response_model=CheckoutResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    checkout_in: CheckoutRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    order_ref = generate_order_reference()

    # Ensure uniqueness of order reference
    while db.query(CheckoutOrder).filter(CheckoutOrder.order_reference == order_ref).first() is not None:
        order_ref = generate_order_reference()

    user_id = current_user.id if current_user else None

    order = CheckoutOrder(
        order_reference=order_ref,
        user_id=user_id,
        email=checkout_in.email.lower().strip(),
        phone=checkout_in.phone.strip(),
        shipping_address=checkout_in.shipping_address.strip()
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return CheckoutResponse(
        message="Order submitted successfully",
        order_reference=order.order_reference,
        user_id=order.user_id,
        email=order.email,
        phone=order.phone,
        shipping_address=order.shipping_address,
        created_at=order.created_at
    )
