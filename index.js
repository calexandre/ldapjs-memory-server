var ldap = require('ldapjs');


///--- Shared handlers

function authorize(req, res, next) {
  /* Any user may search after bind, only cn=root has full power */
  var isSearch = (req instanceof ldap.SearchRequest);
  if (!req.connection.ldap.bindDN.equals(basedn) && !isSearch)
    return next(new ldap.InsufficientAccessRightsError());

  return next();
}


///--- Globals

var basedn = "dc=example, dc=com";
var company = "Example";
var port = 1389;
var db = {};
var server = ldap.createServer();

// Setup the DB

db[`cn=John Doe, ${basedn}`] = {
  sAMAccountName: "jdoe",
  userpassword: "demo",
  objectclass: [ "top", "person", "organizationalPerson", "user" ],
  cn: "John",
  mail: "johndoe@gmail.com",
  givenname: "John",
  sn: "Doe",
  ou: company
}

db[`cn=Test User, ${basedn}`] = {
  sAMAccountName: "test",
  userpassword: "test",
  objectclass: [ "top", "person", "organizationalPerson", "user" ],
  cn: "test",
  mail: "test@gmail.com",
  givenname: "Test",
  sn: "User",
  ou: company
}

// Test command: ldapsearch -H ldap://localhost:1389 -x -D "cn=John Doe,dc=example,dc=com" -w demo "dc=example,dc=com" objectclass=*
server.bind(basedn, function(req, res, next) {
  var dn = req.dn.toString();
  if (!db[dn])
    return next(new ldap.NoSuchObjectError(dn));

  if (!db[dn].userpassword)
    return next(new ldap.NoSuchAttributeError('userPassword'));

  if (db[dn].userpassword.indexOf(req.credentials) === -1)
    return next(new ldap.InvalidCredentialsError());

  res.end();
  return next();
});

server.search(basedn, function(req, res, next) {
  var dn = req.dn.toString();
  if (!db[dn])
    return next(new ldap.NoSuchObjectError(dn));

  var scopeCheck;

  switch (req.scope) {
  case 'base':
    if (req.filter.matches(db[dn])) {
      res.send({
        dn: dn,
        attributes: db[dn]
      });
    }

    res.end();
    return next();

  case 'one':
    scopeCheck = function(k) {
      if (req.dn.equals(k))
        return true;

      var parent = ldap.parseDN(k).parent();
      return (parent ? parent.equals(req.dn) : false);
    };
    break;

  case 'sub':
    scopeCheck = function(k) {
      return (req.dn.equals(k) || req.dn.parentOf(k));
    };

    break;
  }

  Object.keys(db).forEach(function(key) {
    if (!scopeCheck(key))
      return;

    if (req.filter.matches(db[key])) {
      res.send({
        dn: key,
        attributes: db[key]
      });
    }
  });

  res.end();
  return next();
});



///--- Fire it up

server.listen(port, function() {
  console.log('LDAP server up at: %s', server.url);
});