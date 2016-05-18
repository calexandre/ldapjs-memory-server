var ldap = require('ldapjs');
var fs = require('fs');
var path = require('path');


var dbPath = process.env.LDAP_DB_JSON || path.join(__dirname, "db.json")
var db = require(dbPath);
var baseDN = process.env.LDAP_BASEDN || db.baseDN || "dc=example, dc=com";
var port = process.env.LDAP_PORT || 1389;

var server = ldap.createServer();

server.bind(baseDN, function(req, res, next) {
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

server.search(baseDN, function(req, res, next) {
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
  console.log("Using the following db:")
  console.log(JSON.stringify(db, null, 2));
  console.log('LDAP server up at: %s', server.url);
});