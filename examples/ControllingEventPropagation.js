/*
 * Copyright (c) Atlantis Flight Development
 * 
 * ControllingEventPropagation.js
 * 
 */

var flexEvents = require('../flex-events.js');

var a = {};
flexEvents.setup(a);
a.attach('zzz', function (e) { console.log('zzz a'); });
a.attach('yyy', function (e) { console.log('yyy a'); });

var b = {};
flexEvents.setup(b, a);

// zzz 3 is going to stop propagation immediately
b.attach('zzz', function (e) {
    console.log('zzz b1');
    e.stop();
});

// yyy 3 is going to stop bubbling
b.attach('yyy', function (e) {
    console.log('yyy b1');
    e.stopBubble();
});

b.attach('zzz', function (e) { console.log('zzz b2'); });
b.attach('yyy', function (e) { console.log('yyy b2'); });

var c = {};
flexEvents.setup(c, b);
c.attach('zzz', function (e) { console.log('zzz c'); });
c.attach('yyy', function (e) { console.log('yyy c'); });

c.invoke('zzz');
console.log();
c.invoke('yyy');

/* Output:
zzz c
zzz b1

yyy c
yyy b1
yyy b2
 */
