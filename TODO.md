* Reimplement cards repository with the db 

* Rewrite the repositories to use no-sql-db via injection

* Add boundaries so that no-sql-db is only used by repos.

* We have now the core implemented in core/ 
Let's implement the rest endpoints. To test them, we will use supertest. We'll setup the endpoints making use of startRestApiServer and then call the endpoint using supertest. 