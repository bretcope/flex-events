/*
 * Copyright (c) Atlantis Flight Development
 * 
 * CustomMethodNames.js
 * 
 */

var flexEvents = require('../flex-events.js');

flexEvents.configure({ methods: { attach: 'on', detach: false, register: 'register' } });

var a = {};
flexEvents.setup(a);

a.on('test', function (e, arg1) { console.log(arg1); });
a.invoke('test', 'renaming "attach" worked');

// a.detach('test'); // <-- this would crash because we made detach private

a.register('test2'); // <-- this will succeed because we made register public

/* Output:
renaming "attach" worked
*/