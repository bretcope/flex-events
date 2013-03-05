/*
 * Copyright (c) Atlantis Flight Development
 * 
 * PrivateInvocation.js
 * 
 */

var flexEvents = require('../flex-events.js');

flexEvents.configure({ arbitraryInvoke: false }); // disable arbitraryInvoke

function ClassA () {
    var _events = flexEvents.setup(this);
    
    // register an event so we can invoke it
    var _onTest = _events.register('test');
    
    this.privateInvoke = function () {
        _onTest("data"); // invoke the test event
    };
}

var a = new ClassA();

/* a.invoke('test'); <-- this would crash because arbitraryInvoke is false. */

a.attach('test', function (e, arg1) { console.log(arg1); }); // attach event listener
a.privateInvoke();

/* Output:
data
*/