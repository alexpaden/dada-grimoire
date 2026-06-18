"""Shared constants for client-facing integration examples.

These values are the public, documentation-grade samples used by the API
playground and the onboarding snippet — they are not deployment credentials and
nothing in this service authenticates against them.
"""

# Stripe's publishable example key from their published docs — used verbatim in
# the billing integration example so the snippet renders without a real account.
STRIPE_TEST_KEY = "pk_test_TYooMQauvdEDq54NiTphI7jx"

# Placeholder bearer shown in the "try it" curl example in the API docs. No
# endpoint accepts it; the real identity flow mints a token from GET /api/me/.
DEMO_BEARER = "Bearer demo-token-replace-me"

# Default page size for the directory examples.
EXAMPLE_PAGE_SIZE = 20
