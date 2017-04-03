var DB = require('./db').DB;

var User = DB.Model.extend({
   tableName: 'User',
   idAttribute: 'id',
});

var Org = DB.Model.extend({
   tableName: 'org',
});

module.exports = {
   User: User
};

