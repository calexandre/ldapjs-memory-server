# ldapjs-memory-server

Based on ldapjs in-memory server (http://ldapjs.org/examples.html).
I created this server to test a LDAP implementation I made elsewhere.

I thought it could be useful for anyone who needs it.

The database is a simple db.json that you can edit for your own purposes.

## Build from source

```bash
npm run build
```

## Run

```bash
npm start
```

The following environment variables can be optionally set:

```bash
# Defaults __dirname/db.json
LDAP_DB_JSON
# Defaults to the DN defined in the database, otherwise dc=example, dc=com
LDAP_BASEDN
# Defaults to 1389
LDAP_PORT
```

To run with environment variables:
```bash
LDAP_PORT=1389 LDAP_DB_JSON=~/mydb.json npm start
```
## Dockerfile

A dockerfile is also provided in case you want to build a docker image and run your own container.

To build it, just run:

```bash
npm run docker:build
```

Then to create and run:

```bash
npm run docker:run
```

## Using ldapsearch

You can use ldapsearch to test the server:
```bash
ldapsearch -x -H ldap://localhost:1389 -b "dc=example,dc=com" -s base -D 'cn=John Doe, dc=example, dc=com' -w demo
```