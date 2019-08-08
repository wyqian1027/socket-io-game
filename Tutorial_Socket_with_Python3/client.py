import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)   # which are ipv4, TCP

s.connect((socket.gethostname(), 1234))

# msg = s.recv(1024)  # size of stream chunks received
# print(msg.decode("utf-8"))

# while True:
# 	msg = s.recv(8)
# 	print(msg.decode("utf-8"))

full_msg = ""

while True:
	msg = s.recv(8)
	if msg:
		full_msg += msg.decode("utf-8")
	else:
		break

print(full_msg)
