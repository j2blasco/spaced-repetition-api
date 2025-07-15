# Follow Test-Driven Development (TDD):
Always start by writing a test before implementing the functionality.

# Prefer Real Implementations Over Mocks:
Avoid using mocks whenever possible. If you feel a mock is necessary, reconsider the design.
* Instead, use fakes that fully comply with the expected behavior.

# Interface-First Development for New Tasks:
When starting a new task:

* First, design the interface.
* Then, write a generic test for that interface — a function that takes any implementation of the interface and verifies its behavior.
* Finally, implement the concrete provider, and test it using the generic test.
* Interfaces should be as minimal as possible. Additional functionality can be added with utility functions

# Use Dependency Injection (DI):
Introduce abstractions via DI when flexibility is needed. This allows implementations to be replaced easily in the future.

# Do not update the project README.md if it isn't required
