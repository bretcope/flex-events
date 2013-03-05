/*
 * Copyright (c) Atlantis Flight Development
 * 
 * ObjectConfiguration.js
 * 
 */

var flexEvents = require('../flex-events.js');

flexEvents.configure({ arbitraryEvents: false, eventList: [ 'EVENT_1', 'EVENT_2' ], errorHandler: console.log });

var a = {};
flexEvents.setup(a);
a.invoke('test'); // <-- this will fail because arbitraryEvents is false and 'test' is not in the eventList.

var b = {};
flexEvents.setup(b, null, { arbitraryEvents: true }); // override arbitraryEvents for this object only
b.invoke('test'); // <-- this will succeed because arbitraryEvents were re-enabled on this object

/* Output:
[Error: Arbitrary Events are disabled. test is not on the event list.]
*/