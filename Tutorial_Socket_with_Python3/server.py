import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)   # which are ipv4, TCP

s.bind((socket.gethostname(), 1234))   # ip address, PORT

s.listen(5)  # queue of 5

while True:
	client_socket, address = s.accept()    # client socket object
	print(f"Connection from {address} has been established!")
	client_socket.send(bytes("Welcome to the Server!", "utf-8"))
