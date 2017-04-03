###############################################################################
############ Update flow and Node connected from Ryu Controller ###############
######################### Theerachai Suntiwichaipanich ########################
############################## 23/06/2016 - 17:09  ############################
############################## trachiiz@gmail.com  ############################
############################## FB : Trachi Sunti   ############################
###############################################################################

#!/usr/bin/python
import xml.etree.ElementTree as ET 											# import xml library to access xml data
import xml.parsers
import MySQLdb																# import msqldb library to connect to Mysql
import requests																# import requests library to request GET REST API
import time
																			# GET xml data of Nagios Status identify by username and ticket
response = requests.get("http://202.29.154.254/nagiosxi/backend/?cmd=getservicestatus&username=nagiosadmin&ticket=rgkk3bo4")
tree = ET.fromstring(response.content)										
el = tree.findall("servicestatus")											# access service attribute	
index = [0,1,2,3,4,5,6,7,10,11,12,13,14,17,18,19,20,23,27,28,30,32,33,34,36,35,37,38,39,41,42,43,44]								# index of each service 
db = MySQLdb.connect("localhost","root","root","UniNetExpressLane")			# connect to Mysql 
cur = db.cursor()															# create cursor object

for i in range(len(index)):													 
	ch 		  = el[index[i]].getchildren()									# keep data of each node 
	host_name = ch[3].text
	service   = ch[5].text
	timestamp = ch[9].text
	statuss   = ch[10].text
	result    = cur.execute("""UPDATE Nagios_Status SET host_name=%s,timestamp=%s,service=%s,statuss=%s WHERE host_name=%s AND service=%s""",(host_name,timestamp,service,statuss,host_name,service))
	db.commit()
																			# select status from database to compare with current status
	cur.execute("""SELECT * FROM Nagios_Status WHERE host_name=%s AND service=%s""",(host_name,service));
	results2 = cur.fetchall()
	for rows in results2:													
		if rows[5] != statuss:												# keep log when status changed update  
			if rows[5][:5] != statuss[:5]:
				cur.execute("""INSERT INTO log_nagios (host_name,timestamp,service,statuss,zone) VALUES (%s,%s,%s,%s,%s)""",(host_name,timestamp,service,statuss,rows[2]))
				db.commit() 
db.close()
