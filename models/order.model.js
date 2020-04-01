const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let order = new Schema({
    email: { type: String, required: true },
    Pizzas: { type: String, required: true },
    DietPreference: { type: String, required: true },
    Base: { type: String, required: true },
    Size: { type: String, required: true },
    address: { type: String, required: true },
    time: { type: Date, required: true },
    AddOns: { type: [String] },
    Toppings: { type: [String] },
    timestamp: { type: Date, required: true }
});

let Order = mongoose.model('order',order);
module.exports = Order;