2. Register no-sql-db

3. Rewrite the repositories to use no-sql-db via injection

4. Add boundaries so that no-sql-db is only used by repos.

5. We have now the core implemented in core/ 
Let's implement the rest endpoints. To test them, we will use supertest. We'll setup the endpoints making use of startRestApiServer and then call the endpoint using supertest. 