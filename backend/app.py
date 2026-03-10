"""
StayBot AI – Flask App Factory
Creates and configures the Flask application.
"""
import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import configs
from db import init_db

# Limiter instance (shared)
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute"],
)


def create_app(env: str | None = None) -> Flask:
    """Flask application factory."""
    app = Flask(__name__)

    # ── Config ─────────────────────────────────────────────────────────────────
    env = env or os.environ.get("FLASK_ENV", "development")
    app.config.from_object(configs.get(env, configs["development"]))

    # ── Extensions ─────────────────────────────────────────────────────────────
    JWTManager(app)
    CORS(app, origins=app.config["ALLOWED_ORIGINS"], supports_credentials=True)
    limiter.init_app(app)

    # ── Database ───────────────────────────────────────────────────────────────
    init_db()

    # ── Blueprints ─────────────────────────────────────────────────────────────
    from routes.health import health_bp
    from routes.auth import auth_bp
    from routes.hotels import hotels_bp
    from routes.bookings import bookings_bp
    from routes.menu import menu_bp
    from routes.slots import slots_bp
    from routes.analytics import analytics_bp
    from routes.customers import customers_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(hotels_bp, url_prefix="/api/hotels")
    app.register_blueprint(bookings_bp, url_prefix="/api/bookings")
    app.register_blueprint(menu_bp, url_prefix="/api/menu")
    app.register_blueprint(slots_bp, url_prefix="/api/slots")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(customers_bp, url_prefix="/api/customers")

    # ── Global error handlers ───────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Not found", "code": 404}, 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {"error": "Method not allowed", "code": 405}, 405

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        return {"error": "Rate limit exceeded. Try again later.", "code": 429}, 429

    @app.errorhandler(Exception)
    def handle_exception(e):
        """Global exception handler for unhandled errors."""
        # Log the full stack trace for debugging
        app.logger.exception("Unhandled error occurred")
        
        # Determine the error message
        if hasattr(e, "message"):
            msg = e.message
        elif hasattr(e, "description"):
            msg = e.description
        else:
            msg = str(e)
            
        return {"error": msg, "code": 500}, 500

    return app


if __name__ == "__main__":
    create_app().run(debug=True)
