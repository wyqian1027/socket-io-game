import socket
import time
import pickle

# msg = pickle.dumps(d)


HEADER_SIZE = 10


s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)   # which are ipv4, TCP

s.bind((socket.gethostname(), 1234))   # ip address, PORT

s.listen(5)  # queue of 5

while True:
	client_socket, address = s.accept()    # client socket object
	print(f"Connection from {address} has been established!")

	d = {1: "Hey", 2: "There!"}
	msg = pickle.dumps(d)    # this is already bytes

	# msg = "Welcome to the Server!"
	msg = bytes(f'{len(msg):<{HEADER_SIZE}}', "utf-8") + msg
	client_socket.send(msg)

	# client_socket.close()
	# while True:
	# 	time.sleep(3)
	# 	msg = f'The time is {time.time()}.'
	# 	msg = f'{len(msg):<{HEADER_SIZE}}'+msg
	# 	client_socket.send(bytes(msg, "utf-8"))

# To list any process listening to the port 8080:
# lsof -i:1234

# To kill any process listening to the port 8080:
# kill $(lsof -t -i:1234)
