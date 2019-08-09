import socket
import pickle

HEADER_SIZE = 10


s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)   # which are ipv4, TCP

s.connect((socket.gethostname(), 1234))

# msg = s.recv(1024)  # size of stream chunks received
# print(msg.decode("utf-8"))

# while True:
# 	msg = s.recv(8)
# 	print(msg.decode("utf-8"))


# while True:

full_msg = b''
new_msg = True

while True:
	msg = s.recv(16)
	if new_msg:
		print(f"new message length: {msg[:HEADER_SIZE]}")
		msg_len = int(msg[:HEADER_SIZE])
		new_msg = False

	full_msg += msg

	if len(full_msg)-HEADER_SIZE == msg_len:
		print("full msg received")
		print(full_msg[HEADER_SIZE:])
		d = pickle.loads(full_msg[HEADER_SIZE:])
		print(d)
		new_msg = True
		full_msg = b''

	# print(full_msg)
