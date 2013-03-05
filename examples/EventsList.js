/*
 * Copyright (c) Atlantis Flight Development
 * 
 * EventsList.js
 * 
 */

var flexEvents = require('../flex-events.js');

flexEvents.configure({ arbitraryEvents: false, eventList: [ 'EVENT_1', 'EVENT_2' ], errorHandler: console.log });

var a = {};
flexEvents.setup(a);

a.invoke('EVENT_2'); // <-- this will succeed
a.invoke('EVENT_3'); // <-- this will fail because EVENT_3 is not in the eventList

/* Output:
[Error: Arbitrary Events are disabled. EVENT_3 is not on the event list.]
*/