/*
 * Copyright (c) Atlantis Flight Development
 * 
 * SimpleUsage.js
 * 
 */

var flexEvents = require('../flex-events.js');

// Initializing

function ClassA () {
    flexEvents.setup(this);
}

// Listening

var a = new ClassA();
a.attach('testEvent', function (e, helloArg, worldArg) {
    console.log(helloArg + ' ' + worldArg);
});

// Invoking

a.invoke('testEvent', "hello", "world");

// Bubbling

var b = {};
flexEvents.setup(b, a);

b.invoke('testEvent', 'one', 'two');

// Global listening

flexEvents.attach('testEvent', function (e, arg1, arg2) {
    console.log('global ' + arg1 + ' ' + arg2);
});

b.invoke('testEvent', 'three', 'four');

/* Output:
hello world
one two
three four
global three four
*/