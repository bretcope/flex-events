/*
 * Copyright (c) Atlantis Flight Development
 * 
 * StrictMode.js
 * 
 */

var flexEvents = require('../flex-events.js');

flexEvents.configure({ strict: true, errorHandler: console.log, methods: { register: "register" } });

var a = {};
flexEvents.setup(a);

a.attach('test', function () { console.log(arguments); }); // <-- this will fail because 'test' has not been registered.

// register the event (note: 'register' is not normally a public method, notice the above configure statement)
a.register('test');

a.attach('test', function () { console.log(arguments); }); // <-- this will succeed because 'test' has now been registered.

/* Output:
[Error: Events are configured with strict enabled, and test is not a registered event on this object.]
*/