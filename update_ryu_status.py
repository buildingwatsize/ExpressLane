###############################################################################
############ Update flow and Node connected from Ryu Controller ###############
######################### Theerachai Suntiwichaipanich ########################
############################## 23/06/2016 - 17:09  ############################
############################## trachiiz@gmail.com  ############################
############################## FB : Trachi Sunti   ############################
###############################################################################

import json		# import json library to access json
import urllib		# import urllib for opening URLs
import MySQLdb		# import mysqldb to connect to mysql database
import datetime		# import datetime to get current date and time

ts = datetime.datetime.now()	# get current date and time

db = MySQLdb.connect(host="localhost",		# connect to mysql with specific user and password
		     user="root",
		     passwd="root",
		     db="UniNetExpressLane")	# database name
cur = db.cursor()	# create cursor object 

url_sw = "http://202.29.154.254:8080/stats/switches"	# URLs to get switch connected with Controller
response = urllib.urlopen(url_sw)			# GET REST API
sw_data = json.loads(response.read())			# access each element in json form 
print sw_data
row2 = ["-","-","-","-","-","-","-"]
row3 = ["-","-","-","-","-","-","-"]
row4 = ["-","-","-","-","-","-","-"]
src_mac  = ["-","-","-","-","-","-","-"]
dest_mac = ["-","-","-","-","-","-","-"]
in_port  = ["-","-","-","-","-","-","-"]
out_port = ["-","-","-","-","-","-","-"]
packet   = ["-","-","-","-","-","-","-"]
actions2 = ["-","-","-","-","-","-","-"]
db_start_time = ['1','2','3','4','5','6','7']
db_status = ['Offline','Offline','Offline','Offline','Offline','Offline','Offline']
status = ['Offline','Offline','Offline','Offline','Offline','Offline','Offline']
host = ['UNINET','KMUTNB','MAHIDOL','CU','RMUTSB','RMUTT','KKU']

def getFlow(ids):	# Method to get flow each connected node 	
	for num in ids:		# for loop for connected node
		desc_sw = "http://202.29.154.254:8080/stats/desc/"+str(num)	# URLs description each connected node
		flow_sw = "http://202.29.154.254:8080/stats/flow/"+str(num)	# URLs flow each connected node

		response = urllib.urlopen(desc_sw)			# get description through GET REST API
		data = json.loads(response.read())			# access each element in json form 
		blank_space = data[str(num)]['dp_desc'].index(" ")	# find blank space 
		host_name = data[str(num)]['dp_desc'][:blank_space]	# get host name from json 
		
		response_flow = urllib.urlopen(flow_sw)		# get flow through GET REST API
		data_flow = json.loads(response_flow.read())	# access each element in json form  
		# if have any data then update data in database
		if len(data_flow[str(num)]) != 0:
			# check host name to identify index 
			if str(host_name) == "KKU":
               			host_desc = "KKU"
				index = 6
	        	elif str(host_name) == "CU":
        	    		host_desc = 'CU'
				index = 3
            		elif str(host_name) == "RMUTSB":
                		host_desc = 'RMUTSB'
				index = 4
			elif str(host_name) == "KMUTNB":
                		host_desc = 'KMUTNB'
				index = 1
            		elif str(host_name) == "MAHIDOL":
                		host_desc = 'MAHIDOL'
				index = 2
			elif str(host_name) == "UNINET":
                		host_desc = 'UNINET'
				index = 0
                	elif str(host_name) == "RMUTT":
                                host_desc = 'RMUTT'
                                index = 5

			priority = data_flow[str(num)][0]['priority']	# keep data from json for update database
			byte_count = data_flow[str(num)][0]['byte_count']
			duration_sec = data_flow[str(num)][0]['duration_sec']
			if len(data_flow[str(num)][0]['actions']) != 0:
				actions = data_flow[str(num)][0]['actions'][0][7:]
			packet_count = data_flow[str(num)][0]['packet_count']
			dl_dst = data_flow[str(num)][0]['match']['dl_dst']
			inport = data_flow[str(num)][0]['match']['in_port']
			
            		byte_count2 = data_flow[str(num)][1]['byte_count']
            		duration_sec2 = data_flow[str(num)][1]['duration_sec']
           		actions2 = data_flow[str(num)][1]['actions'][0][7:]
           		packet_count2 = data_flow[str(num)][0]['packet_count']
           		dl_dst2 = data_flow[str(num)][1]['match']['dl_dst']
           		inport2 = data_flow[str(num)][1]['match']['in_port']
			global src_mac,dest_mac,in_port,out_port,packet
			src_mac[index]  =  str(dl_dst)		# keep data from json into src_mac identify by hostname
			dest_mac[index] =  str(dl_dst2)		# keep data from json into dest_mac identify by hostname
			in_port[index]  =  str(inport)		# keep data from json into in_port identify by hostname
			out_port[index] =  str(actions)		# keep data from json into out_port identify by hostname
			packet[index]   =  str(packet_count)	# keep data from json into packet identify by hostname
			# update data in database
			cur.execute("""UPDATE Online_Status SET src_mac=%s,dest_mac=%s,packet_count=%s WHERE host_name=%s""",
					(dl_dst,dl_dst2,packet_count,host_desc))
			db.commit()
			
		# Modify status to Online identify by host_name		
		if str(host_name) == "KKU":
			status[6] = "Online"
			print ("<<<<<<<<<<<<<< KKU\tOnline >>>>>>>>>>>>>>>>>")
		elif str(host_name) == "CU":
			status[3] = 'Online'
			print ("<<<<<<<<<<<<<< CU\tOnline >>>>>>>>>>>>>>>>>")
		elif str(host_name) == "RMUTSB":
			status[4] = 'Online'
			print ("<<<<<<<<<<<<<< RMUTSB\tOnline >>>>>>>>>>>>>>>>>")
		elif str(host_name) == "KMUTNB":
            		status[1] = 'Online'
            		print ("<<<<<<<<<<<<<< KMUTNB\tOnline >>>>>>>>>>>>>>>>>")
        	elif str(host_name) == "UNINET":
            		status[0] = 'Online'
            		print ("<<<<<<<<<<<<<< UniNet\tOnline >>>>>>>>>>>>>>>>>")
		elif str(host_name) == "MAHIDOL":
            		status[2] = 'Online'
            		print ("<<<<<<<<<<<<<< MU\tOnline >>>>>>>>>>>>>>>>>")               
		elif str(host_name) == "RMUTT":
			status[5] = 'Online'
			print ("<<<<<<<<<<<<<< RMUTT\tOnline >>>>>>>>>>>>>>>>>")
if sw_data != 'null': 		# if have any node connected
	getFlow(sw_data)	# call function to get flow of each node

cur.execute("SELECT * FROM Online_Status")	# get current node status from Online_status table
results = cur.fetchall()										
if results:																		
	i = 0
	for row in results:														
		db_status[i] = row[4]	# get status of each node
		db_start_time[i] = row[1]	# get timestamp of each node
		row2[i] = row[2]	# get hostname of each node
		row3[i] = row[3]	# get zone of each node				
		i += 1			# increase index
else:
	print "Can't get data"

for i in range(len(row2)):	# for loop to update data
	if db_status[i] == status[i]: 		# update when current status changed 
		duration = str(ts-db_start_time[i])[:-4]	# calculation duration time 
		cur.execute("""UPDATE Online_Status SET end_time=%s,src_mac=%s,dest_mac=%s,in_port=%s,
				out_port=%s,duration_time=%s,packet_count=%s WHERE host_name=%s""",
			(ts,src_mac[i],dest_mac[i],in_port[i],out_port[i],duration,packet[i],host[i]))
    	else:
		duration = ts-ts 		# initial duration time 
		cur.execute("""UPDATE Online_Status SET start_time=%s,end_time=%s,duration_time=%s,
				src_mac=%s,dest_mac=%s,in_port=%s,out_port=%s,packet_count=%s,statuss=%s WHERE host_name=%s""",
			(ts,ts,duration,src_mac[i],dest_mac[i],in_port[i],out_port[i],packet[i],status[i],host[i]))
		duration = str(ts-db_start_time[i])[:-4]	# calculation duration time 
		cur.execute("""INSERT INTO log_Online_status SET end_time=%s,src_mac=%s,dest_mac=%s,
				in_port=%s,out_port=%s,duration_time=%s,packet_count=%s,start_time=%s,host_name=%s,zone=%s,statuss=%s""",
			(ts,src_mac[i],dest_mac[i],in_port[i],out_port[i],duration,packet[i],db_start_time[i],row2[i],row3[i],status[i]))
	status[i] = db_status[i] 
	db.commit()
db.close()
