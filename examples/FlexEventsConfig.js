/*
 * Copyright (c) Atlantis Flight Development
 * 
 * FlexEventsConfig.js
 * 
 */

var flexEvents = require('../flex-events.js');

// rename 'setup' and disable 'invoke' on the flexEvents object
flexEvents.configure({ methods: { setup: 'init', invoke: false } });

// re-enable the 'invoke' method globally
flexEvents.configure({ methods: { invoke: 'invoke' } });

flexEvents.attach('test', function () { console.log('test'); });

var a = {};
flexEvents.init(a); // we renamed 'setup' to 'init', so we have to use that instead

a.invoke('test'); // <-- this will succeed because we re-enabled 'invoke' publicly

//flexEvents.invoke('test'); // <-- this would crash because 'invoke' was disabled in the first call to configure

/* Output:
test
*/