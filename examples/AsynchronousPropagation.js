/*
 * Copyright (c) Atlantis Flight Development
 * 
 * AsynchronousPropagation.js
 * 
 */

var flexEvents = require('../flex-events.js');

var fs = require('fs');

var a = {};
flexEvents.setup(a);

a.attach('read', readFile);
a.attach('read', function (e) { console.log('second listener'); });

a.invoke('read');

function readFile (e) {
    console.log('reading file');
    e.pause(); // pause propagation so no further listeners are called until we're done reading the file
    fs.readFile(__dirname + '/AsynchronousPropagation.js', 'utf8', function (err, file) {
        console.log('done reading');
        if (err)
            console.log(err);
        else
            e.resume(); // resume propagation if there was no error
    });
}

/* Output:
reading file
done reading
second listener
*/

/* Output if e.pause() is commented out:
reading file
second listener
done reading
*/