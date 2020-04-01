import json
import sys

from rasa_nlu.model import Interpreter

Data = sys.stdin.readlines()
data = Data[0]
data = json.loads(data)

interpreter = Interpreter.load('./rasa_nlu/models/current/nlu')
message = data['text']
message = message.lower()
result = interpreter.parse(message)

print(json.dumps(result))
