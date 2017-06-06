// Title: UniNet Express Lane Services
// Developer: Chinnawat Chimdee (chinnawat.cpre@gmail.com)
// Original Source: Akarasate Waiyaroj (a.waiyaroj@gmail.com)
// Last Update: April 2017

// module list
var passport = require('passport');
var url = require('url');
var bcrypt = require('bcrypt-nodejs');
var cron = require('node-schedule'); //node-schedule
var Model = require('./models/model');
var mysql = require('mysql'); //mysql
var connection = mysql.createConnection({ //database setting
  host: 'localhost', //database IP
  user: 'root',
  password: 'root',
  database: 'UniNetExpressLane' //database name
});
connection.connect();

var pool = mysql.createPool({
  host: 'localhost', //database IP
  user: 'root',
  password: 'root',
  database: 'UniNetExpressLane' //database name
});

var nodemailer = require('nodemailer'); //nodemailler
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'expresslane.alert@gmail.com',
    pass: 'vk0kipN;ik'
  }
});

//check function to change service state
var check = function(req, res) {
  req.getConnection(function(err, connection) {
    //request timeout
    var query = connection.query("SELECT * FROM ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said INNER JOIN ServiceRequests ON ServiceRequests.sid = ServiceActivities.sid INNER JOIN User ON User.id = ServiceRequests.user WHERE actType = 0", function(err, servicetime) {
      if (err) console.log("Error selecting ServiceActivities [01]: %s", err);
      else { 
        for (i = 0; i < servicetime.length; i++) {
          console.log(servicetime[i].endTime + "//" + servicetime[i].username + " (" + servicetime[i].email + ")");
          cron.scheduleJob(servicetime[i].endTime, function() {
            var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said, 3 FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said WHERE actType = 0 and endTime = NOW() and ServiceActivities.said NOT IN (SELECT said FROM ServiceLogs) and  ServiceActivities.actType NOT IN (SELECT actType FROM ServiceLogs)", function(err) {
              if (err) console.log("Error inserting ServiceLogs [01]: %s", err);
              else {
                var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said SET actType=3 WHERE actType = 0 and endTime = NOW()", function(err) {
                  if (err) console.log("Error Updating [01]: %s ", err);
                  else console.log(new Date(), "update");
                });
              }
            });
          });
        }
      }
    });
    //service active by start time
    var query = connection.query("SELECT * FROM ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said WHERE actType = 4", function(err, time) {
      if (err) console.log("Error selecting ServiceActivities [02]: %s", err);
      else {
        for (i = 0; i < time.length; i++) {
          console.log(time[i].startTime);
          cron.scheduleJob(time[i].startTime, function() {
            var query = connection.query("INSERT INTO ActivePackage (said,username,resourceString1,resourceString2,IP1,IP2,startTime,endTime) SELECT ResourceAllocated.said,User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,ResourceAllocated.startTime,ResourceAllocated.endTime FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said INNER JOIN ServiceRequests ON ServiceRequests.sid = ServiceActivities.sid INNER JOIN User ON User.id = ServiceRequests.user WHERE actType = 4 and startTime = NOW() and ResourceAllocated.said NOT IN (SELECT said FROM ActivePackage)", function(err) {
              if (err) console.log("Error inserting ActivePackage [02]: %s", err);
              else {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,7 FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said WHERE actType = 4 and startTime = NOW() and ServiceActivities.said NOT IN (SELECT said FROM ServiceLogs) and  ServiceActivities.actType NOT IN (SELECT actType FROM ServiceLogs)", function(err) {
                  if (err) console.log("Error inserting ServiceLogs [02]: %s", err);
                  else {
                    var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said SET actType=7 WHERE actType = 4 and startTime = NOW()", function(err) {
                      if (err) console.log("Error Updating [02]: %s ", err);
                      else console.log(new Date(), "update");
                    });
                  }
                });
              }
            });
          });
        }
      }
    });
    //service complete by endtime
    var query = connection.query("SELECT * FROM ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said WHERE actType = 7", function(err, activetime) {
      if (err) console.log("Error selecting ServiceActivities [03]: %s", err);
      else {
        for (i = 0; i < activetime.length; i++) {
          console.log(activetime[i].endTime);
          cron.scheduleJob(activetime[i].endTime, function() {
            var query = connection.query("DELETE FROM ActivePackage WHERE endTime = NOW()", function(err) {
              if (err) console.log("Error deleting ActivePackage [03]: %s", err);
              else {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,10 FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said WHERE actType = 7 and endTime = NOW() and ServiceActivities.said NOT IN (SELECT said FROM ServiceLogs) and  ServiceActivities.actType NOT IN (SELECT actType FROM ServiceLogs)", function(err) {
                  if (err) console.log("Error inserting ServiceLogs [03]: %s", err);
                  else {
                    var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said SET actType=10 WHERE actType = 7 and endTime = NOW()", function(err) {
                      if (err) console.log("Error Updating [03]: %s ", err);
                      else console.log(new Date(), "update");
                    });
                  }
                });
              }
            });
          });
        }
      }
    });
    connection.release();
  });
};

// home index
var index = function(req, res) {
  if (!req.isAuthenticated()) {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status_user) {
        if (err) console.log("Error selecting Online_Status: %s", err);
        else {
          res.render('index', {
            title: 'Home',
            req: req,
            status_user: status_user
          });
        }
      });
      connection.release();
    });
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    req.getConnection(function(err, connection) {
      var query = connection.query("UPDATE User set flag=1 WHERE id = ? ", [user.id], function(rows) {
        if (err) console.log("Error updating User: %s", err);
        else {
          var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status_user) {
            if (err) console.log("Error selecting Online_Status: %s", err);
            else {
              res.render('index', {
                title: 'Home',
                req: req,
                user: user,
                status_user: status_user
              });
            }
          });
        } 
      });  
      connection.release();
    });
  }
  // next();
};

//GET member signed in
var member = function(req, res) {
  if (!req.isAuthenticated()) {
    res.redirect('/');
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role === 1) {
      res.render('admin', {
        title: 'Home',
        user: user
      });
    } else {
      res.render('member', {
        title: 'Home',
        user: user
      });
    }
  }
};

//GET view profile
var profile = function(req, res) {
  if (!req.isAuthenticated()) {
    res.redirect('/');
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    res.render('profile', {
      title: 'Profile',
      user: user
    });
  }
};

//GET reset password render
var repass = function(req, res) {
  if (!req.isAuthenticated()) {
    res.render('repass', {
      title: 'Reset Password',
      req: req
    });
  } else {
    var user = req.user;
    if (user !== undefined) {
      user = user.toJSON();
    }
    res.render('repass', {
      title: 'Reset Password',
      req: req,
      user: user
    });
  }
};

//POST reset password
var repasspost = function(req, res) {
  var input = JSON.parse(JSON.stringify(req.body));
  var id = req.params.id;
  req.getConnection(function(err, connection) {
    var username = input.username;
    var email = input.email;
    var hash = bcrypt.hashSync(input.password);
    var query = connection.query("SELECT * FROM User WHERE username = ? and email = ? ", [username, email], function(err, user_data) {
      if (err) console.log("Error selecting User: %s", err);
      else {
        if (JSON.stringify(user_data) === '[]') {
          var error = "Invalid username or email"
          if (!req.isAuthenticated()) {
            res.render('repass', {
              title: 'Reset Password',
              req: req,
              error: error
            });
          } else {
            var user = req.user;
            if (user !== undefined) {
              user = user.toJSON();
            }
            res.render('repass', {
              title: 'Reset Password',
              req: req,
              user: user,
              error: error
            });
          }
        } else {
          var query = connection.query("UPDATE User set password = ? WHERE username = ? and email = ? ", [hash, username, email], function(err, rows) {
            if (err) console.log("Error updating User: %s", err);
            else {
              email_sender(4, user_data[0].id); //EMAIL TEMPLATE 4
              if (!req.isAuthenticated()) {
                res.render('repassed', {
                  title: 'Reset Password',
                  req: req
                });
              } else {
                var user = req.user;
                if (user !== undefined) {
                  user = user.toJSON();
                }
                res.render('repassed', {
                  title: 'Reset Password',
                  req: req,
                  user: user
                });
              }
            }
          });
        }
      }
    });
    connection.release();
  });
};

//GET status node
var status = function(req, res) {
  if (!req.isAuthenticated()) {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status Order By id ', function(err, status_user) {
        if (err) console.log("Error Selecting : %s ", err);
        else {
          res.render('status', {
            title: "Status",
            req: req,
            status_user: status_user
          });
        }
      });
    });
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();    
    if (user.role === 1) {
      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status) {
          if (err) console.log("Error selecting Online_Status: %s ", err);
          else { 
            var query = connection.query('SELECT * FROM Netfpga_Status', function(err, rows) {
              if (err) console.log("Error selecting Netfpga_Status: %s ", err);
              else { 
                var query = connection.query('SELECT *  FROM Nagios_Status', function(err, nagios) {
                  if (err) console.log("Error selecting Nagios_Status: %s ", err);
                  else { 
                    var query = connection.query('SELECT id , zone , DATE_FORMAT(timestamp , "%Y/%m/%d %H:%i:%S") AS timestamp , in_port1 , dl_dest1 , output1 , in_port2 , dl_dest2 , output2 , packet  FROM log_netfpga', function(err, logs_netfpga) {
                      if (err) console.log("Error selecting log_netfpga: %s ", err);
                      else { 
                        var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM log_Online_status', function(err, logs_node) {
                          if (err) console.log("Error selecting log_Online_status: %s ", err);
                          else {
                            var query = connection.query('SELECT id , zone , DATE_FORMAT(timestamp , "%Y/%m/%d %H:%i:%S") AS timestamp , service , statuss FROM log_nagios', function(err, logs_nagios) {
                              if (err) console.log("Error selecting log_nagios: %s ", err);
                              else {
                                res.render('status', {
                                  title: "Status",
                                  req: req,
                                  user: user,
                                  status: status,
                                  logs_nagios: logs_nagios,
                                  data: rows,
                                  nagios: nagios,
                                  logs_netfpga: logs_netfpga,
                                  logs_node: logs_node
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
    } else {
      var user = req.user;
      if (user !== undefined) user = user.toJSON();
      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status_user) {
          if (err) console.log("Error selecting Online_Status: %s ", err);
          else {
            res.render('status', {
              page_title: "Status",
              user: user,
              req: req,
              status_user: status_user
            });
          }
        });
        connection.release();
      });
    }
  }
};

//GET service text content page
var service = function(req, res) {
  if (!req.isAuthenticated()) {
    res.render('service', {
      title: 'Service',
      req: req
    });
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    res.render('service', {
      title: 'Service',
      req: req,
      user: user
    });
  }
};

//GET service activities page for member
var serviceac = function(req, res, next) {
  if (!req.isAuthenticated()) {
    res.redirect('/');
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role === 1) res.redirect('/');
    else {
      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT ResourceAllocated.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType WHERE user = ? and actbyuser != 1 and (ServiceActivities.actType = 0 or ServiceActivities.actType = 4 or ServiceActivities.actType = 7)', [user.id], function(err, data) {
          if (err) console.log("Error selecting ResourceAllocated [01]: %s", err);
          else { 
            var query = connection.query('SELECT ResourceAllocated.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType WHERE user = ? ', [user.id], function(err, state) {
              if (err) console.log("Error selecting ResourceAllocated [02]: %s", err);
              else { 
                var query = connection.query('SELECT ServiceLogs.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , DATE_FORMAT(ServiceLogs.timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType JOIN ServiceLogs ON ServiceActivities.said = ServiceLogs.said WHERE user = ? ', [user.id], function(err, history) {
                  if (err) console.log("Error selecting ServiceLogs: %s", err);
                  else { 
                    res.render('serviceac', {
                      title: "ServiceActivity",
                      user: user,
                      data: data,
                      history: history,
                      state: state
                    });
                  }
                });
              }
            });
          }
        });
        connection.release();
      });
    }
  }
};

//GET cancel service on service activities page for member
var ccServiceac = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    var id = req.params.id;
    req.getConnection(function(err, connection) {
      var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 1 WHERE actType = 0 and said = ? ", [id], function(err, rows) {
        if (err) console.log("Error updating ServiceActivities [01]: %s ", err);
        else {
          var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,1 FROM ServiceActivities WHERE said = ?", [id], function(err) {
            if (err) console.log("Error accept [01] : %s ", err);
          });
        }
      });
      var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 5 WHERE actType = 4 and said = ? ", [id], function(err, rows) {
        if (err) console.log("Error updating ServiceActivities [02]: %s ", err);
        else {
          var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,5 FROM ServiceActivities WHERE said = ?", [id], function(err) {
            if (err) console.log("Error accept [02]: %s ", err);
          });
        }
      });
      var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 8 WHERE actType = 7 and said = ? ", [id], function(err, rows) {
        if (err) console.log("Error updating ServiceActivities [03]: %s ", err);
        else {
          var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,8 FROM ServiceActivities WHERE said = ?", [id], function(err) {
            if (err) console.log("Error inserting ServiceLogs: %s ", err);
            else { 
              var query = connection.query("DELETE FROM ActivePackage WHERE said = ?", [id], function(err) {
                if (err) console.log("Error deleting: %s ", err);
              });
            }
          });
        }
      });
      connection.release();
      res.redirect('/serviceac');
    });
  }
};

//GET request service for member
var addServiceac = function(req, res) {
  var input = JSON.parse(JSON.stringify(req.body));
  var user = req.user;
  if (user === undefined) ReportError(res, "User is undefined");
  else {
    req.getConnection(function(err, connection) {
      var query = connection.query("INSERT INTO ServiceRequests set user = ? ", [user.id], function(err, rows) {
        if (err) console.log("Error inserting ServiceRequests: %s ", err);
        else {
          var query = connection.query("SELECT sid From ServiceRequests WHERE user = ? Order By ServiceRequests.sid Desc LIMIT 1", [user.id], function(err, sid_query) {
            if (err) console.log("Error selecting ServiceRequests: %s ", err);
            else {
              var insert_data = {
                sid: sid_query[0].sid,
                actType: 0,
                actbyuser: 0
              }
              var query = connection.query("INSERT INTO ServiceActivities SET ?", insert_data, function(err, rows) {
                if (err) console.log("Error inserting ServiceActivities: %s ", err);
                else {
                  var query = connection.query("SELECT said From ServiceActivities Order By said Desc LIMIT 1", function(err, said_query) {
                    if (err) console.log("Error selecting ServiceActivities: %s ", err);
                    else { 
                      var said_query_str = JSON.stringify(said_query);
                      said_query_parsed = JSON.parse(said_query_str);
                      var mac1 = input.resourceString1.toString().toLowerCase();
                      var mac2 = input.resourceString2.toString().toLowerCase();
                      var IP1 = input.IP1.toString().toLowerCase();
                      var IP2 = input.IP2.toString().toLowerCase();
                      var data = {
                        resourceString1: mac1,
                        resourceString2: mac2,
                        IP1: IP1,
                        IP2: IP2,
                        startTime: input.startTime,
                        endTime: input.endTime,
                        said: said_query_parsed[0].said,
                        source_node: 0,
                        des_node: 0
                      };
                      var query = connection.query("INSERT INTO ResourceAllocated set ? ", data, function(err, rows) {
                        if (err) console.log("Error inserting ResourceAllocated: %s ", err);
                        else {
                          var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,0 FROM ServiceActivities WHERE said = ?", said_query_parsed[0].said, function(err) {
                            if (err) console.log("Error inserting ServiceLogs: %s ", err);
                            else {
                              email_sender(5, user.id);
                              res.redirect('/serviceac');
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }        
      });
      connection.release();
    });
  }
};

//GET user management
var user = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT * FROM User WHERE role IS NOT NULL', function(err, rows1) {
          if (err) console.log("Error selecting User: %s ", err);
          else {
            var query = connection.query('SELECT User.id,User.username , User.NameE , User.LastNameE ,  User.email , org.nameE AS org , User.phone , User.message FROM User JOIN org ON User.org = org.org WHERE role IS NULL', function(err, rows2) {
              if (err) console.log("Error selecting User: %s ", err);
              else {
                var query = connection.query('SELECT user, actionType.nameE , DATE_FORMAT(timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp FROM accessLogs INNER JOIN actionType ON accessLogs.action = actionType.action', function(err, userhistory) {
                  if (err) console.log("Error selecting accessLogs: %s ", err);
                  else {
                    res.render('user', {
                      title: "User",
                      user: user,
                      data: rows1,
                      data1: rows2,
                      userhistory: userhistory
                    });
                  }
                });
              }
            });
          }
        });
        connection.release();
      });
    }
  }
};

//GET accept user
var accept = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        connection.query("UPDATE User SET role = 2 WHERE id = ? ", [id], function(err, rows) {
          if (err) console.log("Error accept : %s ", err);
          else {
            email_sender(2, id);
            res.redirect('/user');
          }
        }); 
        connection.release();       
      });
    }
  }
};

//GET submit edit user
var saveedit = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      var input = JSON.parse(JSON.stringify(req.body));
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        var data = {
          username: input.username,
          NameE: input.NameE,
          LastNameE: input.LastNameE,
          org: input.org,
          phone: input.phone,
          email: input.email,
          membertype: input.membertype,
          role: input.role
        };
        var query = connection.query("UPDATE User set ? WHERE id = ? ", [data, id], function(err, rows) {
          if (err) console.log("Error Updating : %s ", err);
          else res.redirect('/user');
        });
        connection.release();
      });
    }
  }
};

//GET delete user
var delete_user = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      var id = req.params.id;
      email_sender(3, id);
      req.getConnection(function(err, connection) {
        var query = connection.query("DELETE FROM User WHERE id = ? ", [id], function(err, rows) {
          if (err) console.log("Error deleting User: %s ", err);
          else {             
            res.redirect('/user');
          }
        });
        connection.release();
      });
    }
  }
};

//GET cancel user request
var cancel_user = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      var id = req.params.id;
      email_sender(3, id);
      req.getConnection(function(err, connection) {
        var query = connection.query("DELETE FROM User WHERE id = ? ", [id], function(err, rows) {
          if (err) console.log("Error deleting User: %s ", err);
          else { 
            res.redirect('/user');
          }
        });
        connection.release();
      });
    }
  }
};

//GET mail management -- query data  (template & logs)
var emailmanage = function(req, res, next) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT * FROM EmailTemplates', function(err, template) {
          if (err) console.log("Error selecting EmailTemplates: %s ", err);
          else {
            var query = connection.query("SELECT Sender, Reciver, emailData, DATE_FORMAT(logDate, '%Y/%m/%d %H:%i:%s') AS logDate FROM EmailLogs ", function(err, logs) {
              if (err) console.log("Error selecting EmailLogs: %s ", err);
              else {
                res.render('emailmanage', {
                  title: "Email Management",
                  user: user,
                  data: template,
                  logs: logs
                });
              }
            });
          }
        });
        connection.release();
      });
    }
  }
};

//POST save email template
var mailsave = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {      
      var input = JSON.parse(JSON.stringify(req.body));      
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        var data = {
          id: id,
          Text: input.Text
        };
        var query = connection.query("UPDATE EmailTemplates set ? WHERE id = ?  ", [data, id], function(err, template) {
          if (err) console.log("Error updating EmailTemplates: %s ", err)
          else {
            console.log("Email template was Updated");
            res.redirect('/emailmanage');
          }
        });
        connection.release();
      });
    }
  }
};

//GET Service Management
var servicemanage = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {      

      /// DELETE OLD SERVICE WHICH EXPIRED ///

      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime,ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user JOIN ServiceActivityType ON ServiceActivities.actType = ServiceActivityType.actType', function(err, state) {
          if (err) console.log("Error selecting State: %s", err);
          else { 
            var query = connection.query('SELECT User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime,DATE_FORMAT(ServiceLogs.timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp,ServiceActivityType.nameE  FROM ServiceLogs LEFT JOIN ServiceActivities ON ServiceLogs.said=ServiceActivities.said JOIN ResourceAllocated ON ResourceAllocated.said = ServiceLogs.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user JOIN ServiceActivityType ON ServiceLogs.actType = ServiceActivityType.actType', function(err, history) {
              if (err) console.log("Error selecting History: %s", err);
              else { 
                var query = connection.query('SELECT ResourceAllocated.said, User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actType = 4', function(err, approve) {
                  if (err) console.log("Error selecting Approve: %s", err);
                  else { 
                    var query = connection.query('SELECT ResourceAllocated.said, User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actbyuser != 1 and actType = 0 ', function(err, request) {
                      if (err) console.log("Error selecting Request: %s", err);
                      else { 
                        var query = connection.query('SELECT ActivePackage.apid,ActivePackage.username,ActivePackage.resourceString1,ActivePackage.resourceString2,ActivePackage.IP1,ActivePackage.IP2,DATE_FORMAT(ActivePackage.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ActivePackage.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ActivePackage', function(err, active) {
                          if (err) console.log("Error selecting Active: %s ", err);
                          else {
                            res.render('servicemanage', {
                              title: "Service Management",
                              active: active,
                              request: request,
                              user: user,
                              history: history,
                              state: state,
                              approve: approve
                            });
                          }
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
        connection.release();
      });
    }
  }
};

//POST add service for admin
var addService = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else { 
      var input = JSON.parse(JSON.stringify(req.body));
      req.getConnection(function(err, connection) {
        var query = connection.query("SELECT id FROM User WHERE username = 'admin' ", function(err, admin_id) {
          if (err) console.log("Error query id: %s ", err);
          else {
            var admin_id_json = JSON.stringify(admin_id);
            var admin_id_parsed = JSON.parse(admin_id_json);  
            var id = admin_id_parsed[0].id;
            var query = connection.query("INSERT INTO ServiceRequests set user = ? ", id, function(err) {
              if (err) console.log("Error inserting ServiceRequests: %s ", err);
              else {
                var query = connection.query("SELECT sid From ServiceRequests WHERE user = ? Order By ServiceRequests.sid Desc LIMIT 1", id, function(err, rows_sid) {
                  if (err) console.log("Error selecting ServiceActivities: %s ", err);
                  else {
                    var rows_sid_json = JSON.stringify(rows_sid);
                    var rows_sid_parsed = JSON.parse(rows_sid_json);
                    var data_serviceac = {
                      sid: rows_sid_parsed[0].sid, 
                      actType: 0, 
                      actbyuser: 0
                    };
                    var query = connection.query("INSERT INTO ServiceActivities SET ?", data_serviceac, function(err) {
                      if (err) console.log("Error inserting ServiceActivities: %s ", err);
                      else {
                        var query = connection.query("SELECT said From ServiceActivities Order By said Desc LIMIT 1", function(err, select_said) {
                          if (err) console.log("Error selecting ServiceActivities: %s ", err);
                          else {
                            var select_said_json = JSON.stringify(select_said);
                            select_said_parsed = JSON.parse(select_said_json);
                            var data = {                              
                              said: select_said_parsed[0].said,
                              resourceString1: input.resourceString1ByAdmin.toString().toLowerCase(),
                              resourceString2: input.resourceString2ByAdmin.toString().toLowerCase(),
                              IP1: input.IP1ByAdmin.toString().toLowerCase(),
                              IP2: input.IP2ByAdmin.toString().toLowerCase(),
                              source_node: 0,
                              des_node: 0,
                              startTime: input.startTimeByAdmin,
                              endTime: input.endTimeByAdmin,
                            };
                            var query = connection.query("INSERT INTO ResourceAllocated SET ? ", data, function(err) {
                              if (err) console.log("Error inserting to DB: %s ", err); 
                              else {
                                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,0 FROM ServiceActivities WHERE said = ?", select_said_parsed[0].said, function(err) {  
                                  if (err) console.log("Error saved log: %s ", err);
                                  else res.redirect('/servicemanage');
                                });
                              } 
                            });
                          }
                        });
                      }
                    });
                  } 
                });                
              }
            });
          }
        });
        connection.release();
      });
    }
  }
};

//GET+POST approve service request
var accept_service = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {  
      var input = JSON.parse(JSON.stringify(req.body));
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        var SAID, IP1, IP2, IDUser = '';
        var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE ResourceAllocated.said = ?', [id], function(err, result) {
          if (err) console.log("Error selecting ResourceAllocated: %s ", err);
          else {
            SAID = result[0].said;
            IP1 = result[0].IP1;
            IP2 = result[0].IP2;
            IDUser = result[0].id;
            var data = {
              said: result[0].said,
              username: result[0].username,
              resourceString1: result[0].resourceString1,
              resourceString2: result[0].resourceString2,
              IP1: result[0].IP1,
              IP2: result[0].IP2,
              startTime: result[0].startTime,
              endTime: result[0].endTime
            };

            //Update IP1 and IP2
            var query = connection.query("UPDATE ResourceAllocated SET IP1 = ?, IP2 = ? WHERE said = ? ", [IP1, IP2, SAID], function(err) {
              if (err) console.log("Error updating ResourceAllocated (accept): %s ", err);
            });

            //Service Actived
            if (result[0].startTime <= new Date()) {
              var query = connection.query("INSERT INTO ActivePackage SET ?", data, function(err, rows) {
                if (err) console.log("Error inserting ActivePackage: %s ", err);
                else {
                  var query = connection.query("UPDATE ServiceActivities SET actType = 7 WHERE said = ? ", [id], function(err, rows) {
                    if (err) console.log("Error updating ServiceActivities: %s ", err);
                    else {
                      var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,7 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                        if (err) console.log("Error inserting ServiceLogs: %s ", err);
                        else res.redirect('/servicemanage');
                      });
                    }
                  });
                }
              });          
            } else {
              //Service Approved
              var query = connection.query("UPDATE ServiceActivities SET actType = 4 WHERE said = ? ", [id], function(err, rows) {
                if (err) console.log("Error updating ServiceActivities: %s ", err);
                else {
                  var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,4 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                    if (err) console.log("Error inserting ServiceLogs: %s ", err);
                    else {                    
                      res.redirect('/servicemanage');
                    }
                  });
                }
              });
            }
            //Email & Saved Log
            var infomation = {
              NameUser: result[0].NameE,
              LastnameUser: result[0].LastNameE,
              SAID: result[0].said,
              startTime: result[0].startTime,
              endTime: result[0].endTime,
              IP1: result[0].IP1,
              IP2: result[0].IP2  
            };              
            email_sender(6, IDUser, infomation);              
          } 
        });
        connection.release();
      });
    }
  }
};

//POST submit edit service for admin
var saveedit_service = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {  
      var input = JSON.parse(JSON.stringify(req.body));
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        var data = {
          resourceString1: input.resourceString1,
          resourceString1: input.resourceString1,
          IP1: input.IP1,
          IP2: input.IP2,
          startTime: input.startTime,
          endTime: input.endTime
        };
        var query = connection.query("UPDATE ActivePackage SET ? WHERE apid = ? ", [data, id], function(err, rows) {
          if (err) console.log("Error updating ActivePackage: %s ", err);
          else res.redirect('/servicemanage');
        });
        connection.release();
      });
    }
  }
};

//GET delete service requested
var delete_service = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        var IDUser = '';
        var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE ResourceAllocated.said = ?', [id], function(err, result) {
          if (err) console.log("Error selecting ResourceAllocated: %s ", err);
          else {
            IDUser = result[0].id;
            var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ServiceActivities.said = ResourceAllocated.said SET actType = 2, actbyuser = 1 WHERE ServiceActivities.said = ?", [id], function(err, rows) {
              if (err) console.log("Error updating ServiceActivities: %s ", err);
              else {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,2 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                  if (err) console.log("Error inserting ServiceLogs: %s ", err);
                  else {
                    email_sender(7, IDUser);
                    res.redirect('/servicemanage');
                  }
                });
              }
            });
          }
        });
        connection.release();
      });
    }
  }
};

//GET delete service approved
var delete_approve = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE ResourceAllocated.said = ?', [id], function(err, result) {
          if (err) console.log("Error selecting ResourceAllocated: %s ", err);
          else {
            var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ServiceActivities.said = ResourceAllocated.said SET actType = 6 , actbyuser=1 WHERE ServiceActivities.said = ?", [id], function(err, rows) {
              if (err) console.log("Error updating ServiceActivities: %s ", err);
              else {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,6 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                  if (err) console.log("Error inserting ServiceLogs: %s ", err);
                  else {
                    var IDUser = result[0].id;
                    var infomation = {
                      NameUser: result[0].NameE,
                      LastnameUser: result[0].LastNameE,
                      SAID: result[0].said,
                      startTime: result[0].startTime,
                      endTime: result[0].endTime
                    };              
                    email_sender(8, IDUser, infomation);
                    res.redirect('/servicemanage');                  
                  }
                });
              }
            });            
          }
        });
        connection.release();
      });
    }
  }
};

//GET cancel active service
var delete_active = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    if (user.role !== 1) res.redirect('/');
    else {
      var id = req.params.id;
      req.getConnection(function(err, connection) {
        var query = connection.query('SELECT * FROM ActivePackage INNER JOIN ResourceAllocated ON ActivePackage.said=ResourceAllocated.said INNER JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said INNER JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid INNER JOIN User ON User.id = ServiceRequests.user WHERE ActivePackage.apid = ?', [id], function(err, result) {
          if (err) console.log("Error selecting ResourceAllocated: %s ", err);
          else {
            var query = connection.query("UPDATE ServiceActivities INNER JOIN ActivePackage ON ServiceActivities.said = ActivePackage.said set actType = 9,actbyuser = 1 WHERE ActivePackage.apid = ? ", [id], function(err, rows) {
              if (err) console.log("Error updating ServiceActivities: %s ", err);
              else {
                var query = connection.query("DELETE FROM ActivePackage  WHERE apid = ? ", [id], function(err, rows) {
                  if (err) console.log("Error deleting ActivePackage: %s ", err);
                  else {
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,9 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                      if (err) console.log("Error inserting ServiceLogs: %s ", err);
                      else {
                        var IDUser = result[0].id;
                        var infomation = {
                          NameUser: result[0].NameE,
                          LastnameUser: result[0].LastNameE,
                          SAID: result[0].said,
                          startTime: result[0].startTime,
                          endTime: result[0].endTime
                        };              
                        email_sender(8, IDUser, infomation);
                        res.redirect('/servicemanage');                  
                      }
                    });
                  }
                });
              }
            });            
          }
        });
        connection.release();
      });
    }
  }
};

//POST sign in
var signInPost = function(req, res, next) {
  passport.authenticate('local', {
    successRedirect: '/signin',
    failureRedirect: '/'
  }, function(err, user, info) {
    if (err) {
      return req.getConnection(function(err, connection) {
        var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status_user) {
          if (err) console.log("Error selecting [01]: %s", err);
          res.render('index', {
            title: 'Home',
            req: req,
            status_user: status_user,
            errorMessage: err.message
          });
        });
        connection.release();
      });
    }
    if (!user) {
      return req.getConnection(function(err, connection) {
        var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status_user) {
          if (err) console.log("Error selecting [02]: %s", err);
          res.render('index', {
            title: 'Home',
            req: req,
            status_user: status_user,
            errorMessage: info.message
          });
        });
        connection.release();
      });
    }
    return req.logIn(user, function(err) {
      if (err) {
        return req.getConnection(function(err, connection) {
          var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status_user) {
            if (err) console.log("Error selecting [03]: %s", err);
            res.render('index', {
              title: 'Home',
              req: req,
              status_user: status_user,
              errorMessage: err.message
            });
          });
          connection.release();
        });
      } else {
        user.flag = 1;
        req.getConnection(function(err, connection) {
          var query = connection.query('INSERT INTO accessLogs(user,action) VALUES(?,1)', [user.username], function(err, rows) {
            if (err) console.log("Error inserting: %s", err);
          });
          connection.release();
        });
        return res.redirect('/');
      }
    });
  })(req, res, next);
};

//GET sign up
var signUp = function(req, res) {
  if (req.isAuthenticated()) res.redirect('/');
  else {
    res.render('signup', {
      title: 'Sign Up'
    });
  }
};

//POST sign up
var signUpPost = function(req, res) {
  var user = req.body;
  var usernamePromise = null;
  usernamePromise = new Model.User({
    username: user.username
  }).fetch();
  return usernamePromise.then(function(model) {
    if (model) {
      res.render('signup', {
        title: 'signup',
        errorMessagesu: 'Username already exists'
      });
    } else {            
      //****************************************************//
      // MORE VALIDATION GOES HERE(E.G. PASSWORD VALIDATION)
      //****************************************************//
      var password = user.password;
      var hash = bcrypt.hashSync(password);
      var signUpUser = new Model.User({
        username: user.username,
        password: hash,
        NameE: user.NameE,
        LastNameE: user.LastNameE,
        org: user.org,
        phone: user.phone,
        email: user.email,
        message: user.message
      });     
      var user_form = {
        username: user.username,
        password: hash,
        NameE: user.NameE,
        LastNameE: user.LastNameE,
        org: user.org,
        phone: user.phone,
        email: user.email,
        membertype: 0,
        flag: 0,
        message: user.message
      };  
      req.getConnection(function(err, connection) {
        var query = connection.query("INSERT INTO `User` SET ?", user_form, function(err, rows) {
          if (err) {
            console.log("Error inserting: %s", err);
            ReportError(res, err);                
          } else {          
            var query = connection.query('SELECT id FROM User WHERE username = ?', user.username, function(err, user_id) {
              if (err) {
                console.log("Error selecting: %s", err);
                ReportError(res, err); 
              } else {
                email_sender(1, user_id[0].id);
                res.render('registed', {
                  title: 'Registed'
                });
              }
            });          
          }
        });
        connection.release();
      });
    }
  });
};

//GET sign out
var signOut = function(req, res) {
  if (!req.isAuthenticated()) res.redirect('/');
  else {
    var user = req.user;
    req.getConnection(function(err, connection) {
      var query = connection.query("UPDATE User set flag=0 WHERE id = ? ", [user.id], function(err, rows) {
        if (err) console.log("Error updating: %s ", err);
        else { 
          var query = connection.query('INSERT INTO accessLogs(user,action) SELECT User.username,2 FROM User WHERE User.id = ?', [user.id], function(err, rows) {
            if (err) console.log("Error inserting: %s ", err);
          }); 
        }
      });
      connection.release();     
    });
    req.logout();
    res.redirect('/');
  }
};

//GET document main page
var doc_page = function(req, res) {
  if (!req.isAuthenticated()) {
    res.render('document', {
      title: 'Document',
      req: req
    });
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    res.render('document', {
      title: 'Document',
      req: req,
      user: user
    });
  }
};

//GET Document PDF
var pdf = function(req, res) {
  var file = __dirname + '/PDF/UniNet-Express-Guildline.pdf';
  res.download(file); // Set disposition and send it.
};

//GET contact page
var contact = function(req, res) {
  if (!req.isAuthenticated()) {
    res.render('contact', {
      title: 'Contact',
      req: req
    });
  } else {
    var user = req.user;
    if (user !== undefined) user = user.toJSON();
    res.render('contact', {
      title: 'Contact',
      req: req,
      user: user
    });
  }
};

// <<--- BEGIN REST API Dev --->>

/* ID: 1 GET profile detail
  in: /rest/profile?id=22&username=admin
  out: {events, timestamp, result:{id, firstname, lastname, organization, phone, email, membertype, message, Msg}} 
*/
var profile_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  if(url_query.id == undefined) url_query.id = 0;
  var result_text = "";

  res.set('Content-Type', 'application/json');

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE username = ? and id = ?', [url_query.username, url_query.id], function(err, user_detail) {
      if (err) {
        result_text = "Error: "+err;
        var response_json = {
          events: "GET Profile Error",
          timestamp: getTimestamp(),
          result: {
            errMsg: "Cannot selecting from database" 
          }
        }
        res.send(response_json);
      } else {
        if(user_detail.length != 0){
          if(user_detail[0].org === 1) var org = "Chulalongkorn University";
          else if(user_detail[0].org === 2) var org = "Kasetsart University";
          else if(user_detail[0].org === 3) var org = "Khon Kean University";
          else if(user_detail[0].org === 4) var org = "Chiang Mai University";
          else if(user_detail[0].org === 5) var org = "Thaksin University";
          else if(user_detail[0].org === 6) var org = "King Mongkut's University of Technology Thonburi";
          else if(user_detail[0].org === 7) var org = "King Mongkut's University of Technology North Bangkok";
          else if(user_detail[0].org === 8) var org = "Suranaree University of Technology";
          else if(user_detail[0].org === 9) var org = "Thammasat University";
          else if(user_detail[0].org === 10) var org = "Nakhon Phanom University";
          else if(user_detail[0].org === 11) var org = "Princess of Naradhiwas University";
          else if(user_detail[0].org === 12) var org = "Naresuan University";
          else if(user_detail[0].org === 13) var org = "Burapha University";
          else if(user_detail[0].org === 14) var org = "University of Phayao";
          else if(user_detail[0].org === 15) var org = "Mahasarakham University";
          else if(user_detail[0].org === 16) var org = "Mahidol University";
          else if(user_detail[0].org === 17) var org = "Maejo University";
          else if(user_detail[0].org === 18) var org = "Mae Fah Luang University";
          else if(user_detail[0].org === 19) var org = "Walailak University";
          else if(user_detail[0].org === 20) var org = "Srinakharinwirot University";
          else if(user_detail[0].org === 21) var org = "Silpakorn University";
          else if(user_detail[0].org === 22) var org = "Prince of Songkla University";
          else if(user_detail[0].org === 23) var org = "Ubon Ratchathani University";
          else if(user_detail[0].org === 24) var org = "King Mongkut's Institute of Technology Ladkrabang";
          else var org = "Invalid";

          if(user_detail[0].membertype === 0) var membertype = "Standard Member";
          else if(user_detail[0].membertype === 1) var membertype = "Premium Member";
          else if(user_detail[0].membertype === 2) var membertype = "Associate Member";
          else var org = "Invalid";        

          result_text = "Complete: GET Profile Detail";
          var response_json = {
            events: "GET Profile Complete",
            timestamp: getTimestamp(),
            result: {
              id: user_detail[0].id,
              firstname: user_detail[0].NameE,
              lastname: user_detail[0].LastNameE,
              organization: org,
              phone: user_detail[0].phone,
              email: user_detail[0].email,
              membertype: membertype,
              message: user_detail[0].message,
              Msg: "GET Profile Detail Success"
            }
          }
          res.send(response_json);          
        } else {
          result_text = "Error: Invalid username or id";
          var response_json = {
            events: "GET Profile Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Invalid username or id" 
            }
          }
          res.send(response_json);
        }              
      }      
      // log saved  
      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 1, result_text], function(err) {
        if (err) console.log("Error inserting access_rest_log: %s", err);
      });      
    });
    connection.release();  
  });
};

/* ID: 2 POST reset password
  in: {user:{username,password,email}}
  out: {events,timestamp,result{Msg}}
*/
var reset_password_rest = function(req, res) {
  var user = JSON.parse(JSON.stringify(req.body.user));
  var result_text = "";
  res.set('Content-Type', 'application/json');

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT * FROM User WHERE username = ? and email = ?',[user.username, user.email] , function(err, user_detail) {
      if (err) {
        result_text = "Error: "+err;
        var response_json = {
          events: "POST Reset Password Error",
          timestamp: getTimestamp(),
          result: {
            errMsg: "Cannot selecting from database" 
          }
        }
        res.send(response_json);
        // log saved  
        var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 2, result_text], function(err) {
          if (err) console.log("Error inserting access_rest_log: %s", err);
        });
      } else {
        if(user_detail.length != 0){
          var hash = bcrypt.hashSync(user.password);
          var query = connection.query("UPDATE User set password = ? WHERE username = ? and email = ? ", [hash, user.username, user.email], function(err) {
            if(err){
              result_text = "Error: "+err;
              var response_json = {
                events: "POST Reset Password Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Cannot updating to database" 
                }
              }
              res.send(response_json);           
            } else {
              result_text = "Complete: POST Reset Password";
              var response_json = {
                events: "POST Reset Password Complete",
                timestamp: getTimestamp(),
                result: {
                  Msg: "Reset Password Success"
                }
              }
              res.send(response_json);
              // email confirmed
              email_sender(4, user_detail[0].id);   
            }
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 2, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            }); 
          });
        } else {
          result_text = "Error: Invalid username or email";
          var response_json = {
            events: "POST Reset Password Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Invalid username or email" 
            }
          }
          res.send(response_json);
          // log saved 
          var query = connection.query('SELECT id FROM User WHERE username = ?',[user.username] , function(err, user_detail) {
            if(err) console.log("Error selecting user data: %s", err);
            else {
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 2, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          });
        }                  
      }            
    });
    connection.release();  
  });
};

/* ID: 3 GET status detail
  in: /rest/status
  out: {events, timestamp, result:{Msg, status:[id, zone, statuss, start_time, duration_time]}} 
*/
var status_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  var result_text = "";

  res.set('Content-Type', 'application/json');

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time FROM Online_Status Order By id', function(err, result_status) {
      if (err) {
        result_text = "Error: "+err;
        var response_json = {
          events: "GET Status Error",
          timestamp: getTimestamp(),
          result: {
            errMsg: "Cannot selecting from database" 
          }
        }
        res.send(response_json);
      } else {
        if(result_status.length != 0){
          result_text = "Complete: GET Status Detail";
          var response_json = {
            events: "GET Status Complete",
            timestamp: getTimestamp(),
            result: {              
              Msg: "GET Status Detail Success",
              status: result_status
            }
          }
          res.send(response_json); 
        } else {
          result_text = "Error: Not have any node in database";
          var response_json = {
            events: "GET Status Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Not have any node in database" 
            }
          }
          res.send(response_json);
        }
      }
      // log saved  
      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 3, result_text], function(err) {
        if (err) console.log("Error inserting access_rest_log: %s", err);
      });
    });
    connection.release();  
  });
};

/* ID: 4 GET services detail
  in: /rest/services/all?id=79&username=test
  out: {events, timestamp, result:{Msg, service_list:[said, resourceString1, resourceString2, IP1, IP2, startTime, endTime, actType, nameE]}} 
*/
var services_all_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  if(url_query.id == undefined) url_query.id = 0;
  var result_text = "";

  res.set('Content-Type', 'application/json');

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE username = ? and id = ?', [url_query.username, url_query.id], function(err, user_detail) {
      if (err) {
        result_text = "Error: "+err;
        var response_json = {
          events: "GET User Detail Error",
          timestamp: getTimestamp(),
          result: {
            errMsg: "Cannot selecting from database" 
          }
        }
        res.send(response_json);
        // log saved  
        var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 4, result_text], function(err) {
          if (err) console.log("Error inserting access_rest_log: %s", err);
        });
      } else {
        if(user_detail.length != 0){
          var query = connection.query('SELECT ResourceAllocated.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType WHERE user = ? and actbyuser != 1 and (ServiceActivities.actType = 0 or ServiceActivities.actType = 4 or ServiceActivities.actType = 7)', [url_query.id], function(err, service_list) {
            if (err) {
              result_text = "Error: "+err;
              var response_json = {
                events: "GET Services All Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Cannot selecting from database" 
                }
              }
              res.send(response_json);
            } else {
              result_text = "Complete: GET Services All";
              var response_json = {
                events: "GET Services All Complete",
                timestamp: getTimestamp(),
                result: {
                  Msg: "GET Services All Success",
                  service_list: service_list
                }
              }
              res.send(response_json);
            }
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 4, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          });
        } else {
          result_text = "Error: Invalid username or id";
          var response_json = {
            events: "GET User Detail Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Invalid username or id" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 4, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        }
      }
    });
    connection.release();
  });
};

/* ID: 5 GET services state
  in: /rest/services/state?id=79&username=test
  out: {events, timestamp, result:{Msg, service_state:[said, resourceString1, resourceString2, IP1, IP2, startTime, endTime, actType, nameE]}} 
*/
var services_state_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  if(url_query.id == undefined) url_query.id = 0;
  var result_text = "";

  res.set('Content-Type', 'application/json');

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE username = ? and id = ?', [url_query.username, url_query.id], function(err, user_detail) {
      if (err) {
        result_text = "Error: "+err;
        var response_json = {
          events: "GET User Detail Error",
          timestamp: getTimestamp(),
          result: {
            errMsg: "Cannot selecting from database" 
          }
        }
        res.send(response_json);
        // log saved  
        var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 5, result_text], function(err) {
          if (err) console.log("Error inserting access_rest_log: %s", err);
        });
      } else {
        if(user_detail.length != 0){
          var query = connection.query('SELECT ResourceAllocated.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType WHERE user = ?', [url_query.id], function(err, service_state) {
            if (err) {
              result_text = "Error: "+err;
              var response_json = {
                events: "GET Services State Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Cannot selecting from database" 
                }
              }
              res.send(response_json);
            } else {
              result_text = "Complete: GET Services State";
              var response_json = {
                events: "GET Services State Complete",
                timestamp: getTimestamp(),
                result: {
                  Msg: "GET Services State Success",
                  service_state: service_state
                }
              }
              res.send(response_json);
            }
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 5, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          });
        } else {
          result_text = "Error: Invalid username or id";
          var response_json = {
            events: "GET User Detail Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Invalid username or id" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 5, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        }
      }
    });
    connection.release();
  });
};

/* ID: 6 GET services history
  in: /rest/services/history?id=79&username=test
  out: {events, timestamp, result:{Msg, service_history:[said, resourceString1, resourceString2, IP1, IP2, startTime, endTime, timestamp, actType, nameE]}} 
*/
var services_history_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  if(url_query.id == undefined) url_query.id = 0;
  var result_text = "";

  res.set('Content-Type', 'application/json');

  req.getConnection(function(err, connection) {
    var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE username = ? and id = ?', [url_query.username, url_query.id], function(err, user_detail) {
      if (err) {
        result_text = "Error: "+err;
        var response_json = {
          events: "GET User Detail Error",
          timestamp: getTimestamp(),
          result: {
            errMsg: "Cannot selecting from database" 
          }
        }
        res.send(response_json);
        // log saved  
        var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 6, result_text], function(err) {
          if (err) console.log("Error inserting access_rest_log: %s", err);
        });
      } else {
        if(user_detail.length != 0){
          var query = connection.query('SELECT ServiceLogs.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , DATE_FORMAT(ServiceLogs.timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType JOIN ServiceLogs ON ServiceActivities.said = ServiceLogs.said WHERE user = ?', [url_query.id], function(err, service_history) {
            if (err) {
              result_text = "Error: "+err;
              var response_json = {
                events: "GET Services History Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Cannot selecting from database" 
                }
              }
              res.send(response_json);
            } else {
              result_text = "Complete: GET Services History";
              var response_json = {
                events: "GET Services History Complete",
                timestamp: getTimestamp(),
                result: {
                  Msg: "GET Services History Success",
                  service_history: service_history
                }
              }
              res.send(response_json);
            }
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 6, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          });
        } else {
          result_text = "Error: Invalid username or id";
          var response_json = {
            events: "GET User Detail Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Invalid username or id" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 6, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        }
      }
    });
    connection.release();
  });
};

/* ID: 7 GET [admin] services requested
  in: /rest/services/requested?id=22&username=admin
  out: {events, timestamp, result:{Msg, service_requested:[said, username, resourceString1, resourceString2, IP1, IP2, startTime, endTime]}} 
*/
var services_requested_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(url_query.id == undefined) {
    result_text = "Error: Invalid username or id";
      var response_json = {
        events: "GET User Detail Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid username or id" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 7, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [url_query.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "GET User Detail Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 7, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0){ 
            if (user_detail[0].username == url_query.username) {
              var query = connection.query('SELECT ResourceAllocated.said, User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actbyuser != 1 and actType = 0 ORDER BY said DESC', function(err, service_requested) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "GET Services Requested Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }               
                } else {
                  result_text = "Complete: GET Services Requested";
                  var response_json = {
                    events: "GET Services Requested Complete",
                    timestamp: getTimestamp(),
                    result: {
                      Msg: "GET Services Requested Success",
                      service_requested: service_requested
                    }
                  }                 
                }
                res.send(response_json);
                // log saved  
                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 7, result_text], function(err) {
                  if (err) console.log("Error inserting access_rest_log: %s", err);
                });
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "GET Services Requested Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 7, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }            
          } else { 
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "GET User Detail Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username or id" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 7, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 8 GET [admin] services approved
  in: /rest/services/approved?id=22&username=admin
  out: {events, timestamp, result:{Msg, service_approved:[said, username, resourceString1, resourceString2, IP1, IP2, startTime, endTime]}} 
*/
var services_approved_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(url_query.id == undefined) {
    result_text = "Error: Invalid username or id";
      var response_json = {
        events: "GET User Detail Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid username or id" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 8, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [url_query.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "GET User Detail Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 8, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0){ 
            if (user_detail[0].username == url_query.username) {
              var query = connection.query('SELECT ResourceAllocated.said, User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actType = 4', function(err, service_requested) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "GET Services Approved Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }               
                } else {
                  result_text = "Complete: GET Services Approved";
                  var response_json = {
                    events: "GET Services Approved Complete",
                    timestamp: getTimestamp(),
                    result: {
                      Msg: "GET Services Approved Success",
                      service_approved: service_approved
                    }
                  }                 
                }
                res.send(response_json);
                // log saved  
                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 8, result_text], function(err) {
                  if (err) console.log("Error inserting access_rest_log: %s", err);
                });
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "GET Services Approved Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 8, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }            
          } else { 
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "GET User Detail Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username or id" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 8, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 9 GET [admin] services activated
  in: /rest/services/activated?id=22&username=admin
  out: {events, timestamp, result:{Msg, service_activated:[apid, username, resourceString1, resourceString2, IP1, IP2, startTime, endTime]}} 
*/
var services_activated_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(url_query.id == undefined) {
    result_text = "Error: Invalid username or id";
      var response_json = {
        events: "GET User Detail Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid username or id" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 9, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [url_query.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "GET User Detail Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 9, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0){ 
            if (user_detail[0].username == url_query.username) {
              var query = connection.query('SELECT ActivePackage.apid,ActivePackage.username,ActivePackage.resourceString1,ActivePackage.resourceString2,ActivePackage.IP1,ActivePackage.IP2,DATE_FORMAT(ActivePackage.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ActivePackage.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ActivePackage', function(err, service_activated) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "GET Services Approved Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }               
                } else {
                  result_text = "Complete: GET Services Approved";
                  var response_json = {
                    events: "GET Services Approved Complete",
                    timestamp: getTimestamp(),
                    result: {
                      Msg: "GET Services Approved Success",
                      service_activated: service_activated
                    }
                  }                 
                }
                res.send(response_json);
                // log saved  
                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 9, result_text], function(err) {
                  if (err) console.log("Error inserting access_rest_log: %s", err);
                });
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "GET Services Approved Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 9, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }            
          } else { 
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "GET User Detail Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username or id" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 9, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 10 GET [admin] user requested
  in: /rest/user/requested?id=22&username=admin
  out: {events, timestamp, result:{Msg, req_user:[id, username, NameE, LastNameE, email, org, phone, message]}} 
*/
var user_requested_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(url_query.id == undefined) {
    result_text = "Error: Invalid username or id";
      var response_json = {
        events: "GET User Detail Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid username or id" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 10, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [url_query.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "GET User Detail Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 10, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0){ 
            if (user_detail[0].username == url_query.username) {
              var query = connection.query('SELECT User.id, User.username, User.NameE, User.LastNameE,  User.email, org.nameE AS org, User.phone, User.message FROM User JOIN org ON User.org = org.org WHERE role IS NULL', function(err, req_user) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "GET User Requested Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }               
                } else {
                  result_text = "Complete: GET User Requested";
                  var response_json = {
                    events: "GET User Requested Complete",
                    timestamp: getTimestamp(),
                    result: {
                      Msg: "GET User Requested Success",
                      req_user: req_user
                    }
                  }                 
                }
                res.send(response_json);
                // log saved  
                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 10, result_text], function(err) {
                  if (err) console.log("Error inserting access_rest_log: %s", err);
                });
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "GET User Requested Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 10, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }            
          } else { 
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "GET User Detail Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username or id" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 10, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 11 POST [admin] user [for requested] accept
  in: /rest/user/accept {user:{id,username}, target:{id,username}}
  out: {events, timestamp, result:{Msg}} 
*/
var user_accept_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var user = body.user;
  var target = body.target;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(target == undefined || body == undefined || user == undefined || user.id == undefined || user.username == undefined || target.id == undefined || target.username == undefined) {
    result_text = "Error: Invalid user or target";
      var response_json = {
        events: "POST User Requested Accept Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid user or target" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 11, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [user.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST User Requested Accept Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {          
          if(user_detail.length != 0) {
            if (user_detail[0].username == user.username) {
              var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [target.id], function(err, target_detail) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "POST User Requested Accept Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {          
                  if(target_detail.length != 0) {
                    if (target_detail[0].username == target.username) {
                      var query = connection.query("UPDATE User SET role = 2 WHERE id = ? ", [target.id], function(err, rows) {
                        if (err) {
                          result_text = "Error: "+err;
                          var response_json = {
                            events: "POST User Requested Accept Error",
                            timestamp: getTimestamp(),
                            result: {
                              errMsg: "Cannot updating to database" 
                            }
                          }
                          res.send(response_json);
                          // log saved  
                          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
                            if (err) console.log("Error inserting access_rest_log: %s", err);
                          });
                        }
                        else {
                          result_text = "Complete: POST User Requested Accept";
                          var response_json = {
                            events: "POST User Requested Accept Complete",
                            timestamp: getTimestamp(),
                            result: {
                              Msg: "POST User Requested Accept Success"
                            }
                          }                                
                          res.send(response_json);                    
                          // email_sender(2, id);
                          // log saved  
                          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
                            if (err) console.log("Error inserting access_rest_log: %s", err);
                          }); 
                        }
                      });
                    } else {
                      result_text = "Error: "+err;
                      var response_json = {
                        events: "POST User Requested Accept Error",
                        timestamp: getTimestamp(),
                        result: {
                          errMsg: "Invalid user or target" 
                        }
                      }
                      res.send(response_json);
                      // log saved  
                      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
                        if (err) console.log("Error inserting access_rest_log: %s", err);
                      });
                    }
                  } else {
                    result_text = "Error: "+err;
                    var response_json = {
                      events: "POST User Requested Accept Error",
                      timestamp: getTimestamp(),
                      result: {
                        errMsg: "Invalid user or target" 
                      }
                    }
                    res.send(response_json);
                    // log saved  
                    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
                      if (err) console.log("Error inserting access_rest_log: %s", err);
                    });
                  }
                }
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "POST User Requested Accept Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          } else {
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "POST User Requested Accept Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid user or target" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 11, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 12 POST [admin] user [for all user] edit
  in: /rest/user/edit {user:{id,username}, target:{id,username,NameE,LastNameE,org,phone,email,membertype,role}}
  out: {events, timestamp, result:{Msg}} 
*/
var user_edit_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var user = body.user;
  var target = body.target;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(target == undefined || body == undefined || user == undefined || user.id == undefined || user.username == undefined || target.id == undefined || target.username == undefined) {
    result_text = "Error: Invalid user or target";
      var response_json = {
        events: "POST User Edit Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid user or target" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 12, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [user.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST User Edit Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {          
          if(user_detail.length != 0) {
            if (user_detail[0].username == user.username) {
              var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, role FROM User WHERE id = ?', [target.id], function(err, target_detail) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "POST User Edit Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {          
                  if(target_detail.length != 0) {
                    if (target_detail[0].username == target.username) {
                      // Conditions if input are blank = old value
                      var new_NameE, new_LastNameE, new_org, new_phone, new_email, new_membertype, new_role;
                      target.NameE == undefined ? new_NameE = target_detail[0].NameE : new_NameE = target.NameE;
                      target.LastNameE == undefined ? new_LastNameE = target_detail[0].LastNameE : new_LastNameE = target.LastNameE;
                      target.org == undefined ? new_org = target_detail[0].org : new_org = target.org;
                      target.phone == undefined ? new_phone = target_detail[0].phone : new_phone = target.phone;
                      target.email == undefined ? new_email = target_detail[0].email : new_email = target.email;
                      target.membertype == undefined ? new_membertype = target_detail[0].membertype : new_membertype = target.membertype;
                      target.role == undefined ? new_role = target_detail[0].role : new_role = target.role;
                      
                      var data_updated = {
                        username: target.username,
                        NameE: new_NameE,
                        LastNameE: new_LastNameE,
                        org: new_org,
                        phone: new_phone,
                        email: new_email,
                        membertype: new_membertype,
                        role: new_role
                      }
                      var query = connection.query("UPDATE User set ? WHERE id = ? ", [data_updated, target.id], function(err, rows) {
                        if (err) {
                          result_text = "Error: "+err;
                          var response_json = {
                            events: "POST User Edit Error",
                            timestamp: getTimestamp(),
                            result: {
                              errMsg: "Cannot updating to database" 
                            }
                          }
                          res.send(response_json);
                          // log saved  
                          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
                            if (err) console.log("Error inserting access_rest_log: %s", err);
                          });
                        } else {
                          result_text = "Complete: POST User Edit";
                          var response_json = {
                            events: "POST User Edit Complete",
                            timestamp: getTimestamp(),
                            result: {
                              Msg: "POST User Edit Success"
                            }
                          }                                
                          res.send(response_json); 
                          // log saved  
                          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
                            if (err) console.log("Error inserting access_rest_log: %s", err);
                          }); 
                        }
                      });
                    } else {
                      result_text = "Error: "+err;
                      var response_json = {
                        events: "POST User Edit Error",
                        timestamp: getTimestamp(),
                        result: {
                          errMsg: "Invalid user or target" 
                        }
                      }
                      res.send(response_json);
                      // log saved  
                      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
                        if (err) console.log("Error inserting access_rest_log: %s", err);
                      });
                    }
                  } else {
                    result_text = "Error: "+err;
                    var response_json = {
                      events: "POST User Edit Error",
                      timestamp: getTimestamp(),
                      result: {
                        errMsg: "Invalid user or target" 
                      }
                    }
                    res.send(response_json);
                    // log saved  
                    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
                      if (err) console.log("Error inserting access_rest_log: %s", err);
                    });
                  }
                }
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "POST User Edit Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          } else {
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "POST User Edit Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid user or target" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 12, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 13 POST [admin] user [for all user] delete
  in: /rest/user/delete {user:{id,username}, target:{id,username}}
  out: {events, timestamp, result:{Msg}} 
*/
var user_delete_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var user = body.user;
  var target = body.target;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(target == undefined || body == undefined || user == undefined || user.id == undefined || user.username == undefined || target.id == undefined || target.username == undefined) {
    result_text = "Error: Invalid user or target";
      var response_json = {
        events: "POST User Delete Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid user or target" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 13, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [user.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST User Delete Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {          
          if(user_detail.length != 0) {
            if (user_detail[0].username == user.username) {
              var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [target.id], function(err, target_detail) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "POST User Delete Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {          
                  if(target_detail.length != 0) {
                    if (target_detail[0].username == target.username) {
                      var query = connection.query("DELETE FROM User WHERE id = ?", [target.id], function(err, rows) {
                        if (err) {
                          result_text = "Error: "+err;
                          var response_json = {
                            events: "POST User Delete Error",
                            timestamp: getTimestamp(),
                            result: {
                              errMsg: "Cannot updating to database" 
                            }
                          }
                          res.send(response_json);
                          // log saved  
                          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
                            if (err) console.log("Error inserting access_rest_log: %s", err);
                          });
                        }
                        else {
                          result_text = "Complete: POST User Delete";
                          var response_json = {
                            events: "POST User Delete Complete",
                            timestamp: getTimestamp(),
                            result: {
                              Msg: "POST User Delete Success"
                            }
                          }                                
                          res.send(response_json);
                          // log saved  
                          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
                            if (err) console.log("Error inserting access_rest_log: %s", err);
                          }); 
                        }
                      });
                    } else {
                      result_text = "Error: "+err;
                      var response_json = {
                        events: "POST User Delete Error",
                        timestamp: getTimestamp(),
                        result: {
                          errMsg: "Invalid user or target" 
                        }
                      }
                      res.send(response_json);
                      // log saved  
                      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
                        if (err) console.log("Error inserting access_rest_log: %s", err);
                      });
                    }
                  } else {
                    result_text = "Error: "+err;
                    var response_json = {
                      events: "POST User Delete Error",
                      timestamp: getTimestamp(),
                      result: {
                        errMsg: "Invalid user or target" 
                      }
                    }
                    res.send(response_json);
                    // log saved  
                    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
                      if (err) console.log("Error inserting access_rest_log: %s", err);
                    });
                  }
                }
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "POST User Delete Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          } else {
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "POST User Delete Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid user or target" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user.id, 13, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 14 GET [admin] all user
  in: /rest/user/all?id=22&username=admin
  out: {events, timestamp, result:{Msg, user_list:[id, username, NameE, LastNameE, email, org, phone, message]}} 
*/
var user_all_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(url_query.id == undefined) {
    result_text = "Error: Invalid username or id";
      var response_json = {
        events: "GET All User Error",
        timestamp: getTimestamp(),
        result: {
          errMsg: "Invalid username or id" 
        }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 14, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [url_query.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "GET All User Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 14, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0){ 
            if (user_detail[0].username == url_query.username) {
              var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, role, flag, message FROM User WHERE role IS NOT NULL', function(err, user_list) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "GET All User Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }               
                } else {
                  result_text = "Complete: GET All User";
                  var response_json = {
                    events: "GET All User Complete",
                    timestamp: getTimestamp(),
                    result: {
                      Msg: "GET All User Success",
                      user_list: user_list
                    }
                  }                 
                }
                res.send(response_json);
                // log saved  
                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 14, result_text], function(err) {
                  if (err) console.log("Error inserting access_rest_log: %s", err);
                });
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "GET All User Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 14, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }            
          } else { 
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "GET All User Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username or id" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 14, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 15 GET [admin] user access logs
  in: /rest/user/logs?id=22&username=admin or /rest/user/logs?id=22&username=admin&limit=20
  out: {events, timestamp, result:{Msg, logs:[user, nameE, timestamp]}} 
*/
var user_accesslogs_rest = function(req, res) {
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;

  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(url_query.id == undefined) {
    result_text = "Error: Invalid username or id";
    var response_json = {
      events: "GET User Access Logs Error",
      timestamp: getTimestamp(),
      result: {
        errMsg: "Invalid username or id" 
      }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 15, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, NameE, LastNameE, org, phone, email, membertype, message FROM User WHERE id = ?', [url_query.id], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "GET User Access Logs Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 15, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0){ 
            if (user_detail[0].username == url_query.username) {
              var n = 50;
              if(url_query.n != undefined) n = url_query.n;
              var query_str = 'SELECT user, actionType.nameE , DATE_FORMAT(timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp FROM accessLogs INNER JOIN actionType ON accessLogs.action = actionType.action ORDER BY id DESC LIMIT '+n;
              var query = connection.query(query_str, function(err, logs) {
                if (err) {
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "GET User Access Logs Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }              
                } else {
                  result_text = "Complete: GET User Access Logs";
                  var response_json = {
                    events: "GET User Access Logs Complete",
                    timestamp: getTimestamp(),
                    result: {
                      Msg: "GET User Access Logs Success",
                      logs: logs
                    }
                  }                 
                }
                res.send(response_json);
                // log saved  
                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 15, result_text], function(err) {
                  if (err) console.log("Error inserting access_rest_log: %s", err);
                });
              });
            } else {
              result_text = "Error: Not administrator privilege";
              var response_json = {
                events: "GET User Access Logs Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Not administrator privilege" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 15, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }            
          } else { 
            result_text = "Error: Invalid username or id";
            var response_json = {
              events: "GET User Access Logs Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username or id" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), url_query.id, 15, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 16 POST user signup
  in: /rest/user/signup {username, password, NameE, LastNameE, org, phone, email, message}
  out: {events, timestamp, result:{Msg}} 
*/
var user_signup_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var password = body.password;
  var hash = bcrypt.hashSync(password);
  var user_form = {
    username: body.username,
    password: hash,
    NameE: body.NameE,
    LastNameE: body.LastNameE,
    org: body.org,
    phone: body.phone,
    email: body.email,
    membertype: 0,
    flag: 0,
    message: body.message
  };
  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(body == undefined || body.username == undefined || body.password == undefined || body.NameE == undefined || body.LastNameE == undefined || body.org == undefined || body.phone == undefined || body.email == undefined || body.message == undefined) {
    result_text = "Error: Invalid Sign Up Form";
    var response_json = {
      events: "POST Sign Up Error",
      timestamp: getTimestamp(),
      result: {
        errMsg: "Invalid user or target" 
      }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 16, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query("INSERT INTO `User` SET ?", user_form, function(err) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST Sign Up Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot inserting to database" 
            }
          } 
        } else {
          result_text = "Complete: POST Sign Up";
          var response_json = {
            events: "POST Sign Up Complete",
            timestamp: getTimestamp(),
            result: {
              Msg: "POST Sign Up Success"
            }
          }
        }        
        res.send(response_json);
        // log saved  
        var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 16, result_text], function(err) {
          if (err) console.log("Error inserting access_rest_log: %s", err);
        });
      });
      connection.release();
    });
  }
};

/* ID: 17 GET rest access logs
  in: /rest/logs or /rest/logs?n=3
  out: {events, timestamp, result:{Msg, logs:[id, timestamp, userid, accessType, result]}} 
*/
var access_logs_rest = function(req, res) {  
  var url_parts = url.parse(req.url, true);
  var url_query = url_parts.query;

  res.set('Content-Type', 'application/json');  
  
  req.getConnection(function(err, connection) {
    var n = 50;
    if(url_query.n != undefined) n = url_query.n;
      var query_str = 'SELECT * FROM access_rest_log ORDER BY id DESC LIMIT '+n;
      var query = connection.query(query_str, function(err, logs) {
        if (err) {
          var response_json = {
            events: "GET REST Access Logs Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          console.log("Error: "+err);               
        } else {
          var response_json = {
            events: "GET REST Access Logs Complete",
            timestamp: getTimestamp(),
            result: {
              Msg: "GET REST Access Logs Success",
              logs: logs
            }
          }
          console.log("Complete: GET REST Access Logs");                 
        }
        res.send(response_json);
      });
    connection.release();
  });
};

/* ID: 18 POST add service rest
  in: /rest/service/add {user:{username,password}, service_request:{resorceString1,resorceString2,IP1,IP2,startTime,endTime}}
  out: {events, timestamp, result:{Msg}}
*/
var add_service_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var user = body.user;
  var service_request = body.service_request;

  var password = user.password;

  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(body == undefined || user == undefined || service_request == undefined || user.username == undefined || user.password == undefined || service_request.resourceString1 == undefined || service_request.resourceString2 == undefined || service_request.IP1 == undefined || service_request.IP2 == undefined || service_request.startTime == undefined || service_request.endTime == undefined) {
    result_text = "Error: Invalid Service Add Form";
    var response_json = {
      events: "POST Service Add Error",
      timestamp: getTimestamp(),
      result: {
        errMsg: "Invalid user or service_request" 
      }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 18, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, password FROM User WHERE username = ?', [user.username], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST Service Add Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 18, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0) { 
            if (bcrypt.compareSync(password, user_detail[0].password)) {
              var query = connection.query("INSERT INTO ServiceRequests set user = ? ", user_detail[0].id, function(err) {
                if (err) console.log("Error inserting ServiceRequests: %s ", err);
                else {
                  var query = connection.query("SELECT sid From ServiceRequests WHERE user = ? Order By ServiceRequests.sid Desc LIMIT 1", user_detail[0].id, function(err, result_sid) {
                    if (err) console.log("Error selecting ServiceActivities: %s ", err);
                    else {
                      var data_serviceac = {
                        sid: result_sid[0].sid, 
                        actType: 0, 
                        actbyuser: 0
                      }
                      var query = connection.query("INSERT INTO ServiceActivities SET ?", data_serviceac, function(err) {
                        if (err) console.log("Error inserting ServiceActivities: %s ", err);
                        else {
                          var query = connection.query("SELECT said From ServiceActivities Order By said Desc LIMIT 1", function(err, result_said) {
                            if (err) console.log("Error selecting said: %s ", err);
                            else {
                              var data_form = {
                                resourceString1: service_request.resourceString1.toString().toLowerCase(),
                                resourceString2: service_request.resourceString2.toString().toLowerCase(),
                                IP1: service_request.IP1.toString().toLowerCase(),
                                IP2: service_request.IP2.toString().toLowerCase(),
                                startTime: service_request.startTime,
                                endTime: service_request.endTime,
                                said: result_said[0].said,
                                source_node: 0,
                                des_node: 0
                              };                                                        
                              var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,0 FROM ServiceActivities WHERE said = ?", result_said[0].said, function(err) {
                                if (err) console.log("Error inserting ServiceLogs: %s ", err);
                                else {
                                  var query = connection.query("INSERT INTO ResourceAllocated set ? ", data_form, function(err, rows) {
                                    if (err) {
                                      console.log("Error inserting ResourceAllocated: %s ", err);
                                      result_text = "Error: POST Service Add";
                                      var response_json = {
                                        events: "POST Service Add Error",
                                        timestamp: getTimestamp(),
                                        result: {
                                          errMsg: "Data request wrong" 
                                        }
                                      }
                                      res.send(response_json);
                                      // log saved  
                                      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 18, result_text], function(err) {
                                        if (err) console.log("Error inserting access_rest_log: %s", err);
                                      });
                                    } else {
                                      email_sender(5, user_detail[0].id);
                                      result_text = "Complete: POST Service Add";
                                      var response_json = {
                                        events: "POST Service Add Conplete",
                                        timestamp: getTimestamp(),
                                        result: {
                                          Msg: "POST Service Add Success" 
                                        }
                                      }
                                      res.send(response_json);
                                      // log saved  
                                      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 18, result_text], function(err) {
                                        if (err) console.log("Error inserting access_rest_log: %s", err);
                                      });
                                    }  
                                  });
                                }  
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            } else {
              result_text = "Error: Invalid password";
              var response_json = {
                events: "POST Service Add Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Invalid password" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 18, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          } else {
            result_text = "Error: Invalid username";
            var response_json = {
              events: "POST Service Add Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 18, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 19 POST edit service rest
  in: /rest/service/add {user:{username,password}, service_request:{resorceString1,resorceString2,IP1,IP2,startTime,endTime}}
  out: {events, timestamp, result:{Msg}}
*/
var edit_service_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var user = body.user;
  var service_edit = body.service_edit;

  var password = user.password;

  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(body == undefined || user == undefined || service_edit == undefined || user.username == undefined || user.password == undefined || service_edit.resourceString1 == undefined || service_edit.resourceString2 == undefined || service_edit.IP1 == undefined || service_edit.IP2 == undefined || service_edit.startTime == undefined || service_edit.endTime == undefined || service_edit.said == undefined) {
    result_text = "Error: Invalid Service Edit Form";
    var response_json = {
      events: "POST Service Edit Error",
      timestamp: getTimestamp(),
      result: {
        errMsg: "Invalid user or service_edit" 
      }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 19, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, password FROM User WHERE username = ?', [user.username], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST Service Edit Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 19, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0) { 
            if (bcrypt.compareSync(password, user_detail[0].password)) {
              var said = service_edit.said;
              var updated_data = {
                resourceString1: service_edit.resourceString1,
                resourceString1: service_edit.resourceString1,
                IP1: service_edit.IP1,
                IP2: service_edit.IP2,
                startTime: service_edit.startTime,
                endTime: service_edit.endTime
              };
              var query_str = "UPDATE ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said SET ? WHERE ServiceActivities.ActType = 0 and ResourceAllocated.said = " + said;
              var query = connection.query(query_str, updated_data, function(err) {
                if (err) {
                  console.log("Error updating ResourceAllocated: %s ", err);
                  result_text = "Error: POST Service Edit";
                  var response_json = {
                    events: "POST Service Edit Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Data request wrong" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 19, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {
                  result_text = "Complete: POST Service Edit";
                  var response_json = {
                    events: "POST Service Edit Conplete",
                    timestamp: getTimestamp(),
                    result: {
                      Msg: "POST Service Edit Success" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 19, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                }
              });
            } else {
              result_text = "Error: Invalid password";
              var response_json = {
                events: "POST Service Edit Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Invalid password" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 19, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          } else {
            result_text = "Error: Invalid username";
            var response_json = {
              events: "POST Service Edit Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 19, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 20 POST delete service rest
  in: /rest/service/delete {user:{username,password}, service_delete:{said}}
  out: {events, timestamp, result:{Msg}}
*/
var delete_service_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var user = body.user;
  var service_delete = body.service_delete;

  var password = user.password;

  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(body == undefined || user == undefined || service_delete == undefined || user.username == undefined || user.password == undefined || service_delete.said == undefined) {
    result_text = "Error: Invalid Service Delete Form";
    var response_json = {
      events: "POST Service Delete Error",
      timestamp: getTimestamp(),
      result: {
        errMsg: "Invalid user or service_delete" 
      }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 20, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, password FROM User WHERE username = ?', [user.username], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST Service Delete Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 20, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0) { 
            if (bcrypt.compareSync(password, user_detail[0].password)) {
              var said = service_delete.said;
              var deleted_status = false;

              var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 1 WHERE actType = 0 and said = ? ", [said], function(err, result_del) {
                if (err) {
                  console.log("Update Request Service Error: %s", err);
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "POST Service Delete Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot updating Request Service to database" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 20, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {
                  if (result_del.length != 0) deleted_response(res, user_detail[0].id, true);
                  else deleted_response(res, user_detail[0].id, false);
                  var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,1 FROM ServiceActivities WHERE said = ?", [said], function(err) {
                    if (err) console.log("Insert Log Error: %s ", err);
                  });
                }
              });
              var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 5 WHERE actType = 4 and said = ? ", [said], function(err, result_del) {
                if (err) {
                  console.log("Update Service Approved Error: %s", err);
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "POST Service Delete Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot updating Service Approved to database" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 20, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {
                  if (result_del.length != 0) deleted_response(res, user_detail[0].id, true);
                  else deleted_response(res, user_detail[0].id, false);
                  var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,5 FROM ServiceActivities WHERE said = ?", [said], function(err) {
                    if (err) console.log("Insert Log Error: %s ", err);
                  });
                }
              });
              var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 8 WHERE actType = 7 and said = ? ", [said], function(err, result_del) {
                if (err) {
                  console.log("Update Active Service Error: %s", err);
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "POST Service Delete Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot updating Active Service to database" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 20, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {
                  if (result_del.length != 0) deleted_response(res, user_detail[0].id, true);
                  else deleted_response(res, user_detail[0].id, false);
                  var query = connection.query("DELETE FROM ActivePackage WHERE said = ?", [said], function(err) {
                    if (err) {
                      console.log("Delete Active Service Error : %s ", err);
                      result_text = "Error: "+err;
                      var response_json = {
                        events: "POST Service Delete Error",
                        timestamp: getTimestamp(),
                        result: {
                          errMsg: "Cannot deleting Active Service from database" 
                        }
                      }
                      res.send(response_json);
                      // log saved  
                      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 20, result_text], function(err) {
                        if (err) console.log("Error inserting access_rest_log: %s", err);
                      });
                    }
                  });
                  var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,8 FROM ServiceActivities WHERE said = ?", [said], function(err) {
                    if (err) console.log("Insert Log Error: %s ", err);
                  });
                }
              });
            } else {
              result_text = "Error: Invalid password";
              var response_json = {
                events: "POST Service Delete Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Invalid password" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 20, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          } else {
            result_text = "Error: Invalid username";
            var response_json = {
              events: "POST Service Delete Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 20, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

/* ID: 21 POST accept service rest
  in: /rest/service/accept {user:{username,password}, service_accept:{said}}
  out: {events, timestamp, result:{Msg}}
*/
var accept_service_rest = function(req, res) {
  var body = JSON.parse(JSON.stringify(req.body));
  var user = body.user;
  var service_accept = body.service_accept;

  var password = user.password;

  var result_text = "";
  var response_json = "";

  res.set('Content-Type', 'application/json');

  if(body == undefined || user == undefined || service_accept == undefined || user.username == undefined || user.password == undefined || service_accept.said == undefined) {
    result_text = "Error: Invalid Service Accept Form";
    var response_json = {
      events: "POST Service Accept Error",
      timestamp: getTimestamp(),
      result: {
        errMsg: "Invalid user or service_accept" 
      }
    }
    res.send(response_json);
    // log saved  
    var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), 0, 21, result_text], function(err) {
      if (err) console.log("Error inserting access_rest_log: %s", err);
    });    
  } else {
    req.getConnection(function(err, connection) {
      var query = connection.query('SELECT id, username, password FROM User WHERE username = ?', [user.username], function(err, user_detail) {
        if (err) {
          result_text = "Error: "+err;
          var response_json = {
            events: "POST Service Accept Error",
            timestamp: getTimestamp(),
            result: {
              errMsg: "Cannot selecting from database" 
            }
          }
          res.send(response_json);
          // log saved  
          var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
            if (err) console.log("Error inserting access_rest_log: %s", err);
          });
        } else {
          if(user_detail.length != 0) { 
            if (bcrypt.compareSync(password, user_detail[0].password)) {
              var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE ResourceAllocated.said = ?', [service_accept.said], function(err, result) {
                if (err) {
                  console.log("Error selecting ResourceAllocated: %s ", err);
                  result_text = "Error: "+err;
                  var response_json = {
                    events: "POST Service Accept Error",
                    timestamp: getTimestamp(),
                    result: {
                      errMsg: "Cannot selecting from database" 
                    }
                  }
                  res.send(response_json);
                  // log saved  
                  var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                    if (err) console.log("Error inserting access_rest_log: %s", err);
                  });
                } else {
                  var data = {
                    said: result[0].said,
                    username: result[0].username,
                    resourceString1: result[0].resourceString1,
                    resourceString2: result[0].resourceString2,
                    IP1: result[0].IP1,
                    IP2: result[0].IP2,
                    startTime: result[0].startTime,
                    endTime: result[0].endTime
                  };
                  //Service Actived
                  if (result[0].startTime <= new Date()) {
                    var query = connection.query("INSERT INTO ActivePackage SET ?", data, function(err, rows) {
                      if (err) {
                        console.log("Error inserting ActivePackage: %s ", err);
                        result_text = "Error: "+err;
                        var response_json = {
                          events: "POST Service Accept Error",
                          timestamp: getTimestamp(),
                          result: {
                            errMsg: "Cannot inserting to database" 
                          }
                        }
                        res.send(response_json);
                        // log saved  
                        var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                          if (err) console.log("Error inserting access_rest_log: %s", err);
                        });
                      } else {
                        var query = connection.query("UPDATE ServiceActivities SET actType = 7 WHERE said = ? ", [id], function(err, rows) {
                          if (err) {
                            console.log("Error updating ServiceActivities: %s ", err);
                            result_text = "Error: "+err;
                            var response_json = {
                              events: "POST Service Accept Error",
                              timestamp: getTimestamp(),
                              result: {
                                errMsg: "Cannot updating ServiceActivities to database" 
                              }
                            }
                            res.send(response_json);
                            // log saved  
                            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                              if (err) console.log("Error inserting access_rest_log: %s", err);
                            });
                          } else {
                            var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,7 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                              if (err) {
                                console.log("Error inserting ServiceLogs: %s ", err);
                                result_text = "Error: "+err;
                                var response_json = {
                                  events: "POST Service Accept Error",
                                  timestamp: getTimestamp(),
                                  result: {
                                    errMsg: "Cannot inserting ServiceLogs to database" 
                                  }
                                }
                                res.send(response_json);
                                // log saved  
                                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                                  if (err) console.log("Error inserting access_rest_log: %s", err);
                                });
                              } else {
                                result_text = "Complete: POST Service Accept";
                                var response_json = {
                                  events: "POST Service Accept Complete",
                                  timestamp: getTimestamp(),
                                  result: {
                                    Msg: "POST Service Accept Success" 
                                  }
                                }
                                res.send(response_json);
                                // log saved  
                                var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                                  if (err) console.log("Error inserting access_rest_log: %s", err);
                                });
                              }
                            });
                          }
                        });
                      }
                    });
                  } else {
                    //Service Approved
                    var query = connection.query("UPDATE ServiceActivities SET actType = 4 WHERE said = ? ", [service_accept.said], function(err, rows) {
                      if (err) {
                        console.log("Error updating ServiceActivities: %s ", err);
                        result_text = "Error: "+err;
                        var response_json = {
                          events: "POST Service Accept Error",
                          timestamp: getTimestamp(),
                          result: {
                            errMsg: "Cannot updating ServiceActivities to database" 
                          }
                        }
                        res.send(response_json);
                        // log saved  
                        var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                          if (err) console.log("Error inserting access_rest_log: %s", err);
                        });
                      } else {
                        var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,4 FROM ServiceActivities WHERE said = ?", [service_accept.said], function(err) {
                          if (err) {
                            console.log("Error inserting ServiceLogs: %s ", err);
                            result_text = "Error: "+err;
                            var response_json = {
                              events: "POST Service Accept Error",
                              timestamp: getTimestamp(),
                              result: {
                                errMsg: "Cannot inserting ServiceLogs to database" 
                              }
                            }
                            res.send(response_json);
                            // log saved  
                            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                              if (err) console.log("Error inserting access_rest_log: %s", err);
                            });
                          } else { 
                            result_text = "Complete: POST Service Accept";
                            var response_json = {
                              events: "POST Service Accept Complete",
                              timestamp: getTimestamp(),
                              result: {
                                Msg: "POST Service Accept Success" 
                              }
                            }
                            res.send(response_json);
                            // log saved  
                            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                              if (err) console.log("Error inserting access_rest_log: %s", err);
                            });
                          }
                        });
                      }
                    });
                  }
                  //Email & Saved Log
                  var infomation = {
                    NameUser: result[0].NameE,
                    LastnameUser: result[0].LastNameE,
                    SAID: result[0].said,
                    startTime: result[0].startTime,
                    endTime: result[0].endTime,
                    IP1: result[0].IP1,
                    IP2: result[0].IP2  
                  };              
                  email_sender(6, user_detail[0].id, infomation);
                }
              });
            } else {
              result_text = "Error: Invalid password";
              var response_json = {
                events: "POST Service Accept Error",
                timestamp: getTimestamp(),
                result: {
                  errMsg: "Invalid password" 
                }
              }
              res.send(response_json);
              // log saved  
              var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
                if (err) console.log("Error inserting access_rest_log: %s", err);
              });
            }
          } else {
            result_text = "Error: Invalid username";
            var response_json = {
              events: "POST Service Accept Error",
              timestamp: getTimestamp(),
              result: {
                errMsg: "Invalid username" 
              }
            }
            res.send(response_json);
            // log saved  
            var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_detail[0].id, 21, result_text], function(err) {
              if (err) console.log("Error inserting access_rest_log: %s", err);
            });
          }
        }
      });
      connection.release();
    });
  }
};

// I'm fixing about only administrators privilege
// <<--- END REST API Dev --->>

// ADDITION EMAIL SENDER
function email_sender(email_id, user_id, infomation) { //RETURN callback-> 0 (NOT OK) or 1 (OK)
  var email_data;
  var html_text;
  pool.getConnection(function(err, connection) {
    var query = connection.query('SELECT Text FROM EmailTemplates WHERE id = ?', email_id, function(err, template) {
      if (err) console.log("Error selecting EmailTemplates: %s", err);    
      else {
        var query = connection.query('SELECT * FROM User WHERE id = ?', user_id, function(err, userdata) {
          if (err) console.log("Error selecting User: %s", err);
          else {
            if (email_id == 2) {
              var email_text = template[0].Text.split("*").map(function(val) {
                return (val);
              });
              email_data = email_text[0] + userdata[0].NameE + email_text[1] + userdata[0].username + email_text[2]; 
              html_text = '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + userdata[0].NameE + ' ' + userdata[0].LastNameE + ', <br><br>' + email_text[0] + userdata[0].NameE + email_text[1] + userdata[0].username + email_text[2] + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>';
            } else if (email_id == 6) {
              var email_text = template[0].Text.split("*").map(function(val) {
                return (val);
              });            
              email_data = email_text[0] + infomation.SAID + email_text[1] + infomation.IP1 + email_text[2] + infomation.IP2 + email_text[3] + infomation.startTime + email_text[4] + infomation.endTime + email_text[5];
              html_text = '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + infomation.NameUser + ' ' + infomation.LastnameUser + ', <br><br>' + email_text[0] + infomation.SAID + email_text[1] + infomation.IP1 + email_text[2] + infomation.IP2 + email_text[3] + infomation.startTime + email_text[4] + infomation.endTime + email_text[5] + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>';
            } else if (email_id == 8) {
              var email_text = template[0].Text.split("*").map(function(val) {
                return (val);
              }); 
              email_data = email_text[0] + infomation.SAID + email_text[1] + infomation.startTime + email_text[2] + infomation.endTime + email_text[3];
              html_text = '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + infomation.NameUser + ' ' + infomation.LastnameUser + ', <br><br>' + email_text[0] + infomation.SAID + email_text[1] + infomation.startTime + email_text[2] + infomation.endTime + email_text[3] + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>';
            } else {
              email_data = template[0].Text;
              html_text = '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + userdata[0].NameE + ' ' + userdata[0].LastNameE + ', <br><br>' + email_data + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>';
            }
            // send email notification
            transporter.sendMail({
              form: 'Uninet Express Lane Services Team',
              to: userdata[0].email,
              subject: 'Uninet Express Lane Service',
              html: html_text,
            });
            // save email log
            var logdata = {
              Sender: "Auto Sender",
              Reciver: userdata[0].username + "(" + userdata[0].email + ")",
              emailData: email_data
            };
            var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
              if (err) console.log("Error inserting EmailLogs: %s", err);              
            });
          }
        });
      }
    });
    connection.release();
  });
}

// ADDITION REPORT ERROR
function ReportError(res, err) {
  var errMsg = {
    errorMessage: err
  };
  console.log("Report Error ----->> "+errMsg.errorMessage);
  res.set('Content-Type', 'application/json');
  res.send(errMsg);
}

// ADDITION 2-digit for Timestamp
function addZero(i) {
    if (i < 10) i = "0" + i;
    return i;
}

// ADDITION get Timestamp
function getTimestamp(){
  //JavaScript counts months from 0 to 11. January is 0. December is 11.
  var d = new Date();
  var Y = d.getFullYear();
  var M = addZero(d.getMonth()+1);
  var D = addZero(d.getDate());
  var h = addZero(d.getHours());
  var m = addZero(d.getMinutes());
  var s = addZero(d.getSeconds());
  var timestamp = Y+"-"+M+"-"+D+" "+h+":"+m+":"+s;
  return timestamp;
}

// ADDITION DELETED FUNCTION RESPONSE
function deleted_response(res, user_id, deleted_status) {
  pool.getConnection(function(err, connection) {
    if (deleted_status) {
      var result_text = "Error: POST Service Delete";
      var response_json = {
        events: "POST Service Delete Complete",
        timestamp: getTimestamp(),
        result: {
          Msg: "POST Service Delete Success" 
        }
      }
      res.send(response_json);
      // log saved  
      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_id, 20, result_text], function(err) {
        if (err) console.log("Error inserting access_rest_log: %s", err);
      });
    } else {      
      var result_text = "Complete: POST Service Delete";
      var response_json = {
        events: "POST Service Delete Error",
        timestamp: getTimestamp(),
        result: {
          Msg: "POST Service Delete: Not availiable services maybe deleted" 
        }
      }
      res.send(response_json);
      // log saved  
      var query = connection.query('INSERT INTO access_rest_log(timestamp, userid, accessType, result) VALUES (?,?,?,?)', [getTimestamp(), user_id, 20, result_text], function(err) {
        if (err) console.log("Error inserting access_rest_log: %s", err);
      });
    }
    connection.release();
  });
} 

// export functions
/**************************************/
//check service
module.exports.check = check;
// index
module.exports.index = index;
// profile and repassword
module.exports.member = member;
module.exports.profile = profile;
module.exports.repass = repass;
module.exports.repasspost = repasspost;
//content
module.exports.status = status;
module.exports.service = service;
//member action
module.exports.serviceac = serviceac;
module.exports.addServiceac = addServiceac;
module.exports.ccServiceac = ccServiceac;
//admin action
module.exports.user = user;
module.exports.accept = accept;
module.exports.saveedit = saveedit;
module.exports.delete_user = delete_user;
module.exports.cancel_user = cancel_user;
module.exports.servicemanage = servicemanage;
// email management
module.exports.emailmanage = emailmanage;
module.exports.mailsave = mailsave;
//servicemanage
module.exports.accept_service = accept_service;
module.exports.saveedit_service = saveedit_service;
module.exports.delete_service = delete_service;
module.exports.delete_approve = delete_approve;
module.exports.delete_active = delete_active;
module.exports.addService = addService;
// sigin in
module.exports.signInPost = signInPost;
// sign up
module.exports.signUp = signUp;
module.exports.signUpPost = signUpPost;
// sign out
module.exports.signOut = signOut;
// document and other
module.exports.pdf = pdf;
module.exports.doc_page = doc_page;
module.exports.contact = contact;
/***************************************/
// REST APIs
/***************************************/
// Profile
module.exports.profile_rest = profile_rest;
module.exports.reset_password_rest = reset_password_rest;
module.exports.status_rest = status_rest;
module.exports.services_all_rest = services_all_rest;
module.exports.services_state_rest = services_state_rest;
module.exports.services_history_rest = services_history_rest;
// START ADMIN ONLY
  //services
module.exports.services_requested_rest = services_requested_rest;
module.exports.services_approved_rest = services_approved_rest;
module.exports.services_activated_rest = services_activated_rest;
  //user
module.exports.user_requested_rest = user_requested_rest;
module.exports.user_accept_rest = user_accept_rest;
module.exports.user_edit_rest = user_edit_rest;
module.exports.user_delete_rest = user_delete_rest;
module.exports.user_all_rest = user_all_rest;
module.exports.user_accesslogs_rest = user_accesslogs_rest;
// END ADMIN ONLY
// signup & restaccesslogs
module.exports.user_signup_rest = user_signup_rest;
module.exports.access_logs_rest = access_logs_rest;
// services_add_edit_delete
module.exports.add_service_rest = add_service_rest;
module.exports.edit_service_rest = edit_service_rest;
module.exports.delete_service_rest = delete_service_rest;
module.exports.accept_service_rest = accept_service_rest;