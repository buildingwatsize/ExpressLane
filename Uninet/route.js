// route.js
// Contract UniNet Express Lane Services team
// Akarasate Waiyaroj(a.waiyaroj@gmail.com)
//////////////////////////////////////////////////////////////////////////////////////////
// module list
var passport = require('passport');
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
var queryString = 'SELECT Text FROM EmailTemplates'; // query template SQL data
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
    //request timeout
    var query = connection.query("SELECT * FROM ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said INNER JOIN ServiceRequests ON ServiceRequests.sid = ServiceActivities.sid INNER JOIN User ON User.id = ServiceRequests.user WHERE actType = 0", function(err, servicetime) {
        for (i = 0; i < servicetime.length; i++) {
            console.log(servicetime[i].endTime + "//" + servicetime[i].username + "(" + servicetime[i].email + ")");
            cron.scheduleJob(servicetime[i].endTime, function() {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said, 3 FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said WHERE actType = 0 and endTime = NOW() and ServiceActivities.said NOT IN (SELECT said FROM ServiceLogs) and  ServiceActivities.actType NOT IN (SELECT actType FROM ServiceLogs)", function(err) {
                    var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said SET actType=3 WHERE actType = 0 and endTime = NOW()", function(err) {
                        if (err) {
                            console.log("Error Updating : %s ", err);
                        } else {
                            console.log(new Date(), "update");
                            /*
                            //Email section
                            console.log('Send email to '+ servicetime[i].username +"("+servicetime[i].email+")");
                            var emailtemp = connection.query('SELECT Text FROM Emailtext WHERE id = 7', function(err, result){ //Query data from database
                                if(!err) {
                                    //connection.release();
                                    var temp = result[0].Text;

                                    // send email notification
                                    transporter.sendMail({
                                        form: 'Uninet Express Lane Services Team',
                                        to: servicetime[i].email,
                                        subject: 'Uninet Express Lane',
                                        html:'<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear '+ servicetime[i].NameE+' '+ servicetime[i].LastNameE+', <br><br>'+temp+'<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                                    });

                                    var logdata = {
                                        Sender      : "Auto Sender",
                                        Reciver     : servicetime[i].username +"("+servicetime[i].email+")",
                                        emailData   : temp
                                    };

                                    //save logs to database
                                    var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows){
                                        if(err){
                                            console.log("Error when query logs : %s", err);
                                        } else {
                                            console.log("Log saved");
                                        }
                                    });
                                    console.log("Email was send ...");
                                } else {
                                    console.log("Error query database ...");
                            }
                        });*/
                        }
                    });
                });
            });
        }
    });
    //service active by start time
    var query = connection.query("SELECT * FROM ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said WHERE actType = 4", function(err, time) {
        for (i = 0; i < time.length; i++) {
            console.log(time[i].startTime);
            cron.scheduleJob(time[i].startTime, function() {
                var query = connection.query("INSERT INTO ActivePackage (said,username,resourceString1,resourceString2,IP1,IP2,startTime,endTime) SELECT ResourceAllocated.said,User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,ResourceAllocated.startTime,ResourceAllocated.endTime FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said INNER JOIN ServiceRequests ON ServiceRequests.sid = ServiceActivities.sid INNER JOIN User ON User.id = ServiceRequests.user WHERE actType = 4 and startTime = NOW() and ResourceAllocated.said NOT IN (SELECT said FROM ActivePackage)", function(err) {
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,7 FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said WHERE actType = 4 and startTime = NOW() and ServiceActivities.said NOT IN (SELECT said FROM ServiceLogs) and  ServiceActivities.actType NOT IN (SELECT actType FROM ServiceLogs)", function(err) {
                        var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said SET actType=7 WHERE actType = 4 and startTime = NOW()", function(err) {
                            if (err) console.log("Error Updating : %s ", err);
                            console.log(new Date(), "update");
                        });
                    });
                });
            });
        }
    });
    //service complete by endtime
    var query = connection.query("SELECT * FROM ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said WHERE actType = 7", function(err, activetime) {
        for (i = 0; i < activetime.length; i++) {
            console.log(activetime[i].endTime);
            cron.scheduleJob(activetime[i].endTime, function() {
                var query = connection.query("DELETE FROM ActivePackage WHERE endTime = NOW()", function(err) {
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,10 FROM ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said WHERE actType = 7 and endTime = NOW() and ServiceActivities.said NOT IN (SELECT said FROM ServiceLogs) and  ServiceActivities.actType NOT IN (SELECT actType FROM ServiceLogs)", function(err) {
                        var query = connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ResourceAllocated.said = ServiceActivities.said SET actType=10 WHERE actType = 7 and endTime = NOW()", function(err) {
                            if (err) console.log("Error Updating : %s ", err);
                            console.log(new Date(), "update");
                        });
                    });
                });
            });
        }
    });
};
// home index
var index = function(req, res, next) {
    if (!req.isAuthenticated()) {
        req.getConnection(function(err, connection) {
            var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, rows) {
                if (err) console.log(err);
                res.render('index', {
                    title: 'Home',
                    req: req,
                    status_user: rows
                });
            });
        });
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        req.getConnection(function(err, connection) {
            var query = connection.query("UPDATE User set flag=1 WHERE id = ? ", [user.id], function(rows) {});
            var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, rows) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(rows);
                }
                res.render('index', {
                    title: 'Home',
                    req: req,
                    user: user,
                    status_user: rows
                });
            });
        });
    }
    next();
};
//member signed in
var member = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
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
//view profile
var profile = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role === 1) {
            res.render('profileadmin', {
                title: 'profileadmin',
                user: user
            });
        } else {
            res.render('profile', {
                title: 'profile',
                user: user
            });
        }
    }
};
//reset password render
var repass = function(req, res, next) {
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
//reset password submit
var repasspost = function(req, res, next) {
    var input = JSON.parse(JSON.stringify(req.body));
    var id = req.params.id;
    req.getConnection(function(err, connection) {
        var username = input.username;
        var email = input.email;
        var hash = bcrypt.hashSync(input.password);
        var query = connection.query("SELECT * FROM User WHERE username = ? and email = ? ", [username, email], function(err, check) {
            if (JSON.stringify(check) === '[]') {
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
                    var user = req.user;
                    if (user !== undefined) {
                        user = user.toJSON();
                    }
                    if (err) {
                        console.log("Error Updating : %s ", err);
                    } else {
                        res.render('repassed', {
                            title: 'repassed',
                            req: req,
                            user: user
                        });
                        var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 4', function(err, template) { //Query data from database
                            if (!err) {
                                var temp = template[0].Text;
                                // send email notification
                                transporter.sendMail({
                                    form: 'Uninet Express Lane Services Team',
                                    to: check[0].email,
                                    subject: 'Uninet Express Lane',
                                    html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + check[0].NameE + ' ' + check[0].LastNameE + ', <br><br>' + temp + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                                });
                                var logdata = {
                                    Sender: "Auto Sender",
                                    Reciver: check[0].username + "(" + check[0].email + ")",
                                    emailData: temp
                                };
                                //save logs to database
                                var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                                    if (err) {
                                        console.log("Error when query logs : %s", err);
                                    } else {
                                        console.log("Log saved");
                                    }
                                });
                                console.log("Email was send ...");
                            } else {
                                console.log("Error query database ...");
                            }
                        });
                    }
                });
            }
        });
    });
};
//about page render
var about = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.render('about', {
            title: 'about',
            req: req
        });
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        res.render('about', {
            title: 'about',
            req: req,
            user: user
        });
    }
};
//status node admin
var statusPost = function(req, res, next) {
    var getdate = req.body.date_selection;
    var month_str = getdate.toString().substring(0, 2);
    var date_str = getdate.toString().substring(3, 5);
    var year_str = getdate.toString().substring(6, 10);
    var alldate = year_str + "-" + month_str + "-" + date_str + '%';
    //alldate = new Date(alldate);
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        var query = connection.query('SELECT *  FROM log_Online_status WHERE end_time LIKE ? Order By id ', [alldate], function(err, logs_connected) {
            if (err) {
                console.log("Error Selecting : %s ", err);
            }
            var query = connection.query('SELECT *  FROM ServiceLogs WHERE actType = ? and timestamp LIKE ? Order By slid', [7, alldate], function(err, logs_service) {
                if (err) {
                    console.log("Error Selecting : %s ", err);
                }
                res.render('graph', {
                    page_title: "graph",
                    req: req,
                    user: user,
                    logs_connected: logs_connected,
                    logs_service: logs_service
                });
            });
        });
    }
    /*
        //////////////////////////////////////// KMUTNB ///////////////////////////////////////
        var plotly = require('plotly')("expresslane01", "vz3zf3o1vp")
        var trace1 = {
            x: [],
            y: [],
            fill: "tozeroy",
            type: "scatter"
        };
        var timestamp = new Date(); 
        var post = alldate.toString().indexOf(timestamp.getFullYear());
        var sub_date = alldate.toString().substring(0,post+4);
        //console.log(sub_date);
        connection.query('SELECT * from log_Online_status WHERE host_name = "KMUTNB"', function(err, rows, fields) {
            var value = 1;
            for (var i=0;i<rows.length;i++){
                var date_tostr = rows[i].end_time.toString();
                var index = date_tostr.indexOf(" ");
                var sub_str = date_tostr.substring(0,index+12);
                //console.log(sub_str);
                if(sub_str == sub_date){
                    if(rows[i].statuss == 'Offline'){
                        value = 0;
                    }else{
                        value = 1;
                    }
                    var x = trace1.x;
                    var y = trace1.y;
                    x.push(rows[i].end_time);
                    y.push(value);
                }
            }
            console.log(trace1.x);
            console.log(trace1.y);
            var data = [trace1];
            var graphOptions = {filename: "basic-area", fileopt: "overwrite"};
            plotly.plot(data, graphOptions, function (err, msg) {});
        });
        setTimeout(function() {
        //////////////////////////////////////// CU ///////////////////////////////////////
            var plotly = require('plotly')("expresslane02", "zvcuo12xui")

            var trace2 = {
                x: [],
                y: [],
                fill: "tozeroy",
                type: "scatter"
            };
            var timestamp = new Date(); 
            var post = alldate.toString().indexOf(timestamp.getFullYear());
            var sub_date = alldate.toString().substring(0,post+4);
            //console.log(sub_date);
        
            connection.query('SELECT * from log_Online_status WHERE host_name = "CU"', function(err, rows, fields) {
                var value = 1;
                for (var i=0;i<rows.length;i++){
                    var date_tostr = rows[i].end_time.toString();
                    var index = date_tostr.indexOf(" ");
                    var sub_str = date_tostr.substring(0,index+12);
                    //console.log(sub_str);
                    if(sub_str == sub_date){
                        if(rows[i].statuss == 'Offline'){
                            value = 0;
                        }else{
                            value = 1;
                        }
                        var x = trace2.x;
                        var y = trace2.y;
                        x.push(rows[i].end_time);
                        y.push(value);
                    }
                }
                console.log(trace2.x);
                console.log(trace2.y);
                var data = [trace2];
                var graphOptions = {filename: "basic-area", fileopt: "overwrite"};
                plotly.plot(data, graphOptions, function (err, msg) {});
            });
        }, 1000);
        setTimeout(function() {
            var plotly = require('plotly')("expresslane03", "fcxc4bjob2")
            var trace3 = {
                x: [],
                y: [],
                fill: "tozeroy",
                type: "scatter"
            };
            var timestamp = new Date(); 
            var post = alldate.toString().indexOf(timestamp.getFullYear());
            var sub_date = alldate.toString().substring(0,post+4);
                    //console.log(sub_date);
            //////////////////////////////////////// MU ///////////////////////////////////////
            connection.query('SELECT * from log_Online_status WHERE host_name = "MU"', function(err, rows, fields) {
                var value = 1;
                for (var i=0;i<rows.length;i++){
                    var date_tostr = rows[i].end_time.toString();
                    var index = date_tostr.indexOf(" ");
                    var sub_str = date_tostr.substring(0,index+12);
                    //console.log(sub_str);
                    if(sub_str == sub_date){
                        if(rows[i].statuss == 'Offline'){
                            value = 0;
                        }else{
                            value = 1;
                        }
                        var x = trace3.x;
                        var y = trace3.y;
                        x.push(rows[i].end_time);
                        y.push(value);
                    }
                }   
                console.log(trace3.x);
                console.log(trace3.y);
                var data = [trace3];
                var graphOptions = {filename: "basic-area", fileopt: "overwrite"};
                plotly.plot(data, graphOptions, function (err, msg) {});
            });
        }, 1200);
        setTimeout(function() {
        //////////////////////////////////////// CU ///////////////////////////////////////
            var plotly = require('plotly')("expresslane04", "016hfc74tq")
            var trace4 = {
                x: [],
                y: [],
                fill: "tozeroy",
                type: "scatter"
            };
            var timestamp = new Date(); 
            var post = alldate.toString().indexOf(timestamp.getFullYear());
            var sub_date = alldate.toString().substring(0,post+4);
            //console.log(sub_date);
        
            connection.query('SELECT * from log_Online_status WHERE host_name = "UNINET"', function(err, rows, fields) {
                var value = 1;
                for (var i=0;i<rows.length;i++){
                    var date_tostr = rows[i].end_time.toString();
                    var index = date_tostr.indexOf(" ");
                    var sub_str = date_tostr.substring(0,index+12);
                //console.log(sub_str);
                    if(sub_str == sub_date){
                        if(rows[i].statuss == 'Offline'){
                            value = 0;
                        }else{
                            value = 1;
                        }
                        var x = trace4.x;
                        var y = trace4.y;
                        x.push(rows[i].end_time);
                        y.push(value);
                    }
                }
                console.log(trace4.x);
                console.log(trace4.y);
                var data = [trace4];
                var graphOptions = {filename: "basic-area", fileopt: "overwrite"};
                plotly.plot(data, graphOptions, function (err, msg) {});
            });
        }, 1400);

        setTimeout(function() {
        //////////////////////////////////////// KKU ///////////////////////////////////////
            var plotly = require('plotly')("expresslane05", "f92cfehh0a")
            var trace5 = {
                x: [],
                y: [],
                fill: "tozeroy",
                type: "scatter"
            };
            var timestamp = new Date(); 
            var post = alldate.toString().indexOf(timestamp.getFullYear());
            var sub_date = alldate.toString().substring(0,post+4);
            //console.log(sub_date);
        
            connection.query('SELECT * from log_Online_status WHERE host_name = "KKU"', function(err, rows, fields) {
                var value = 1;
                for (var i=0;i<rows.length;i++){
                    var date_tostr = rows[i].end_time.toString();
                    var index = date_tostr.indexOf(" ");
                    var sub_str = date_tostr.substring(0,index+12);
                //console.log(sub_str);
                    if(sub_str == sub_date){
                        if(rows[i].statuss == 'Offline'){
                            value = 0;
                        }else{
                            value = 1;
                        }
                        var x = trace5.x;
                        var y = trace5.y;
                        x.push(rows[i].end_time);
                        y.push(value);
                    }
                }
                console.log(trace5.x);
                console.log(trace5.y);
                var data = [trace5];
                var graphOptions = {filename: "basic-area", fileopt: "overwrite"};
                plotly.plot(data, graphOptions, function (err, msg) {});
            });
        }, 1600);
        setTimeout(function() {
        //////////////////////////////////////// RMUTSB ///////////////////////////////////////
            var plotly = require('plotly')("expresslane06", "h2kxqsa2vn")

            var trace6 = {
                x: [],
                y: [],
                fill: "tozeroy",
                type: "scatter"
            };
            var timestamp = new Date(); 
            var post = alldate.toString().indexOf(timestamp.getFullYear());
            var sub_date = alldate.toString().substring(0,post+4);
            //console.log(sub_date);
            
            connection.query('SELECT * from log_Online_status WHERE host_name = "RMUTSB"', function(err, rows, fields) {
                var value = 1;
                for (var i=0;i<rows.length;i++){
                    var date_tostr = rows[i].end_time.toString();
                    var index = date_tostr.indexOf(" ");
                    var sub_str = date_tostr.substring(0,index+12);
                //console.log(sub_str);
                    if(sub_str == sub_date){
                        if(rows[i].statuss == 'Offline'){
                            value = 0;
                        }else{
                            value = 1;
                        }   
                        var x = trace6.x;
                        var y = trace6.y;
                        x.push(rows[i].end_time);
                        y.push(value);
                    }
                }
                console.log(trace6.x);
                console.log(trace6.y);
                var data = [trace6];
                var graphOptions = {filename: "basic-area", fileopt: "overwrite"};
                plotly.plot(data, graphOptions, function (err, msg) {});
            });
        }, 1800);

        setTimeout(function() {
        //////////////////////////////////////// Serviceusage ///////////////////////////////////////
            var plotly = require('plotly')("expresslane07", "vz3zf3o1vp")

            var trace7 = {
                x: [],
                y: [],
                fill: "tozeroy",
                type: "scatter"
            };
            var timestamp = new Date(); 
            var post = alldate.toString().indexOf(timestamp.getFullYear());
            var sub_date = alldate.toString().substring(0,post+4);
            //console.log(sub_date);
            
            connection.query('SELECT * from ServiceLogs WHERE actType = 7', function(err, rows, fields) {
                console.log(rows);
                var value = 1;
                for (var i=0;i<rows.length;i++){
                    var date_tostr = rows[i].timestamp.toString();
                    var index = date_tostr.indexOf(" ");
                    var sub_str = date_tostr.substring(0,index+12);
                    //console.log(sub_str);
                    if(sub_str == sub_date){
                        var x = trace7.x;
                        var y = trace7.y;
                        x.push(rows[i].timestamp);
                        y.push(value);
                    }
                }
                console.log(trace7.x);
                console.log(trace7.y);
                var data = [trace7];
                var graphOptions = {filename: "basic-area", fileopt: "overwrite"};
                plotly.plot(data, graphOptions, function (err, msg) {});
            });
        }, 2000);
        */
};
//status node member
var status = function(req, res, next) {
    if (!req.isAuthenticated()) {
        req.getConnection(function(err, connection) {
            var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status Order By id ', function(err, rows) {
                if (err) console.log("Error Selecting : %s ", err);
                res.render('status', {
                    page_title: "status",
                    req: req,
                    status_user: rows
                });
            });
            //console.log(query.sql);
        });
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role === 1) {
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, status) {
                    if (err) console.log("Error Selecting : %s ", err);
                    var query = connection.query('SELECT * FROM Netfpga_Status', function(err, rows) {
                        if (err) console.log("Error Selecting : %s ", err);
                        var query = connection.query('SELECT *  FROM Nagios_Status', function(err, nagios) {
                            if (err) {
                                console.log("Error Selecting : %s ", err);
                            }
                            var query = connection.query('SELECT id , zone , DATE_FORMAT(timestamp , "%Y/%m/%d %H:%i:%S") AS timestamp , in_port1 , dl_dest1 , output1 , in_port2 , dl_dest2 , output2 , packet  FROM log_netfpga', function(err, logs_netfpga) {
                                if (err) {
                                    console.log("Error Selecting : %s ", err);
                                }
                                var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM log_Online_status', function(err, logs_node) {
                                    if (err) {
                                        console.log("Error Selecting : %s ", err);
                                    }
                                    var query = connection.query('SELECT id , zone , DATE_FORMAT(timestamp , "%Y/%m/%d %H:%i:%S") AS timestamp , service , statuss FROM log_nagios', function(err, logs_nagios) {
                                        if (err) {
                                            console.log("Error Selecting : %s ", err);
                                        }
                                        res.render('status', {
                                            page_title: "status",
                                            req: req,
                                            user: user,
                                            status: status,
                                            logs_nagios: logs_nagios,
                                            data: rows,
                                            nagios: nagios,
                                            logs_netfpga: logs_netfpga,
                                            logs_node: logs_node
                                        });
                                    });
                                });
                            });
                        });
                    });
                    //res.render('status',{page_title:"status",req:req,user:user,data:rows});
                });
                //console.log(query.sql);
            });
        } else {
            var user = req.user;
            if (user !== undefined) {
                user = user.toJSON();
            }
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT id , zone , statuss , DATE_FORMAT(start_time , "%Y/%m/%d %H:%i:%S") AS start_time , duration_time , src_mac , in_port , dest_mac , out_port , packet_count FROM Online_Status', function(err, rows) {
                    if (err) console.log("Error Selecting : %s ", err);
                    res.render('status', {
                        page_title: "status",
                        user: user,
                        req: req,
                        status_user: rows
                    });
                });
                //console.log(query.sql);
            });
        }
    }
};
//service page render
var service = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.render('service', {
            title: 'service',
            req: req
        });
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        res.render('service', {
            title: 'service',
            req: req,
            user: user
        });
    }
};
//document page render
var document = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.render('document', {
            title: 'document',
            req: req
        });
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        res.render('document', {
            title: 'document',
            req: req,
            user: user
        });
    }
};
//graph page render
var graph = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            var currentdate = new Date();
            var month = currentdate.getMonth() + 1;
            var date = currentdate.getDate();
            if (currentdate.getMonth().toString().length == 1) {
                month = '0' + (currentdate.getMonth() + 1);
            }
            if (currentdate.getDate().toString().length == 1) {
                date = '0' + currentdate.getDate();
            }
            var alldate = currentdate.getFullYear() + "-" + month + "-" + date + '%';
            var query = connection.query('SELECT *  FROM log_Online_status WHERE end_time LIKE ? Order By id', [alldate], function(err, logs_connected) {
                if (err) {
                    console.log("Error Selecting : %s ", err);
                }
                var query = connection.query('SELECT *  FROM ServiceLogs WHERE actType = ? and timestamp LIKE ? Order By slid', [7, alldate], function(err, logs_service) {
                    if (err) {
                        console.log("Error Selecting : %s ", err);
                    }
                    res.render('graph', {
                        page_title: "graph",
                        req: req,
                        user: user,
                        logs_connected: logs_connected,
                        logs_service: logs_service
                    });
                });
            });
            /*var layout_KMUTNB = {
                showlegend: true,
                title: 'Node Connected : BSU',
                yaxis: {
                    title: 'Connected',
                    autorange: true,
                    range: [0,100]
                },
                xaxis: {
                    title: 'Time',
                    autorange: true
                }
            };

            var layout_UNINET = {
                showlegend: true,
                title: 'Node Connected : PYT1',
                yaxis: {
                    title: 'Connected',
                    autorange: true,
                    range: [0,100]
                },
                xaxis: {
                    title: 'Time',
                    autorange: true
                }
            };
            var layout_MU = {
                showlegend: true,
                title: 'Node Connected : SLY',
                yaxis: {
                    title: 'Connected',
                    autorange: true,
                    range: [0,100]
                },
                xaxis: {
                    title: 'Time',
                    autorange: true
                }
            };
            var layout_KKU = {
                showlegend: true,
                title: 'Node Connected : KKN',
                yaxis: {
                    title: 'Connected',
                    autorange: true,
                    range: [0,100]
                },
                xaxis: {
                    title: 'Time',
                    autorange: true
                }
            };var layout_CU = {
                showlegend: true,
                title: 'Node Connected : PYT2',
                yaxis: {
                    title: 'Connected',
                    autorange: true,
                    range: [0,100]
                },
                xaxis: {
                    title: 'Time',
                    autorange: true
                }
            };var layout_RMUTSB = {
                showlegend: true,
                title: 'Node Connected : RMUTSB',
                yaxis: {
                    title: 'Connected',
                    autorange: true,
                    range: [0,1]
                },
                xaxis: {
                    title: 'Time',
                    autorange: true
                }
            };
            var layout_Service = {
                showlegend: true,
                title: 'Service Usage',
                yaxis: {
                    title: 'Count of service',
                    autorange: true,
                    range: [0,100]
                },
                xaxis: {
                    title: 'Time',
                    autorange: true
                }
            };
    
    ////////////////////////////////////////////// KMUTNB ///////////////////////////////////
            var plotly = require('plotly')("expresslane01", "vz3zf3o1vp")
            var trace1 = {
                x: [],
                y: [],
                fill: "tozeroy",
                type: "scatter"
            };
            var timestamp = new Date(); 
            var post = timestamp.toString().indexOf(timestamp.getFullYear());
            var sub_date = timestamp.toString().substring(0,post+4);
            //console.log(sub_date);
            connection.query('SELECT * from log_Online_status WHERE host_name = "KMUTNB" Order By id ASC', function(err, rows, fields) {
                var value = 1;
                for (var i=0;i<rows.length;i++){
                    var date_tostr = rows[i].end_time.toString();
                    var index = date_tostr.indexOf(" ");
                    var sub_str = date_tostr.substring(0,index+12);
                    //console.log(sub_str);
                    if(sub_str == sub_date){
                        if(rows[i].statuss == 'Offline'){
                            value = 0;
                        }else{
                            value = 1;
                        }
                        var x = trace1.x;
                        var y = trace1.y;
                        x.push(rows[i].end_time);
                        y.push(value);
                    }
                }
                console.log(trace1.x);
                console.log(trace1.y);
                var data = [trace1];
                var graphOptions = {layout:layout_KMUTNB,filename: "basic-area", fileopt: "overwrite"};
                plotly.plot(data, graphOptions, function (err, msg) {
                    console.log(msg)
                });
            });
            ////////////////////////////////////////////// CU ///////////////////////////////////
            setTimeout(function() {
                var plotly = require('plotly')("expresslane02", "zvcuo12xui")
                var trace2 = {
                    x: [],
                    y: [],
                    fill: "tozeroy",
                    type: "scatter"
                };
                var timestamp = new Date(); 
                var post = timestamp.toString().indexOf(timestamp.getFullYear());
                var sub_date = timestamp.toString().substring(0,post+4);
                //console.log(sub_date);
                connection.query('SELECT * from log_Online_status WHERE host_name = "CU" Order By id ASC', function(err, rows, fields) {
                    var value = 1;
                    for (var i=0;i<rows.length;i++){
                        var date_tostr = rows[i].end_time.toString();
                        var index = date_tostr.indexOf(" ");
                        var sub_str = date_tostr.substring(0,index+12);
                        //console.log(sub_str);
                        if(sub_str == sub_date){
                            if(rows[i].statuss == 'Offline'){
                                value = 0;
                            }else{
                                value = 1;
                            }
                            var x = trace2.x;
                            var y = trace2.y;
                            x.push(rows[i].end_time);
                            y.push(value);
                        }
                    }
                    console.log(trace2.x);
                    console.log(trace2.y);
                    var data = [trace2];
                    var graphOptions = {layout:layout_CU,filename: "basic-area", fileopt: "overwrite"};
                    plotly.plot(data, graphOptions, function (err, msg) {
                        console.log(msg)
                    });
                });
            }, 100);
            ////////////////////////////////////////////// MU ///////////////////////////////////
            setTimeout(function() {
                var plotly = require('plotly')("expresslane03", "fcxc4bjob2")
                var trace3 = {
                    x: [],
                    y: [],
                    fill: "tozeroy",
                    type: "scatter"
                };
                var timestamp = new Date(); 
                var post = timestamp.toString().indexOf(timestamp.getFullYear());
                var sub_date = timestamp.toString().substring(0,post+4);
                //console.log(sub_date);
                connection.query('SELECT * from log_Online_status WHERE host_name = "MU" Order By id ASC', function(err, rows, fields) {
                    var value = 1;
                    for (var i=0;i<rows.length;i++){
                        var date_tostr = rows[i].end_time.toString();
                        var index = date_tostr.indexOf(" ");
                        var sub_str = date_tostr.substring(0,index+12);
                        //console.log(sub_str);
                        if(sub_str == sub_date){
                            if(rows[i].statuss == 'Offline'){
                                value = 0;
                            }else{
                                value = 1;
                            }
                            var x = trace3.x;
                            var y = trace3.y;
                            x.push(rows[i].end_time);
                            y.push(value);
                        }
                    }
                    console.log(trace3.x);
                    console.log(trace3.y);
                    var data = [trace3];
                    var graphOptions = {layout:layout_MU,filename: "basic-area", fileopt: "overwrite"};
                    plotly.plot(data, graphOptions, function (err, msg) {
                        console.log(msg)
                    });
                });
            }, 200);
            ////////////////////////////////////////////// UNINET ///////////////////////////////////
            setTimeout(function() {
                var plotly = require('plotly')("expresslane04", "016hfc74tq")
                var trace4 = {
                    x: [],
                    y: [],
                    fill: "tozeroy",
                    type: "scatter"
                };
                var timestamp = new Date(); 
                var post = timestamp.toString().indexOf(timestamp.getFullYear());
                var sub_date = timestamp.toString().substring(0,post+4);
                //console.log(sub_date);
                connection.query('SELECT * from log_Online_status WHERE host_name = "UNINET" Order By id ASC', function(err, rows, fields) {
                    var value = 1;
                    for (var i=0;i<rows.length;i++){
                        var date_tostr = rows[i].end_time.toString();
                        var index = date_tostr.indexOf(" ");
                        var sub_str = date_tostr.substring(0,index+12);
                        //console.log(sub_str);
                        if(sub_str == sub_date){
                            if(rows[i].statuss == 'Offline'){
                                value = 0;
                            }else{
                                value = 1;
                            }
                            var x = trace4.x;
                            var y = trace4.y;
                            x.push(rows[i].end_time);
                            y.push(value);
                        }
                    }
                    console.log(trace4.x);
                    console.log(trace4.y);
                    var data = [trace4];
                    var graphOptions = {layout:layout_UNINET,filename: "basic-area", fileopt: "overwrite"};
                    plotly.plot(data, graphOptions, function (err, msg) {
                        console.log(msg)
                    });
                });
            }, 300);
            ////////////////////////////////////////////// KKU ///////////////////////////////////
            setTimeout(function() {
                var plotly = require('plotly')("expresslane05", "f92cfehh0a")
                var trace5 = {
                    x: [],
                    y: [],
                    fill: "tozeroy",
                    type: "scatter"
                };
                var timestamp = new Date(); 
                var post = timestamp.toString().indexOf(timestamp.getFullYear());
                var sub_date = timestamp.toString().substring(0,post+4);
                //console.log(sub_date);
                connection.query('SELECT * from log_Online_status WHERE host_name = "KKU" Order By id ASC', function(err, rows, fields) {
                    var value = 1;
                    for (var i=0;i<rows.length;i++){
                        var date_tostr = rows[i].end_time.toString();
                        var index = date_tostr.indexOf(" ");
                        var sub_str = date_tostr.substring(0,index+12);
                        //console.log(sub_str);
                        if(sub_str == sub_date){
                            if(rows[i].statuss == 'Offline'){
                                value = 0;
                            }else{
                                value = 1;
                            }
                            var x = trace5.x;
                            var y = trace5.y;
                            x.push(rows[i].end_time);
                            y.push(value);
                        }
                    }
                    console.log(trace5.x);
                    console.log(trace5.y);
                    var data = [trace5];
                    var graphOptions = {layout:layout_KKU,filename: "basic-area", fileopt: "overwrite"};
                    plotly.plot(data, graphOptions, function (err, msg) {
                        console.log(msg)
                    });
                });
            }, 400);
            ////////////////////////////////////////////// RMUTSB ///////////////////////////////////
            setTimeout(function() {
                var plotly = require('plotly')("expresslane06", "h2kxqsa2vn")
                var trace6 = {
                    x: [],
                    y: [],
                    fill: "tozeroy",
                    type: "scatter"
                };
                var timestamp = new Date(); 
                var post = timestamp.toString().indexOf(timestamp.getFullYear());
                var sub_date = timestamp.toString().substring(0,post+4);
                //console.log(sub_date);
                connection.query('SELECT * from log_Online_status WHERE host_name = "RMUTSB" Order By id ASC', function(err, rows, fields) {
                    var value = 1;
                    for (var i=0;i<rows.length;i++){
                        var date_tostr = rows[i].end_time.toString();
                        var index = date_tostr.indexOf(" ");
                        var sub_str = date_tostr.substring(0,index+12);
                        //console.log(sub_str);
                        if(sub_str == sub_date){
                            if(rows[i].statuss == 'Offline'){
                                value = 0;
                            }else{
                                value = 1;
                            }
                            var x = trace6.x;
                            var y = trace6.y;
                            x.push(rows[i].end_time);
                            y.push(value);
                        }
                    }
                    console.log(trace6.x);
                    console.log(trace6.y);
                    var data = [trace6];
                    var graphOptions = {layout:layout_RMUTSB,filename: "basic-area", fileopt: "overwrite"};
                    plotly.plot(data, graphOptions, function (err, msg) {
                        console.log(msg)
                    });
                });
            }, 500);
            ////////////////////////////////////////////// Service Usage ///////////////////////////////////
            setTimeout(function() {
                var plotly = require('plotly')("expresslane07", "vz3zf3o1vp")
                var trace7 = {
                    x: [],
                    y: [],
                    fill: "tozeroy",
                    type: "scatter"
                };
                var timestamp = new Date(); 
                var post = timestamp.toString().indexOf(timestamp.getFullYear());
                var sub_date = timestamp.toString().substring(0,post+4);
                //console.log(sub_date);
                connection.query('SELECT * from ServiceLogs WHERE actType = 7 Order By slid ASC', function(err, rows, fields) {
                    console.log(rows);
                    for (var i=0;i<rows.length;i++){
                        var date_tostr = rows[i].timestamp.toString();
                        var index = date_tostr.indexOf(" ");
                        var sub_str = date_tostr.substring(0,index+12);
                        var value = 1;
                        console.log(sub_str);
                        if(sub_str == sub_date){
                            var x = trace7.x;
                            var y = trace7.y;
                            x.push(rows[i].timestamp);
                            y.push(value);
                        }
                    }
                    console.log(trace7.x);
                    console.log(trace7.y);
                    var data = [trace7];
                    var graphOptions = {layout:layout_Service,filename: "basic-area", fileopt: "overwrite"};
                    plotly.plot(data, graphOptions, function (err, msg) {
                        console.log(msg)
                    });
                });
            }, 600);
        */
        }
    }
};
//contact us page render
var contact = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.render('contact', {
            title: 'contact',
            req: req
        });
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        res.render('contact', {
            title: 'contact',
            req: req,
            user: user
        });
    }
};
//serviceactivities page for member
var serviceac = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role === 1) {
            res.redirect('/');
        } else {
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT ResourceAllocated.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType WHERE user = ? and actbyuser != 1 and (ServiceActivities.actType = 0 or ServiceActivities.actType = 4 or ServiceActivities.actType = 7)', [user.id], function(err, data) {
                    var query = connection.query('SELECT ResourceAllocated.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType WHERE user = ? ', [user.id], function(err, state) {
                        var query = connection.query('SELECT ServiceLogs.said,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime , DATE_FORMAT(ServiceLogs.timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp , ServiceActivityType.actType , ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN ServiceActivityType ON ServiceActivities.actType=ServiceActivityType.actType JOIN ServiceLogs ON ServiceActivities.said = ServiceLogs.said WHERE user = ? ', [user.id], function(err, history) {
                            res.render('serviceac', {
                                page_title: "serviceac",
                                user: user,
                                data: data,
                                history: history,
                                state: state
                            });
                        });
                    });
                });
            });
        }
    }
    next();
};
//cancel service on serviceactivities page
var ccServiceac = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        var id = req.params.id;
        req.getConnection(function(err, connection) {
            var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 1 WHERE actType = 0 and said = ? ", [id], function(err, rows) {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,1 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                    if (err) console.log("Error accept : %s ", err);
                });
            });
            var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 5 WHERE actType = 4 and said = ? ", [id], function(err, rows) {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,5 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                    if (err) console.log("Error accept : %s ", err);
                });
            });
            var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 8 WHERE actType = 7 and said = ? ", [id], function(err, rows) {
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,8 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                    var query = connection.query("DELETE FROM ActivePackage WHERE said = ?", [id], function(err) {
                        if (err) console.log("Error accept : %s ", err);
                    });
                });
            });
            res.redirect('/serviceac');
        });
    }
};
//request service for member
var addServiceac = function(req, res, next) {
    var input = JSON.parse(JSON.stringify(req.body));
    var user = req.user;

    req.getConnection(function(err, connection) {
        //var user_email = user.email;
        //var user_username = user.username;
        var query = connection.query("INSERT INTO ServiceRequests set user = ? ", [user.id], function(err, rows) {
            if (err) console.log("Error inserting : %s ", err);
            var query = connection.query("INSERT INTO ServiceActivities (sid) SELECT sid From ServiceRequests WHERE user = ? Order By ServiceRequests.sid Desc LIMIT 1", [user.id], function(err, a) {
                //console.log(a);
                if (err) console.log("Error inserting : %s ", err);
                var query = connection.query("SELECT said From ServiceActivities Order By said Desc LIMIT 1", function(err, ss) {
                    if (err) console.log("Error inserting : %s ", err);
                    var str = JSON.stringify(ss);
                    ss1 = JSON.parse(str);
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
                        said: ss1[0].said,
                    };
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,0 FROM ServiceActivities WHERE said = ?", ss1[0].said, function(err) {
                        var query = connection.query("INSERT INTO ResourceAllocated set ? ", data, function(err, rows) {
                            if (!err) {
                                res.redirect('/serviceac');
                                var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 5', function(err, template) {
                                    if (!err) {
                                        var temp = template[0].Text;
                                        var userdata = connection.query('SELECT * FROM User WHERE id = ?', [user.id], function(err, userdata) {
                                            if (!err) {
                                                // send email notification
                                                transporter.sendMail({
                                                    form: 'Uninet Express Lane Services Team',
                                                    to: userdata[0].email,
                                                    subject: 'Uninet Express Lane',
                                                    html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + userdata[0].NameE + ' ' + userdata[0].LastNameE + ', <br><br>' + temp + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                                                });
                                                // save email log
                                                var logdata = {
                                                    //logDate   : now(),
                                                    Sender: "Auto Sender",
                                                    Reciver: userdata[0].username + "(" + userdata[0].email + ")",
                                                    emailData: temp
                                                };
                                                var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                                                    if (err) {
                                                        console.log("Error when query logs : %s", err);
                                                    } else {
                                                        console.log("Log saved");
                                                    }
                                                });
                                            } else {
                                                console.log("Error when query logs : %s", err);
                                            }
                                        });
                                    } else {
                                        console.log("Error when query logs : %s", err);
                                    }
                                });
                            } else {
                                console.log("Error inserting : %s ", err);
                            }
                        });
                    });
                });
            });
        });
    });
};

//user management
var user = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT * FROM User WHERE role IS NOT NULL', function(err, rows1) {
                    var query = connection.query('SELECT User.id,User.username , User.NameE , User.LastNameE ,  User.email , org.nameE AS org , User.phone , User.message FROM User JOIN org ON User.org = org.org WHERE role IS NULL', function(err, rows2) {
                        var query = connection.query('SELECT user, actionType.nameE , DATE_FORMAT(timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp FROM accessLogs INNER JOIN actionType ON accessLogs.action = actionType.action', function(err, userhistory) {
                            if (err) console.log("Error Selecting : %s ", err);
                            res.render('user', {
                                page_title: "user",
                                user: user,
                                data: rows1,
                                data1: rows2,
                                userhistory: userhistory
                            });
                        });
                    });
                });
            });
        }
    }
};
//accept user
var accept = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            var id = req.params.id;
            // query User data
            var Nametemp, Lastnametemp, Userid, Userpassword, Emailtemp = "";
            var datatemp = connection.query("SELECT * FROM User WHERE id = ? ", [id], function(err, rows) {
                if (err) {
                    console.log("Error reciving data : %s ", err);
                } else {
                    datatemp = rows[0];
                    Nametemp = rows[0].NameE;
                    Lastnametemp = rows[0].LastNameE;
                    Userid = rows[0].username;
                    Userpassword = rows[0].password;
                    Emailtemp = rows[0].email;
                    console.log("data recived : %s ", err);
                }
            });
            //
            req.getConnection(function(err, connection) {
                connection.query("UPDATE User SET role = 2 WHERE id = ? ", [id], function(err, rows) {
                    if (err) console.log("Error accept : %s ", err);
                    res.redirect('/user');
                });
                var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 2', function(err, template) { //Query data from database
                    if (!err) {
                        var temp = template[0].Text.split("*").map(function(val) {
                            return (val);
                        });
                        // send email notification
                        transporter.sendMail({
                            form: 'Uninet Express Lane Services Team',
                            to: Emailtemp,
                            subject: 'Uninet Express Lane',
                            html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + Nametemp + ' ' + Lastnametemp + ', <br><br>' + temp[0] + Nametemp + temp[1] + Userid + temp[2] + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                        });
                        var logdata = {
                            //logDate   : now(),
                            Sender: user.username,
                            Reciver: Userid + "(" + Emailtemp + ")",
                            emailData: temp[0] + Nametemp + temp[1] + Userid + temp[2]
                        };
                        //save logs to database
                        var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                            if (err) {
                                console.log("Error when query logs : %s", err);
                            } else {
                                console.log("Log saved");
                            }
                        });
                        //console.log(arr);
                        console.log("Email was send ...");
                    } else {
                        console.log("Error query database ...");
                        //connection.release();
                    }
                });
            });
        }
    }
};
//submit edit user
var saveedit = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
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
                    role: input.role,
                    flag: input.flag
                };
                var query = connection.query("UPDATE User set ? WHERE id = ? ", [data, id], function(err, rows) {
                    if (err) console.log("Error Updating : %s ", err);
                    res.redirect('/user');
                });
            });
        }
    }
};
//edit user
var edit = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            var id = req.params.id;
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT * FROM User WHERE id = ?', [id], function(err, rows) {
                    if (err) console.log("Error Selecting : %s ", err);
                    res.render('edit', {
                        page_title: "Edit",
                        user: user,
                        data: rows
                    });
                });
            });
        }
    }
};
//delete user
var delete_user = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            //exports.list = function(req, res){
            var id = req.params.id;
            // query User data
            var mailchecker = 0;
            var Nametemp, Lastnametemp, Userid, Userpassword, Emailtemp = "";
            var datatemp = connection.query("SELECT * FROM User WHERE id = ? ", [id], function(err, rows) {
                if (err) {
                    console.log("Error reciving data : %s ", err);
                } else {
                    Nametemp = rows[0].NameE;
                    Lastnametemp = rows[0].LastNameE;
                    Userid = rows[0].username;
                    Userpassword = rows[0].password;
                    Emailtemp = rows[0].email;
                    console.log("data recived : %s ", err);
                    // delete user
                    req.getConnection(function(err, connection) {
                        connection.query("DELETE FROM User  WHERE id = ? ", [id], function(err, rows) {
                            if (err) {
                                console.log("Error deleting : %s ", err);
                                console.log("Error query database ...");
                            }
                            res.redirect('/user');
                        });
                    });
                }
            });
        }
    }
};
//cancel user request
var cancel_user = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            //exports.list = function(req, res){
            var id = req.params.id;
            // query User data
            var mailchecker = 0;
            var Nametemp, Lastnametemp, Userid, Userpassword, Emailtemp = "";
            var datatemp = connection.query("SELECT * FROM User WHERE id = ? ", [id], function(err, rows) {
                if (err) {
                    console.log("Error reciving data : %s ", err);
                } else {
                    Nametemp = rows[0].NameE;
                    Lastnametemp = rows[0].LastNameE;
                    Userid = rows[0].username;
                    Userpassword = rows[0].password;
                    Emailtemp = rows[0].email;
                    console.log("data recived : %s ", err);
                    //Send Email
                    var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 3', function(err, template) { //Query data from database
                        if (!err) {
                            mailchecker = 1;
                            var temp = template[0].Text
                                // send email notification
                            transporter.sendMail({
                                form: 'Uninet Express Lane Services Team',
                                to: Emailtemp,
                                subject: 'Uninet Express Lane',
                                html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + Nametemp + ' ' + Lastnametemp + ', <br><br>' + temp + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                            });
                            //log data
                            var logdata = {
                                //logDate   : now(),
                                Sender: user.username,
                                Reciver: Userid + "(" + Emailtemp + ")",
                                emailData: temp
                            };
                            //save logs to database
                            var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                                if (err) {
                                    console.log("Error when query logs : %s", err);
                                } else {
                                    console.log("Log saved");
                                }
                            });
                            // delete user
                            if (mailchecker == 1) {
                                req.getConnection(function(err, connection) {
                                    connection.query("DELETE FROM User  WHERE id = ? ", [id], function(err, rows) {
                                        if (err) console.log("Error deleting : %s ", err);
                                        res.redirect('/user');
                                    });
                                    //console.log(query.sql);
                                });
                            }
                            //console.log(arr);
                            console.log("Email was send ...");
                        } else {
                            console.log("Error query database ...");
                            //connection.release();
                        }
                    });
                }
            });
        }
    }
};
// mail management -- query data  (template & logs)
var emailmanage = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT * FROM EmailTemplates', function(err, template) {
                    if (!err) {
                        var query = connection.query("SELECT Sender, Reciver, emailData, DATE_FORMAT(logDate, '%Y/%m/%d %H:%i:%s') AS logDate FROM EmailLogs ", function(err, logs) { //ORDER BY logDate DESC
                            if (!err) {
                                res.render('emailmanage', {
                                    page_title: "Email Management",
                                    user: user,
                                    data: template,
                                    logs: logs
                                });
                            } else {
                                console.log("Error Selecting : %s ", err);
                            }
                        });
                    } else {
                        console.log("Error Selecting : %s ", err);
                    }
                });
            });
        }
    }
};
//mail edit
var mailedit = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/emailmanage');
        } else {
            var id = req.params.id;
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT * FROM EmailTemplates WHERE id = ?', [id], function(err, template) {
                    if (err) console.log("Error Selecting : %s ", err);
                    res.render('mailedit', {
                        page_title: "Edit Email template",
                        user: user,
                        data: template
                    });
                });
            });
        }
    }
};
// save email template
var mailsave = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/emailmanage');
        } else {
            var input = JSON.parse(JSON.stringify(req.body));
            var id = req.params.id;
            req.getConnection(function(err, connection) {
                var data = {
                    id: input.id,
                    Text: input.Text
                };
                var query = connection.query("UPDATE EmailTemplates set ? WHERE id = ?  ", [data, id], function(err, template) {
                    if (err) {
                        console.log("Error Updating : %s ", err)
                    };
                    // update email template
                    emaildata = connection.query(queryString, function(err, result) { //Query data from database
                        if (!err) {
                            //connection.release();
                            console.log("Email template was Updated ...");
                        } else {
                            console.log("Error query database ...");
                            //connection.release();
                        }
                    });
                    res.redirect('/emailmanage');
                });
            });
        }
    }
};
//service management
var servicemanage = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            /*req.getConnection(function(err,connection){
                var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user JOIN ServiceActivityType ON ServiceActivities.actType = ServiceActivityType.actType',function(err,state){
                    var query = connection.query('SELECT User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,ResourceAllocated.startTime,ResourceAllocated.endTime,DATE_FORMAT(ServiceLogs.timestamp, "%Y/%c/%e @%h:%i:%p") AS timestamp,ServiceActivityType.nameE  FROM ServiceLogs LEFT JOIN ServiceActivities ON ServiceLogs.said=ServiceActivities.said JOIN ResourceAllocated ON ResourceAllocated.said = ServiceLogs.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user JOIN ServiceActivityType ON ServiceLogs.actType = ServiceActivityType.actType',function(err,history){
                        var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actType = 4',function(err,approve){  
                            var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actbyuser != 1 and actType =0 ',function(err,request){
                                var query = connection.query('SELECT * FROM ActivePackage',function(err,active){
                                    if(err)
                                        console.log("Error Selecting : %s ",err );
                                    res.render('servicemanage',{page_title:"servicemanage",active:active,request:request,user: user,history:history,state:state,approve:approve});
                                });
                            });
                        });
                    });
                });
                //console.log(query.sql);
            });
            //exports.list = function(req, res){
            */
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime,ServiceActivityType.nameE FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user JOIN ServiceActivityType ON ServiceActivities.actType = ServiceActivityType.actType', function(err, state) {
                    var query = connection.query('SELECT User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime,DATE_FORMAT(ServiceLogs.timestamp, "%Y/%m/%d %H:%i:%S") AS timestamp,ServiceActivityType.nameE  FROM ServiceLogs LEFT JOIN ServiceActivities ON ServiceLogs.said=ServiceActivities.said JOIN ResourceAllocated ON ResourceAllocated.said = ServiceLogs.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user JOIN ServiceActivityType ON ServiceLogs.actType = ServiceActivityType.actType', function(err, history) {
                        var query = connection.query('SELECT ResourceAllocated.said, User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actType = 4', function(err, approve) {
                            var query = connection.query('SELECT ResourceAllocated.said, User.username,ResourceAllocated.resourceString1,ResourceAllocated.resourceString2,ResourceAllocated.IP1,ResourceAllocated.IP2,DATE_FORMAT(ResourceAllocated.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ResourceAllocated.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE actbyuser != 1 and actType =0 ', function(err, request) {
                                var query = connection.query('SELECT ActivePackage.apid,ActivePackage.username,ActivePackage.resourceString1,ActivePackage.resourceString2,ActivePackage.IP1,ActivePackage.IP2,DATE_FORMAT(ActivePackage.startTime, "%Y/%m/%d %H:%i:%S") AS startTime,DATE_FORMAT(ActivePackage.endTime, "%Y/%m/%d %H:%i:%S") AS endTime FROM ActivePackage', function(err, active) {
                                    if (err) console.log("Error Selecting : %s ", err);
                                    res.render('servicemanage', {
                                        page_title: "servicemanage",
                                        active: active,
                                        request: request,
                                        user: user,
                                        history: history,
                                        state: state,
                                        approve: approve
                                    });
                                });
                            });
                        });
                    });
                });
                //console.log(query.sql);
            });
        }
    }
    next();
};
//add service active for admin
var addService = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            var input = JSON.parse(JSON.stringify(req.body));
            req.getConnection(function(err, connection) {
                var data = {
                    username: user.username,
                    resourceString1: input.resourceString1,
                    resourceString2: input.resourceString2,
                    IP1: input.IP1,
                    IP2: input.IP2,
                    startTime: input.startTime,
                    endTime: input.endTime,
                };
                var query = connection.query("INSERT INTO ActivePackage set ? ", [data], function(err, rows) {
                    if (err) console.log("Error inserting : %s ", err);
                    res.redirect('/servicemanage');
                });
            });
        }
    }
};
//approve service request
var accept_service = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            // add ip from addmin
            var input = JSON.parse(JSON.stringify(req.body));
            var id = req.params.id;
            req.getConnection(function(err, connection) {
                var Nametemp, Lastnametemp, Emailtemp, SAID, startTime, endTime = '';
                var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE ResourceAllocated.said = ?', [id], function(err, rows) {
                    Userid = rows[0].username;
                    Nametemp = rows[0].NameE;
                    Lastnametemp = rows[0].LastNameE;
                    Emailtemp = rows[0].email;
                    SAID = rows[0].said;
                    startTime = rows[0].startTime;
                    endTime = rows[0].endTime;
                    IP1 = rows[0].IP1;
                    IP2 = rows[0].IP2;
                    var data = {
                        said: rows[0].said,
                        username: rows[0].username,
                        resourceString1: rows[0].resourceString1,
                        resourceString2: rows[0].resourceString2,
                        IP1: rows[0].IP1,
                        IP2: rows[0].IP2,
                        startTime: rows[0].startTime,
                        endTime: rows[0].endTime
                    };
                    connection.query("UPDATE ResourceAllocated SET IP1 = ?, IP2 = ? WHERE said = ? ", [IP1, IP2, SAID], function(err) {
                        if (err) console.log("Error accept : %s ", err);
                    });
                    //Service Actived
                    if (rows[0].startTime <= new Date()) {
                        var query = connection.query("INSERT INTO ActivePackage SET ?", data, function(err, rows) {
                            var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,7 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                                connection.query("UPDATE ServiceActivities SET actType = 7 WHERE said = ? ", [id], function(err, rows) {
                                    if (err) console.log("Error accept : %s ", err);
                                    res.redirect('/servicemanage');
                                });
                            });
                        });
                        //Service Approved
                    } else {
                        var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,4 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                            connection.query("UPDATE ServiceActivities SET actType = 4 WHERE said = ? ", [id], function(err, rows) {
                                if (err) console.log("Error accept : %s ", err);
                                res.redirect('/servicemanage');
                            });
                            //send email function
                            var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 6', function(err, template) { //Query data from database
                                if (!err) {
                                    var temp = template[0].Text.split("*").map(function(val) {
                                        return (val);
                                    });
                                    // send email notification
                                    transporter.sendMail({
                                        form: 'Uninet Express Lane Services Team',
                                        to: Emailtemp,
                                        subject: 'Uninet Express Lane',
                                        html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + Nametemp + ' ' + Lastnametemp + ', <br><br>' + temp[0] + SAID + temp[1] + IP1 + temp[2] + IP2 + temp[3] + startTime + temp[4] + endTime + temp[5] + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                                    });
                                    //log data
                                    var logdata = {
                                        //logDate   : now(),
                                        Sender: user.username,
                                        Reciver: Userid + "(" + Emailtemp + ")",
                                        emailData: temp[0] + SAID + temp[1] + IP1 + temp[2] + IP2 + temp[3] + startTime + temp[4] + endTime + temp[5]
                                            //emailData     : temp[0]+SAID+temp[1]+IP+temp[2]+ startTime+temp[3]+ endTime+temp[4]
                                    };
                                    //save logs to database
                                    var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                                        if (err) {
                                            console.log("Error when query logs : %s", err);
                                        } else {
                                            console.log("Log saved");
                                        }
                                    });
                                    //console.log(arr);
                                    console.log("Email was send ...");
                                } else {
                                    console.log("Error query database ...");
                                    //connection.release();
                                }
                            });
                        });
                    }
                });
            });
        }
    }
};
//edit service active for admin
var edit_service = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            var id = req.params.apid;
            req.getConnection(function(err, connection) {
                var query = connection.query('SELECT * FROM ActivePackage WHERE apid = ?', [id], function(err, rows) {
                    if (err) console.log("Error Selecting : %s ", err);
                    res.render('edit', {
                        page_title: "Edit",
                        user: user,
                        data: rows
                    });
                });
            });
        }
    }
};
//submit edit service for admin
var saveedit_service = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/memberindex');
        } else {
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
                    if (err) console.log("Error Updating : %s ", err);
                    res.redirect('/servicemanage');
                });
            });
        }
    }
};
//cancel service requested
var delete_service = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            //exports.list = function(req, res){
            var id = req.params.id;
            req.getConnection(function(err, connection) {
                var Nametemp, Lastnametemp, Emailtemp, SAID, startTime, endTime = '';
                var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE ResourceAllocated.said = ?', [id], function(err, rows) {
                    Nametemp = rows[0].NameE;
                    Lastnametemp = rows[0].LastNameE;
                    Userid = rows[0].username;
                    Emailtemp = rows[0].email;
                    SAID = rows[0].said;
                    startTime = rows[0].startTime;
                    endTime = rows[0].endTime;
                    console.log("recived Data");
                });
                var mailchecker = 0;
                //send email function
                var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 7', function(err, template) { //Query data from database
                    mailchecker = 1;
                    if (!err) {
                        var temp = template[0].Text
                            // send email notification
                        transporter.sendMail({
                            form: 'Uninet Express Lane Services Team',
                            to: Emailtemp,
                            subject: 'Uninet Express Lane',
                            html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + Nametemp + ' ' + Lastnametemp + ', <br><br>' + temp + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                        });
                        //log data
                        var logdata = {
                            //logDate   : now(),
                            Sender: Nametemp,
                            Reciver: Userid + "(" + Emailtemp + ")",
                            emailData: temp
                        };
                        //save logs to database
                        var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                            if (err) {
                                console.log("Error when query logs : %s", err);
                            } else {
                                console.log("Log saved");
                            }
                        });
                        if (mailchecker == 1) {
                            var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,2 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                                connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ServiceActivities.said = ResourceAllocated.said SET actType = 2 , actbyuser=1 WHERE ServiceActivities.said = ?", [id], function(err, rows) {
                                    if (err) console.log("Error deleting : %s ", err);
                                    res.redirect('/servicemanage');
                                });
                            });
                        }
                        //console.log(arr);
                        console.log("Email was send ...");
                    } else {
                        console.log("Error query database ...");
                        //connection.release();
                    }
                });
            });
        }
    }
};
//cancel service approved
var delete_approve = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            var id = req.params.id;
            req.getConnection(function(err, connection) {
                var Nametemp, Lastnametemp, Emailtemp, SAID, startTime, endTime = '';
                var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user WHERE ResourceAllocated.said = ?', [id], function(err, rows) {
                    Nametemp = rows[0].NameE;
                    Lastnametemp = rows[0].LastNameE;
                    Userid = rows[0].username;
                    Emailtemp = rows[0].email;
                    SAID = rows[0].said;
                    startTime = rows[0].startTime;
                    endTime = rows[0].endTime;
                    console.log("recived Data");
                });
                var mailchecker = 0;
                //send email function
                var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 8', function(err, template) { //Query data from database
                    mailchecker = 1;
                    if (!err) {
                        var temp = template[0].Text.split("*").map(function(val) {
                            return (val);
                        });
                        // send email notification
                        transporter.sendMail({
                            form: 'Uninet Express Lane Services Team',
                            to: Emailtemp,
                            subject: 'Uninet Express Lane',
                            html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + Nametemp + ' ' + Lastnametemp + ', <br><br>' + temp[0] + SAID + temp[1] + startTime + temp[2] + endTime + temp[3] + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                        });
                        //log data
                        var logdata = {
                            //logDate   : now(),
                            Sender: Nametemp,
                            Reciver: Userid + "(" + Emailtemp + ")",
                            emailData: temp[0] + SAID + temp[1] + startTime + temp[2] + endTime + temp[3]
                        };
                        //save logs to database
                        var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                            if (err) {
                                console.log("Error when query logs : %s", err);
                            } else {
                                console.log("Log saved");
                            }
                        });
                        if (mailchecker == 1) {
                            var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,6 FROM ServiceActivities WHERE said = ?", [id], function(err) {
                                connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ServiceActivities.said = ResourceAllocated.said SET actType = 6 , actbyuser=1 WHERE ServiceActivities.said = ?", [id], function(err, rows) {
                                    if (err) console.log("Error deleting : %s ", err);
                                    res.redirect('/servicemanage');
                                });
                            });
                        }
                        //console.log(arr);
                        console.log("Email was send ...");
                    } else {
                        console.log("Error query database ...");
                        //connection.release();
                    }
                });
                /*
                var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,6 FROM ServiceActivities WHERE said = ?",[id],function(err){
                    connection.query("UPDATE ServiceActivities INNER JOIN ResourceAllocated ON ServiceActivities.said = ResourceAllocated.said SET actType = 6 , actbyuser=1 WHERE ServiceActivities.said = ?",[id], function(err, rows){
                        if(err)
                            console.log("Error deleting : %s ",err );   
                        res.redirect('/servicemanage');
                    });
                });
                */
            });
        }
    }
};
//cancel active service
var delete_active = function(req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        if (user !== undefined) {
            user = user.toJSON();
        }
        if (user.role !== 1) {
            res.redirect('/');
        } else {
            //exports.list = function(req, res){
            // Email ID 9
            var id = req.params.id;
            req.getConnection(function(err, connection) {
                var Nametemp, Lastnametemp, Emailtemp, SAID, startTime, endTime = '';
                var query = connection.query('SELECT * FROM ResourceAllocated LEFT JOIN ServiceActivities ON ResourceAllocated.said=ServiceActivities.said JOIN ServiceRequests ON ServiceActivities.sid=ServiceRequests.sid JOIN User ON User.id = ServiceRequests.user JOIN ActivePackage ON ServiceActivities.said = ActivePackage.said WHERE ActivePackage.apid = ?', [id], function(err, rows) {
                    Nametemp = rows[0].NameE;
                    Lastnametemp = rows[0].LastNameE;
                    Userid = rows[0].username;
                    Emailtemp = rows[0].email;
                    SAID = rows[0].said;
                    startTime = rows[0].startTime;
                    endTime = rows[0].endTime;
                    console.log("recived Data");
                });
                req.getConnection(function(err, connection) {
                    var mailchecker = 0;
                    //send email function
                    var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 8', function(err, template) { //Query data from database
                        mailchecker = 1;
                        if (!err) {
                            var temp = template[0].Text.split("*").map(function(val) {
                                return (val);
                            });
                            // send email notification
                            transporter.sendMail({
                                form: 'Uninet Express Lane Services Team',
                                to: Emailtemp,
                                subject: 'Uninet Express Lane',
                                html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + Nametemp + ' ' + Lastnametemp + ', <br><br>' + temp[0] + SAID + temp[1] + startTime + temp[2] + endTime + temp[3] + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                            });
                            //log data
                            var logdata = {
                                //logDate   : now(),
                                Sender: Nametemp,
                                Reciver: Userid + "(" + Emailtemp + ")",
                                emailData: temp[0] + SAID + temp[1] + startTime + temp[2] + endTime + temp[3]
                            };
                            //save logs to database
                            var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                                if (err) {
                                    console.log("Error when query logs : %s", err);
                                } else {
                                    console.log("Log saved");
                                }
                            });
                            if (mailchecker == 1) {
                                connection.query("UPDATE ServiceActivities INNER JOIN ActivePackage ON ServiceActivities.said = ActivePackage.said set actType = 9,actbyuser = 1 WHERE ActivePackage.apid = ? ", [id], function(err, rows) {
                                    if (err) console.log("Error deleting : %s ", err);
                                    connection.query("DELETE FROM ActivePackage  WHERE apid = ? ", [id], function(err, rows) {
                                        if (err) console.log("Error deleting : %s ", err);
                                        res.redirect('/servicemanage');
                                    });
                                });
                            }
                            //console.log(arr);
                            console.log("Email was send ...");
                        } else {
                            console.log("Error query database ...");
                            //connection.release();
                        }
                    });
                    /*
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ActivePackage.said,9 FROM ActivePackage WHERE ActivePackage.apid = ?",[id],function(err){
                        connection.query("UPDATE ServiceActivities INNER JOIN ActivePackage ON ServiceActivities.said = ActivePackage.said set actType = 9,actbyuser = 1 WHERE ActivePackage.apid = ? ",[id], function(err, rows){
                            if(err)
                                console.log("Error deleting : %s ",err );
                            console.log(id);
                            connection.query("DELETE FROM ActivePackage  WHERE apid = ? ",[id], function(err, rows){
                                if(err)
                                    console.log("Error deleting : %s ",err );
                                res.redirect('/servicemanage');
                            });
                        });
                    });
                    */
                });
            });
        }
    }
};
// sign in
// GET
var signIn = function(req, res, next) {
    if (req.isAuthenticated()) res.redirect('/memberindex');
    res.render('signin', {
        title: 'Sign In'
    });
};
// sign in
// POST
var signInPost = function(req, res, next) {
    passport.authenticate('local', {
        successRedirect: '/signin',
        failureRedirect: '/'
    }, function(err, user, info) {
        if (err) {
            return res.render('index', {
                title: 'Sign In',
                req: req,
                errorMessage: err.message
            });
        }
        if (!user) {
            return res.render('index', {
                title: 'Sign In',
                req: req,
                errorMessage: info.message
            });
        }
        return req.logIn(user, function(err) {
            if (err) {
                return res.render('index', {
                    title: 'Sign In',
                    req: req,
                    errorMessage: err.message
                });
            } else {
                user.flag = 1;
                req.getConnection(function(err, connection) {
                    var query = connection.query('INSERT INTO accessLogs(user,action) VALUES(?,1)', [user.username], function(err, rows) {
                        if (err) console.log("Error Selecting : %s ", err);
                    });
                });
                return res.redirect('/');
            }
        });
    })(req, res, next);
};
// sign up
// GET
var signUp = function(req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('signup', {
            title: 'Sign Up'
        });
    }
};
// sign up
// POST
var signUpPost = function(req, res, next) {
    var user = req.body;
    var usernamePromise = null;
    usernamePromise = new Model.User({
        username: user.username
    }).fetch();
    return usernamePromise.then(function(model) {
        if (model) {
            res.render('signup', {
                title: 'signup',
                errorMessagesu: 'username already exists'
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
            //send email  function
            var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = 1', function(err, template) { //Query data from database
                if (!err) {
                    var temp = template[0].Text
                        // send email notification
                    transporter.sendMail({
                        form: 'Uninet Express Lane Services Team',
                        to: user.email,
                        subject: 'Uninet Express Lane',
                        html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + user.NameE + ' ' + user.LastNameE + ', <br><br>' + temp + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                    });
                    //log data
                    var logdata = {
                        //logDate   : now(),
                        Sender: "AUTO Sender",
                        Reciver: user.username + "(" + user.email + ")",
                        emailData: temp
                    };
                    //save logs to database
                    var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                        if (err) {
                            console.log("Error when query logs : %s", err);
                        } else {
                            console.log("Log saved");
                        }
                    });
                    //console.log(arr);
                    console.log("Email was send ...");
                } else {
                    console.log("Error query database ...");
                    //connection.release();
                }
            });
            signUpUser.save().then(function(model) {
                // sign in the newly registered user
                res.render('registed', {
                    title: 'Registed'
                });
            });
        }
    });
};
// sign out
var signOut = function(req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        var user = req.user;
        req.getConnection(function(err, connection) {
            var query = connection.query("UPDATE User set flag=0 WHERE id = ? ", [user.id], function(err, rows) {
                if (err) console.log("Error Selecting : %s ", err);
            });
            var query = connection.query('INSERT INTO accessLogs(user,action) SELECT User.username,2 FROM User WHERE User.id = ?', [user.id], function(err, rows) {
                if (err) console.log("Error Selecting : %s ", err);
            });
        });
        req.logout();
        res.redirect('/');
    }
};
// Document PDF
var pdf1 = function(req, res, next) {
    var file = __dirname + '/PDF/UniNet-Express-Guildline.pdf';
    res.download(file); // Set disposition and send it.
};

// <<--- BEGIN REST API Dev --->>
// add request
var add_rest_service = function(req, res, next) {
    var input = JSON.parse(JSON.stringify(req.body));
    var user = JSON.parse(JSON.stringify(req.body.user));

    req.getConnection(function(err, connection) {
        var query = connection.query('SELECT id, username, password FROM User WHERE username = ?', [user.username], function(err, rows) {
            if (!err) {
                var str = JSON.stringify(rows);
                var data_user = JSON.parse(str);
                if (bcrypt.compareSync(user.password, data_user[0].password)) {
                    var query = connection.query("INSERT INTO ServiceRequests set user = ? ", data_user[0].id, function(err, rows) {
                        if (!err) {
                            var query = connection.query("INSERT INTO ServiceActivities (sid) SELECT sid From ServiceRequests WHERE user = ? Order By ServiceRequests.sid Desc LIMIT 1", data_user[0].id, function(err, a) {
                                if (!err) {
                                    var query = connection.query("SELECT said From ServiceActivities Order By said Desc LIMIT 1", function(err, rows) {
                                        if (!err) {
                                            var str = JSON.stringify(rows);
                                            arr_said = JSON.parse(str);
                                            var data = {
                                                resourceString1: input.resourceString1.toString().toLowerCase(),
                                                resourceString2: input.resourceString2.toString().toLowerCase(),
                                                IP1: input.IP1.toString().toLowerCase(),
                                                IP2: input.IP2.toString().toLowerCase(),
                                                startTime: input.startTime,
                                                endTime: input.endTime,
                                                said: arr_said[0].said,
                                            };
                                            var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,0 FROM ServiceActivities WHERE said = ?", arr_said[0].said, function(err) {
                                                if (!err) {
                                                    var query = connection.query("INSERT INTO ResourceAllocated set ? ", data, function(err, rows) {
                                                        if (!err) {
                                                            email_sender(5, data_user[0].id);
                                                            res.end("Add Request Done");
                                                        } else {
                                                            console.log("Error inserting to DB : %s ", err);
                                                        }
                                                    });
                                                } else {
                                                    console.log("Error saved log : %s ", err);
                                                }
                                            });
                                        } else {
                                            console.log("Error inserting : %s ", err);
                                        }
                                    });
                                } else {
                                    console.log("Error inserting : %s ", err);
                                }
                            });
                        } else {
                            console.log("Error inserting : %s ", err);
                        }
                    });
                } else {
                    console.log("Wrong Password or ID : %s ", err);
                }
            } else {
                console.log("Error User Not Found : %s ", err);
            }
        });
    });
};

// edit request 
var edit_rest_service = function(req, res, next) {
    var input = JSON.parse(JSON.stringify(req.body));
    var user = JSON.parse(JSON.stringify(req.body.user));
    var said_data = input.said;
    var data = {
        resourceString1: input.resourceString1,
        resourceString1: input.resourceString1,
        IP1: input.IP1,
        IP2: input.IP2,
        startTime: input.startTime,
        endTime: input.endTime
    };
    var query_str = "UPDATE ResourceAllocated INNER JOIN ServiceActivities ON ServiceActivities.said = ResourceAllocated.said SET ? WHERE ServiceActivities.ActType = 0 and ResourceAllocated.said = " + said_data;

    req.getConnection(function(err, connection) {
        var query = connection.query('SELECT id, username, password FROM User WHERE username = ?', [user.username], function(err, rows) {
            if (!err) {
                var str = JSON.stringify(rows);
                var data_user = JSON.parse(str);
                if (bcrypt.compareSync(user.password, data_user[0].password)) {
                    var query = connection.query(query_str, data, function(err, rows) {
                        if (err) console.log("Error: %s ", err);
                    });
                    res.end("Edit Done");
                }
            }
        });
    });
};

// delete request 
var delete_rest_service = function(req, res, next) {
    var input = JSON.parse(JSON.stringify(req.body));
    var user = JSON.parse(JSON.stringify(req.body.user));
    var said_data = input.said;

    /* we can approve the admin rule -- for difference result email sent*/

    req.getConnection(function(err, connection) {
        if (!err) {
            var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 1 WHERE actType = 0 and said = ? ", [said_data], function(err, rows) {
                if (!err) {
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,1 FROM ServiceActivities WHERE said = ?", [said_data], function(err) {
                        if (err) console.log("Insert Log Error : %s ", err);
                    });
                } else {
                    console.log("Update Request Service Error: %s", err);
                }
            });
            var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 5 WHERE actType = 4 and said = ? ", [said_data], function(err, rows) {
                if (!err) {
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,5 FROM ServiceActivities WHERE said = ?", [said_data], function(err) {
                        if (err) console.log("Insert Log Error : %s ", err);
                    });
                } else {
                    console.log("Update Service Approved Error: %s", err);
                }
            });
            var query = connection.query("UPDATE ServiceActivities SET actbyuser = 1 ,actType = 8 WHERE actType = 7 and said = ? ", [said_data], function(err, rows) {
                if (!err) {
                    var query = connection.query("INSERT INTO ServiceLogs(said,actType) SELECT ServiceActivities.said,8 FROM ServiceActivities WHERE said = ?", [said_data], function(err) {
                        if (!err) {
                            var query = connection.query("DELETE FROM ActivePackage WHERE said = ?", [said_data], function(err) {
                                if (err) console.log("Delete Active Service Error : %s ", err);
                            });
                        } else {
                            console.log("Insert Log Error : %s ", err);
                        }
                    });
                } else {
                    console.log("Update Active Service Error: %s", err);
                }
            });
            res.end("Delete Done");
        } else {
            console("Connection Error: %s", err);
        }
    });
};
// <<--- END REST API Dev --->>

// ADDITION EMAIL SENDER
function email_sender(email_id, user_id) { //RETURN callback-> 0 (NOT OK) or 1 (OK)
    var emailtemp = connection.query('SELECT Text FROM EmailTemplates WHERE id = ?', email_id, function(err, template) {
        if (!err) {
            var temp = template[0].Text;
            var userdata = connection.query('SELECT * FROM User WHERE id = ?', user_id, function(err, userdata) {
                if (!err) {
                    // send email notification
                    transporter.sendMail({
                        form: 'Uninet Express Lane Services Team',
                        to: userdata[0].email,
                        subject: 'Uninet Express Lane',
                        html: '<div style="width:600px;font-size:14px;color:#333333;font-family:Trebuchet MS,Verdana,Arial,Helvetica,sans-serif;"><br>Dear ' + userdata[0].NameE + ' ' + userdata[0].LastNameE + ', <br><br>' + temp + '<br><br><br><hr color="#666666" align="left" width="600" size="1" noshade=""></div>',
                    });
                    // save email log
                    var logdata = {
                        //logDate   : now(),
                        Sender: "Auto Sender",
                        Reciver: userdata[0].username + "(" + userdata[0].email + ")",
                        emailData: temp
                    };
                    var savelogs = connection.query("INSERT INTO  `EmailLogs` SET ?", logdata, function(err, rows) {
                        if (err) {
                            console.log("Error when query logs : %s", err);
                        } else {
                            console.log("Log saved");
                        }
                    });
                } else {
                    console.log("Error when query logs : %s", err);
                }
            });
        } else {
            console.log("Error when query logs : %s", err);
        }
    });
}


// export functions
/**************************************/
//check service
module.exports.check = check;
// index
module.exports.index = index;
module.exports.member = member;
//admin
// profile
module.exports.profile = profile;
//repassword
module.exports.repass = repass
module.exports.repasspost = repasspost
    //content
module.exports.about = about;
module.exports.contact = contact;
module.exports.status = status;
module.exports.service = service;
module.exports.document = document;
module.exports.graph = graph;
//memberaction
module.exports.serviceac = serviceac;
module.exports.addServiceac = addServiceac;
module.exports.add_rest_service = add_rest_service;
module.exports.edit_rest_service = edit_rest_service;
module.exports.delete_rest_service = delete_rest_service;
module.exports.ccServiceac = ccServiceac;
//adminaction
module.exports.user = user;
module.exports.accept = accept;
module.exports.edit = edit;
module.exports.saveedit = saveedit;
module.exports.delete_user = delete_user;
module.exports.cancel_user = cancel_user;
module.exports.servicemanage = servicemanage;
// email management
module.exports.emailmanage = emailmanage;
module.exports.mailedit = mailedit;
module.exports.mailsave = mailsave;
//module.exports.emailLogs = emailLogs;
//servicemanage
module.exports.accept_service = accept_service;
module.exports.edit_service = edit_service;
module.exports.saveedit_service = saveedit_service;
module.exports.delete_service = delete_service;
module.exports.delete_approve = delete_approve;
module.exports.delete_active = delete_active;
module.exports.addService = addService;
// sigin in
// GET
module.exports.signIn = signIn;
// POST
module.exports.signInPost = signInPost;
// sign up
// GET
module.exports.signUp = signUp;
// POST
module.exports.signUpPost = signUpPost;
module.exports.statusPost = statusPost;
// sign out
module.exports.signOut = signOut;
module.exports.pdf1 = pdf1;
