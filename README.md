# flex-events

There are many event systems for JavaScript, but most of them are simplistic and lack power features which are useful in more complex environments. The goal of flex-events is to be [highly configurable](#configuration) and support:

* [Custom event bubbling](#controlling-event-propagation)
* [Asynchronous Propagation](#asynchronous-propagation)
* [Strict or arbitrary event names](#events-list)
* [Strict or arbitrary attach modes](#strict-mode)
* [Custom function names](#custom-method-names)
* [Configurable globally and per object](#object-configuration)
* [Works in all browsers and Node.js](#including)
* No external dependencies

###### Table of Contents

1. [Simple Usage](#simple-usage)
2. [Configuration](#configuration)
3. [Setup Method](#setup-method)
4. [Event Methods](#event-methods)
    * [attach](#attach)
    * [detach](#detach)
    * [hasEvent](#hasevent)
    * [invoke](#invoke)
    * [register](#register)
    * [registerList](#registerlist)
    * [deregister](#deregister)
    * [destroy](#destroy)
5. [Event Invocation Object](#event-invocation-object)
6. [Advanced Examples](#advanced-examples)
    * [Private Invocation](#private-invocation)
    * [Events List](#events-list)
    * [Strict Mode](#strict-mode)
    * [Custom Method Names](#custom-method-names)
    * [Controlling Event Propagation](#controlling-propagation)
    * [Asynchronous Propagation](#asynchronous-propagation)
    * [Object Configuration](#object-configuration)
7. [Implementation Notes](#implementation-notes)

## Simple Usage

This section provides the obligatory very simple example. Its usage will likely feel familiar. Skip to the [Configuration](#configuration) or [Advanced Examples](#advanced-examples) sections if you're more interested in the advanced features.

### Including

###### Node.js:

```javascript
var flexEvents = require('flex-events');
```

###### In a Browser:

```html
<script src='[path to file]/flex-events.js'></script>
```

### Initializing

Setting up events on an object is as simple as calling [setup](#setup-method)

```javascript
function ClassA () {
    flexEvents.setup(this);
}
```

### Listening

Call the [attach](#attach) method with an event name and a callback.

```javascript
var a = new ClassA();
a.attach('testEvent', function (e, helloArg, worldArg) {
    console.log(helloArg + ' ' + worldArg);
});
```

The first argument sent to the callback is an [Event Invocation](#event-invocation-object) object. If more than one argument is provided to the [invoke](#invoke) method (below), they will be provided to the listener callbacks in the same order.

### Invoking

```javascript
a.invoke('testEvent', "hello", "world");
```

When invoked, the listener from the previous section outputs: `hello world`

### Bubbling

Sometimes it makes sense to declare an event hierarchy. This is done by sending a parent object to the [setup](#setup-method) method.

```javascript
var b = {};
flexEvents.setup(b, a);
```

In this example we created a new object `b` and set its event parent to `a`. Now when we call:

```javascript
b.invoke('testEvent', 'one', 'two');
```

the original event listener we setup on object `a` is still called because the event bubbles up.

### Global Listening

The `flexEvents` object is, itself, an events-enabled object. In fact, it is the root of the event bubble chain, which means we can use it for listening for events globally.

```javascript
flexEvents.attach('testEvent', function (e, arg1, arg2) {
    console.log('global ' + arg1 + ' ' + arg2);
});
```

## Configuration

Configuration is central to the _flexibility_ of flex-events. Events can be configured on both the global, and the object level.

### Configure Method

Allows the default global configuration settings to be overridden. If you decide to call this method, it can be called as many times as desired, but calling `configure` after the first usage of [setup](#setup-method) will have no effect and will produce a warning.

`flexEvents.configure( config )`

* `config` : An object which overrides some, or all, of the default config values.

### Default Configuration

We'll get into some examples [later](#advanced-examples), but here's the default config values and what they mean:

```javascript
//default config
var _config =
{
	arbitraryEvents: true,
	arbitraryInvoke: true,
	eventList: null,
	strict: false,
	methods: {
		attach: "attach",
		detach: "detach",
		hasEvent: "hasEvent",
		invoke: "invoke",
		register: false,
		registerList: false,
		deregister: false,
		destroy: false
	},
	errorHandler: null,
	warningHandler: null,
	bubble: true
};
```

##### arbitraryEvents

`true {Boolean}` If **true**, event names can be any arbitrary string. If **false**, all event names must match an item in the [eventList](#eventlist). This may be helpful to prevent typos. See the [Events List](#events-list) example.

##### arbitraryInvoke

`true {Boolean}` If **true**, events can be invoked by simply calling [invoke](#invoke). If **false**, events can only be invoked using the function returned from [register](#register), and, also, the [invoke](#invoke) and [registerList](#registerlist) methods will be disabled. See the [Private Invocation](#private-invocation) example.

##### eventList

`null {Array|null}` This can be **null** unless `arbitraryEvents == false`, in which case this should be an **array** of strings which represent the event names your system supports. See the [Events List](#events-list) example.

> Side note: You might wonder why `arbitraryEvents` is not simply an implied configuration value based on whether `eventList` is null or an array. There are two reasons it is not. The first is that arbitraryEvents can be helpful when configuring on the object (vs. global) level, because you could have a global event list, but only enforce it on specific objects. The second reason is that I would like to expand the warning system; maybe you want to be alerted if an event name is in the list, but don't want it to fail. The warning system could solve that.

##### strict

`false {Boolean}` If **true**, only event names which have been explicitly registered on an object, or on a child in the object's event bubble chain, can be listened for (attached), detached, or invoked. If **false**, attaching or invoking an event will automatically register it. See the [Strict Mode](#strict-mode) example.

##### methods

`(see default above) {Object}` This setting allows you to decide which methods are publicly appended to the object for which events are being setup on. See [Event Methods](#event-methods) for a description of each available method, and see [Custom Method Names](#custom-method-names) for an example of how to use this configuration setting.

##### errorHandler

`null {Function|null}` When certain actions violate configuration requirements, errors will be created. This error is a javascript [Error object](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Error) and will be passed as the first argument to `errorHandler` if it is **not null**. If `errorHandler` is **null**, the error will be thrown, and will result in a crash if not caught. An error handler should probably be provided if non-default configuration values are used.

_Current Error Messages_

* Arbitrary Events are disabled. [eventName] is not on the event list.
* Events are configured with strict enabled, and [eventName] is not a registered event on this object.

##### warningHandler

`null {Function|null}` The same as [errorHandler](#errorhandler) except the error messages are of lower importance, and if no warning handler is provided, the Error object will simply be discarded (it will not be thrown).

_Current Warning Messages_

* Event parent has not been setup for events.
* The configure method cannot be called after setup.

##### bubble

`true {Boolean}` If **false**, events will not bubble up.

## Setup Method

Initializes an object so that events can be registered/attached/invoked/etc on the object.

`flexEvents.setup( obj [, parent [, config ]] )`

* `obj` `{Object}` : The object to have events enabled on.
* `parent` `{Object} [optional]` : The object's parent in the event chain.
* `config` `{Object} [optional]` : If desired, some, or all, global configuration settings can be overridden on a per object basis.

Returns an [Event Methods](#event-methods) object.

Setup should never be called more than once on an object, since this may cause unexpected behavior. If you're unsure whether setup has been called, you can check for `obj.__flexEvents`.

## Event Methods

The object returned by the `flexEvents.setup()` method contains the methods documented below. Some, or all, of these methods may also be appended directly onto the object (`obj` argument in [setup](#setup-method)), depending on the [methods](#methods) configuration item. See the [Custom Method Names](#custom-method-names) example.

### attach

Attaches an event listener.

`.attach( eventName [, options], callback )`

* `eventName` `{String}` : The name of the event to listen for.
* `options` `{Object} [optional]` : Allows the event listener to be customized. See the _[Options Syntax](#options-syntax)_ below.
* `callback` `{Function}` : The function to be called when the event is invoked. The first argument will be an [Event Invocation](#event-invocation-object) object. The following zero or more arguments will correspond to any extra arguments which were provided to the [invoke method](#invoke).

###### Options Syntax

The options object has three optional keys which each accept a boolean value:

* `once` If **true**, the listener will be removed after the first time it is called.
* `bubbleOnly` If **true**, the callback will only be called if the object being listened on did NOT invoke the event. In other words, it will be called if the event was the result of a bubble.
* `originOnly` The opposite of `bubbleOnly`. If **true**, the callback will only be called for the object which invoked the event. The [example](#originonly-example) below may help with clarification. _Note that if both originOnly and bubbleOnly are true, the callback will never be called._

> An unintended, but potentially useful, side-effect of the `options` object is that, because the options object becomes part of the [Event Invocation](#event-invocation-object) object, it is accessible from inside the callback. Therefore, it could be used to send arbitrary information to the callback. Just be careful in your choice of key names in case a future version of this software adds meaning to a previously ignored key/value pair.

_originOnly example_

```javascript
function listener (e) { console.log(arguments); }

//attach a listener with originOnly
a.attach('test', { originOnly: true }, listener);

a.invoke('test'); //this will cause 'listener' to be called

//setup another object with 'a' as its event parent
var b = {};
flexEvents.setup(b, a);

//invoking the same event on 'b' will not cause 'listener' to be called because originOnly is true
b.invoke('test');
```

### detach

Detaches an event listener.

`.detach( eventName [ [, options], callback] )`

* `eventName` `{String}`  : The name of the event.
* `options` `{Object} [optional]` : Same syntax as described in the [attach method](#attach). Think of this as an additional search parameter. When provided, not only will the `callback` have to match, but the options values must match in order to successfully detach a listener.
* `callback` `{Function} [optional]` : If provided, zero or one event listeners are removed depending on if a listener is found matching this callback function. If multiple listeners share the same callback, only the oldest matching listener will be detached. If `callback` is not provided, all listeners matching `eventName` will be removed.

When `callback` is provided, the function returns true if an event listener was removed, otherwise false. When `callback` is not provided, the function's output is the same as the [hasEvent](#hasevent) method.

### hasEvent

Checks to see if an event is registered on an object. This method may be useful when operating in the [strict](#strict) configuration mode.

`.hasEvent( eventName )`

Returns true if the event is registered on the object, otherwise false.

### invoke

Invokes (aka emits/triggers) an event. 

`.invoke( eventName [, arg1 [, arg2 [, ..., argN]]] )`

* `eventName` `{String}` : The name of the event to invoke.
* `arg1-argN` `[optional]` : Additional arguments of any type can be passed to invoke, which will be, in turn, passed to all listener callbacks in the same order.

`invoke` is disabled when [arbitraryInvoke](#arbitraryinvoke) is false.

### register

> _method is private by default_

Registers an event on an object. Calling register directly is typically unnecessary unless [strict](#strict) is set to true, or [arbitraryInvoke](#arbitraryinvoke) is false.

`.register( eventName )`

Returns a function which is a shortcut for invoking this event. See the [Private Invocation](#private-invocation) example.

### registerList

> _method is private by default_

Registers multiple events at once. This method accepts any combination of array(s) and string(s). It may be of particular value when [strict](#strict) is true.

```javascript
// example
obj.registerList('eventOne', [ 'eventTwo', 'eventThree' ], 'eventFour', 'eventFive');
```

This method returns nothing, which is why it is disabled when [arbitraryInvoke](#arbitraryinvoke) is false, since there would be no way to invoke the registered events.

### deregister

> _method is private by default_

Deregisters an event.

`.deregister( eventName )`

It should be very rare to need this method, and, should you decide to use it, you may find its usage to be counter-intuitive. Calling `deregister` does not _necessarily_ remove event listeners, nor cause [hasEvent](#hasevent) to return false, nor prevent [attach](#attach) from being called for this `eventName` in [strict](#strict) mode. This is possible because of events which bubble up from children. When an event is registered on an object, it becomes implicitly registered on all objects in its parent chain. However, if no children have `eventName` registered, or when `.deregister(eventName)` is called on those children, then all listeners will be removed and the event will be fully deregistered as expected.

### destroy

> _method is private by default_

Essentially reverses the [setup](#setup-method) process by cleaning up all public methods appended onto the object and removing references which would prevent garbage collection from reclaiming the object. In a large application, it is **very important** to call `destroy` when the object is no longer needed.

`.destroy()`

## Event Invocation Object

The first argument to listener callbacks is an `EventInvocation` object. For the examples below, we'll assume this argument is labeled `e`. It contains the following members:

### orign

`e.origin` `{Object}` A reference to the object which invoked the event.

### obj

`e.obj` `{Object}` A reference to the object being listened on. `obj` will be different from `origin` when the listener is called as the result of event bubbling. In other words, you can use `if (e.origin === e.obj)` to check whether the event originated on the object you attached to, or one of its children.

### options

`e.options` `{Object}` The [options](#options-syntax) object supplied to the [attach](#attach) method. If no options argument was supplied, `e.options` will be an empty object `{}`.

### stop

`e.stop()` Prevents any further event listeners from being called for this event invocation. Similar to [event.stopImmediatePropagation](https://developer.mozilla.org/en-US/docs/DOM/event.stopImmediatePropagation) in DOM events.

See the [Controlling Event Propagation](#controlling-propagation) example.

### stopBubble

`e.stopBubble()` Stops the event from bubbling up any further, however, any remaining listeners on `e.obj` will still be called. Similar to [event.stopPropagation](https://developer.mozilla.org/en-US/docs/DOM/event.stopPropagation) in DOM events.

### pause

`e.pause()` Pause is provided to allow asynchronous propagation. After calling `pause`, event propagation will not continue until [resume](#resume) is called. See the [Asynchronous Propagation](#asynchronous-propagation) example.

### resume

`e.resume()` Resume is the counterpart to [pause](#pause). It can be important to understand that when calling `resume` synchronously, it behaves as if it is asynchronous, and when calling `resume` asynchronously, it behaves synchronously. This is hard to explain, so I'll illustrate by example:

Assume this simple script:

```javascript
var a = {};
flexEvents.setup(a);

a.attach('test', callback); // we'll define two different versions of callback below
a.attach('test', function (e) { console.log("second callback done"); });

a.invoke('test');
```

###### callback example 1 (synchronous resume)

```javascript
function callback (e) {
    e.pause();
    e.resume(); // resume called synchronously relative to the listener callback.
    console.log('first callback done'); // this will execute before any more event listeners are called.
}

/* Output
first callback done
second callback done
*/
```

###### callback example 2 (asynchronous resume)

```javascript
function callback (e) {
    e.pause();
    setTimeout(function () {
        // calling resume asynchronously, relative to the listener callback, causes event propagation to resume synchronously.
        e.resume();
        console.log('first callback done'); // further event listeners will have executed before reaching this line.
    }, 500 /* ms */);
}

/* Output
second callback done
first callback done
*/
```

See also the [Asynchronous Propagation](#asynchronous-propagation) example.

## Advanced Examples

Each of these examples can be found in the `examples` directory. They are setup to be run as node.js scripts.

### Private Invocation

Sometimes you may want to prevent `.invoke('anyRandomEvent')` from happening. You could use [strict](#strict), but a safer way may be to use private invocation with [arbitraryInvoke](#arbitraryinvoke) disabled.

```javascript
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
```

Output
```
data
```

### Events List

If you'd like to establish a fixed list of events which your system supports (maybe you want a centralized list, or maybe it's just to prevent typos), you can do this using the [arbitraryEvents](#arbitraryevents) and [eventList](#eventlist) settings.

```javascript
flexEvents.configure({ arbitraryEvents: false, eventList: [ 'EVENT_1', 'EVENT_2' ], errorHandler: console.log });

var a = {};
flexEvents.setup(a);

a.invoke('EVENT_2'); // <-- this will succeed
a.invoke('EVENT_3'); // <-- this will fail because EVENT_3 is not in the eventList
```

Output
```
[Error: Arbitrary Events are disabled. EVENT_3 is not on the event list.]
```

### Strict Mode

When [strict](#strict) is enabled, events cannot be attached, detached, or invoked unless they are explicitly registered first.

```javascript
flexEvents.configure({ strict: true, errorHandler: console.log, methods: { register: "register" } });

var a = {};
flexEvents.setup(a);

a.attach('test', function () { console.log(arguments); }); // <-- this will fail because 'test' has not been registered.

// register the event (note: 'register' is not normally a public method, notice the above configure statement)
a.register('test');

a.attach('test', function () { console.log(arguments); }); // <-- this will succeed because 'test' has now been registered.
```

Output
```
[Error: Events are configured with strict enabled, and test is not a registered event on this object.]
```

### Custom Method Names

By default, [attach](#attach), [detach](#detach), [hasEvent](#hasevent), and [invoke](#invoke) are publicly appended to each object initialized using [setup](#setup-method). However, any method listed under [Event Methods](#event-methods) can be made automatically public or private, and you can even rename them.

**Important:** Changing the accessibility or name of a method only affects how and what is publicly appended to the object. It does NOT effect the object returned by [setup](#setup-method), which will always have the full set of methods with the default names.

In the example below, we will override some of the [defaults](#default-configuration) by:
* renaming `attach` to `on`
* making `detach` a private method
* making `register` a public method

```javascript
flexEvents.configure({ methods: { attach: 'on', detach: false, register: 'register' } });

var a = {};
flexEvents.setup(a);

a.on('test', function (e, arg1) { console.log(arg1); });
a.invoke('test', 'renaming "attach" worked');

// a.detach('test'); // <-- this would crash because we made detach private

a.register('test2'); // <-- this will succeed because we made register public
```

Output
```
renaming "attach" worked
```

### Controlling Event Propagation

As long as [bubble](#bubble) is enabled, event propagation normally occurs as follows:

1. For a given `eventName`, all event listeners on a particular object are called in the order they were added.
2. The event bubbles to the object's parent and the process repeats until there are no parents remaining in the bubble chain.

The `flexEvents` object is always the last parent in the bubble chain.

This propagation can be interrupted by calling [e.stop](#stop) or [e.stopBubble](#stopbubble).

```javascript
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
```

Output
```
zzz c
zzz b1

yyy c
yyy b1
yyy b2
```

### Asynchronous Propagation

Sometimes an event callback needs to make some asynchronous calls, and perhaps you want to make the decision about whether to stop propagation based on the outcome of those asynchronous calls. This is what [pause](#pause) and [resume](#resume) are designed for.

```javascript
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
```

Output
```
reading file
done reading
second listener
```

Output if `e.pause();` is commented out
```
reading file
second listener
done reading
```

### Object Configuration

Sometimes it may be desirable to override global configuration settings on individual objects. This can be accomplished using the third parameter of the [setup](#setup-method) method.

```javascript
flexEvents.configure({ arbitraryEvents: false, eventList: [ 'EVENT_1', 'EVENT_2' ], errorHandler: console.log });

var a = {};
flexEvents.setup(a);
a.invoke('test'); // <-- this will fail because arbitraryEvents is false and 'test' is not in the eventList.

var b = {};
flexEvents.setup(b, null, { arbitraryEvents: true }); // override arbitraryEvents for this object only
b.invoke('test'); // <-- this will succeed because arbitraryEvents were re-enabled on this object
```

Output
```
[Error: Arbitrary Events are disabled. test is not on the event list.]
```

## Implementation Notes

There are a few last uncommon or non-obvious scenarios which should be addressed.

##### Passing a non-events-enabled object as the `parent` argument in [setup](#setup-method)

Consider this scenario:

```javascript
var a = { data: 'test' };

var b = {};
flexEvents.setup(b, a); // pass 'a' as the event parent, event though it is not events-enabled
```

The above example will not cause an error. The bubble parent for `b` will implicitly become the global `flexEvents` object. If we later call `flexEvents.setup(a)`, the bubble chain will now work as intended. However, it is **very important** to recognize that `flexEvents` holds an explicit reference to `a` in a "missing parents" collection until `flexEvents.setup(a)` is called. This will prevent `a` from being eligible for garbage collection, even if `b.destroy()` is called.

So, the moral of the story: don't pass in a parent which you don't intend to setup events on.

##### Configuring public methods on the `flexEvents` object

As previously discussed [here](#methods) and [here](#custom-method-names), you can decide which [event methods](#event-methods) you would like to be public, and even what to name them. As you should know by now, the global `flexEvents` object is, itself, events-enabled, and therefore it should be possible to adjust its public methods as well. However, since `flexEvents.setup(flexEvents)` is called internally, we can't pass a custom config object, and all of the public methods are already setup before we could ever have a chance to adjust the global configuration.

To work around this, you can override the default [methods](#methods) configuration in the first call to [configure](#configure-method). In addition to updating the global configuration, those changes will take effect on the `flexEvents` object. However, further calls to `configure` will only update the global config, and not the `flexEvents` object. This behavior is provided because you might want the configuration on the `flexEvents` object to be different from the global configuration.

There are two unique behaviors which are notable in this scenario:

* [destroy](#destroy) cannot be made public. `methods:{destroy:'destroy'}` will affect the global configuration, but will be ignored in regards to the `flexEvents` object.
* [setup](#setup-method) and [configure](#configure-method) can be renamed (or even removed, although removing `setup` is probably a bad idea).

In this example, we will rename `setup` to `init` and make the `invoke` method public for all objects except `flexEvents`:

```javascript
// rename 'setup' and disable 'invoke' on the flexEvents object
flexEvents.configure({ methods: { setup: 'init', invoke: false } });

// re-enable the 'invoke' method globally
flexEvents.configure({ methods: { invoke: 'invoke' } });

flexEvents.attach('test', function () { console.log('test'); });

var a = {};
flexEvents.init(a); // we renamed 'setup' to 'init', so we have to use that instead

a.invoke('test'); // <-- this will succeed because we re-enabled 'invoke' publicly

//flexEvents.invoke('test'); // <-- this would crash because 'invoke' was disabled in the first call to configure
```

Output
```
test
```