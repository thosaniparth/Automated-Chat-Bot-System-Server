module.exports = (http)=>
{
    let io = require('socket.io')(http);
    const shortId = require('shortid')
    const dialogflow = require('dialogflow');
    const { PythonShell } = require('python-shell');
    const jwt = require('jsonwebtoken');
    const configFile = require('./config');
    const sessionClient = new dialogflow.SessionsClient(configFile.configDialogflow);
    const projectID = configFile.configDialogflow.projectID;
    const Order = require('./models/order.model');

    function nlu(messageRes)
    {
        return new Promise((resolve, reject) => 
        {
            var pyshell1 = new PythonShell(configFile.nluPyshellConfig.script,configFile.nluPyshellConfig.options);
            pyshell1.send(JSON.stringify({text: messageRes}));
            pyshell1.on('message', async (message) =>
            {
                message = JSON.parse(message);
                var intent = message.intent.name;
                resolve(intent);
            });
            pyshell1.end((err) =>
            {
                if(err)
                {
                    console.log(err);
                }
            });
        });
    }

    function nlg(intent,order)
    {
        return new Promise((resolve, reject) => 
        {
            var pyshell2 = new PythonShell(configFile.nlgPyshellConfig.script,configFile.nlgPyshellConfig.options);
            pyshell2.send(JSON.stringify({ intent: intent, order: order }));
            pyshell2.on('message',(message) =>
            {
                message = JSON.parse(message);
                var response = message.response;
                resolve(response);
            });
            pyshell2.end((err) =>
            {
                if(err)
                {
                    console.log(err);
                }
            });
        });
    }

    function calculatePreference(email,address)
    {
        return new Promise((resolve, reject) => 
        {
            var result = { status: "failure" };
            Order.find({ email: email },{ _id: 0 }, (err,orders)=>
            {
                if(err)
                {
                    resolve(result);
                }
                else
                {
                    result.status = "success";
                    var summary = {
                        Pizzas: orders.map((order)=> order.Pizzas),
                        DietPreference: orders.map((order)=> order.DietPreference),
                        Base: orders.map((order)=> order.Base),
                        Size: orders.map((order)=> order.Size),
                        AddOns: orders.map((order)=> order.AddOns).flat(),
                        Toppings: orders.map((order)=> order.Toppings).flat()
                    };
                    Object.keys(summary).forEach((key,index)=>
                    {
                        var map = summary[key].reduce(function (p, c) {
                            p[c] = (p[c] || 0) + 1;
                            return p;
                        }, {});
                        var newArray = Object.keys(map).sort(function (a, b) {
                            return map[a] < map[b];
                        });
                        summary[key] = newArray;
                    });
                    var curr = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
                    var time = String(curr.getHours()+1)+":"+String(curr.getMinutes());
                    var order = {
                        Pizzas: summary['Pizzas'][0],
                        DietPreference: summary['DietPreference'][0],
                        Base: summary['Base'][0],
                        Size: summary['Size'][0],
                        AddOns: summary['AddOns'].slice(0,5),
                        Toppings: summary['Toppings'].slice(0,5),
                        address: address,
                        time: time
                    }
                    result['order'] = order;
                    resolve(result);
                }
            });
        });
    }

    io.sockets.on('connection', function(socket)
    {
        socket.on('init',(token) =>
        {
            socket.sessionID = shortId.generate();
            socket.sessionPath = sessionClient.sessionPath(projectID, socket.sessionID);
            jwt.verify(token,configFile.jwtSecretKey, (err, d) =>
            {
                if(!err)
                {
                    socket.email = d.email;
                    socket.address = d.address;
                }
                else
                {
                    console.log(err);
                }
            });
        });
        /*
        ======================= For New Users =======================
        */
        socket.on('messageNew', async function(message)
        {
            var chat = {
                message: message,
                type : 'human',
                isMe: true,
                createdAt : new Date().toISOString(),
                id: shortId.generate()
            }
            socket.emit('push',chat);
            var request = {
                session: socket.sessionPath,
                queryInput: {
                text: {
                    text: chat.message,
                    languageCode: 'en',
                },
                }
            };
            var response = await sessionClient.detectIntent(request);
            var chatResp = {
                message: response[0].queryResult.fulfillmentText,
                type : 'bot',
                isMe: false,
                createdAt : new Date().toISOString(),
                id: shortId.generate()
            };
            socket.emit('push',chatResp);
            if(chatResp.message.includes('Stay Hungry'))
            {
                var entities = response[0].queryResult.parameters.fields;
                var obj = {
                    email: socket.email,
                    Pizzas: entities.Pizzas.stringValue,
                    DietPreference: entities.DietPreference.stringValue,
                    Base: entities.Base.stringValue,
                    Size: entities.Size.stringValue,
                    address: entities.address.stringValue,
                    time: new Date(entities.time.stringValue),
                    AddOns: entities.AddOns.listValue.values.map((elem)=> elem.stringValue),
                    Toppings: entities.Toppings.listValue.values.map((elem)=> elem.stringValue),
                    timestamp: new Date()
                };
                console.log(obj);
                let order = new Order(obj);
                order.save((err) =>
                {
                    if(err)
                    {
                        console.log('Order Save Failed',err)
                    }
                    else
                    {
                        console.log('Order Saved');
                    }
                });
                setTimeout(()=>{
                    socket.emit('end');
                },1500)
            }
        });
        /*
        ======================= For Old Users =======================
        */
        socket.on('messageOld', async function(message)
        {
            calculatePreference(socket.email,socket.address).then( async (preference) =>
            {
                if(preference.status!="failure")
                {
                    var order = preference.order;
                    var chat = {
                        message: message,
                        type : 'human',
                        isMe: true,
                        createdAt : new Date().toISOString(),
                        id: shortId.generate()
                    }
                    socket.emit('push',chat);
                    var messageRes = '';
                    var intent = '';
                    var response = '';
                    var i = 0;
                    var request = {
                            session: socket.sessionPath,
                            queryInput: {
                            text: {
                                text: chat.message,
                                languageCode: 'en',
                            },
                        }
                    };
                    while(true)
                    {
                        if(i!=0)
                        {
                            if(response=='')
                            {
                                response = "I didn't get your question, can you please repeat?";
                            }
                            request={
                                session: socket.sessionPath,
                                queryInput: {
                                text: {
                                    text: response,
                                    languageCode: 'en',
                                },
                                }
                            };
                        }
                        i++;
                        var result = await sessionClient.detectIntent(request);
                        messageRes = result[0].queryResult.fulfillmentText;
                        var chatResp = {
                            message: messageRes,
                            type : 'bot',
                            isMe: false,
                            createdAt : new Date().toISOString(),
                            id: shortId.generate()
                        }
                        socket.emit('push',chatResp);
                        if(messageRes.includes('Stay Hungry'))
                        {
                            var entities = result[0].queryResult.parameters.fields;
                            console.log(entities.Toppings.listValue.values);
                            var obj = {
                                email: socket.email,
                                Pizzas: entities.Pizzas.stringValue,
                                DietPreference: entities.DietPreference.stringValue,
                                Base: entities.Base.stringValue,
                                Size: entities.Size.stringValue,
                                address: entities.address.stringValue,
                                time: new Date(entities.time.stringValue),
                                AddOns: entities.AddOns.listValue.values.map((elem)=> elem.stringValue),
                                Toppings: entities.Toppings.listValue.values.map((elem)=> elem.stringValue),
                                timestamp: new Date()
                            };
                            console.log(obj);
                            let order = new Order(obj);
                            order.save((err) =>
                            {
                                if(err)
                                {
                                    console.log('Order Save Failed',err)
                                }
                                else
                                {
                                    console.log('Order Saved');
                                }
                            });
                            break;
                        }
                        await nlu(messageRes).then(async (int) =>
                        {
                            intent = int;
                            await nlg(intent,order).then((resp) =>
                            {
                                response = resp;
                                chat ={
                                    message: response,
                                    type: 'human',
                                    isMe: true,
                                    id: shortId.generate(),
                                    createdAt: new Date().toISOString()
                                }
                                socket.emit('push',chat);
                            })
                        });
                    }
                    socket.emit('end');
                }
                else
                {
                    socket.emit('end');
                }
            });
        });
    });
};