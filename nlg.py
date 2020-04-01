from nlglib.realisation.simplenlg.realisation import Realiser
from nlglib.microplanning import Clause, NP, VP
import json
import sys
realise_en = Realiser(host='nlg.kutlak.info', port=40000)

Data = sys.stdin.readlines()
data = Data[0]
data = json.loads(data)
intent = data['intent']
order = data['order']

p = ''
if (intent=='greet'):
    p = Clause(NP('Hello!', 'How','are'), VP('you'))
elif (intent=='thankyou'):
     p = Clause(NP('Cheers!!', 'Visit'), VP('Again'))
elif (intent=='QPizza'):
     p = Clause(NP('I'), VP('want',order['Pizzas'],'pizza'))
elif (intent=='QDietpreference'):
     p = Clause(NP('Diet Preference'), VP('is',order['DietPreference']))
elif (intent=='QSize'):
     p = Clause(NP('I'), VP('want',order['Size'],'pizza'))
elif (intent=='QBase'):
     p = Clause(NP('I'), VP('want',order['Base']))
elif (intent=='QToppings'):
    str1 = ', '.join([str(elem) for elem in order['Toppings']])
    p = Clause(NP('I'), VP('want',str1,'on my pizza'))
elif (intent=='QAddress'):
     p = Clause(NP('Please',''), VP('Deliver','My order at',order['address']))
elif (intent=='QTime'):
     p = Clause(NP('Please',''), VP('Deliver','My order at',order['time']))
elif (intent=='Qextras'):
     p = Clause(NP('I want '), VP('Extras','with my pizza'))

result = {
     "response": realise_en(p)
}
print(json.dumps(result))