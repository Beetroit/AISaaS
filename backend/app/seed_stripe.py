import os
import stripe
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

if not stripe.api_key:
    raise ValueError("STRIPE_SECRET_KEY not found in environment variables.")

MESSAGE_PACKAGES = [
    {
        "name": "Iniciador",
        "description": "El punto de partida ideal - 1500 Créditos de Mensajes IA",
        "message_credits": 1500,
        "price_amount": 1500,
        "currency": "usd",
    },
    {
        "name": "Negocio Pro",
        "description": "El mejor balance para crecer - 2500 Créditos de Mensajes IA",
        "message_credits": 2500,
        "price_amount": 2500,
        "currency": "usd",
    },
    {
        "name": "Escala Máxima",
        "description": "Para grandes volúmenes de tráfico - 5000 Créditos de Mensajes IA",
        "message_credits": 5000,
        "price_amount": 5000,
        "currency": "usd",
    },
]


async def seed_stripe_products_and_prices():
    print("Seeding Stripe products and prices...")

    for package in MESSAGE_PACKAGES:
        products = stripe.Product.list(limit=100)
        existing_product = next(
            (p for p in products.data if p.name == package["name"]), None
        )

        if existing_product:
            product = existing_product
            print(f"Product '{package['name']}' already exists (ID: {product.id}).")
        else:
            product = stripe.Product.create(
                name=package["name"],
                description=package["description"],
                metadata={"message_credits": package["message_credits"]},
            )
            print(f"Created product '{product.name}' (ID: {product.id}).")

        prices = stripe.Price.list(product=product.id, limit=100)
        existing_price = next(
            (
                p
                for p in prices.data
                if p.unit_amount == package["price_amount"]
                and p.currency == package["currency"]
                and p.type == "one_time"
            ),
            None,
        )

        if existing_price:
            print(
                f"Price for '{package['name']}' at ${package['price_amount'] / 100:.2f} already exists (ID: {existing_price.id})."
            )
        else:
            stripe.Price.create(
                product=product.id,
                unit_amount=package["price_amount"],
                currency=package["currency"],
                recurring=None,
                metadata={"message_credits": package["message_credits"]},
            )
            print(
                f"Created price for '{product.name}' at ${package['price_amount'] / 100:.2f}."
            )

    print("Stripe seeding complete.")


if __name__ == "__main__":
    import asyncio

    asyncio.run(seed_stripe_products_and_prices())
