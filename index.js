const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const config = require('./config');

const http = require('http').Server(app);
let socket = require('./socket');
socket(http);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let PORT = process.env.PORT || 3000;
let DB_URL = config.cloudDatabaseURL;//config.localDatabaseURL;

const server = http.listen(PORT, () => 
{
    mongoose.connect(DB_URL, { useCreateIndex: true, useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true },(err) =>
    {
        if(err)
        {
            console.log('Database Not Connected',err);
        }
        else
        {
            var DB = 'Local Database';
            if(!DB_URL.includes('localhost'))
            {
                DB = 'Cloud Database';
            }
            console.log('Connected to',DB,'Successfully and Back End Listening on Port',PORT);
        }
    });
});

app.use('/user',require('./routes/user.route'));
app.use('/order',require('./routes/order.route'));