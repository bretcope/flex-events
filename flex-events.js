/*

flex-events

LICENSE (MIT):

Copyright (c) 2013 Atlantis Flight Development, Bret Copeland (except where indicated).

Permission is hereby granted, free of charge, to any person obtaining a copy of 
this software and associated documentation files (the "Software"), to deal in 
the Software without restriction, including without limitation the rights to 
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of 
the Software, and to permit persons to whom the Software is furnished to do so, 
subject to the following conditions:
 
The above copyright notice and this permission notice shall be included in all 
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS 
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER 
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

/***************************************************************
 * Browser Compatibility Methods
 ***************************************************************/

if (!Function.prototype.bind)
{
	Function.prototype.bind = function (scope)
	{
		var func = this;
		var args = Array.prototype.slice.call(arguments, 1);
		
		return function ()
		{
			args = Array.prototype.concat.apply(args, Array.prototype.slice.call(arguments));
			func.apply(scope, args);
		};
	};
}

if (!Array.prototype.indexOf)
{
	// indexOf implementation copied from: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf
	// (c) 2005 - 2013 Mozilla Developer Network and individual contributors
	Array.prototype.indexOf = function (searchElement /*, fromIndex */ )
	{
		"use strict";
		if (this == null)
			throw new TypeError();
		
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0)
			return -1;
		
		var n = 0;
		if (arguments.length > 1)
		{
			n = Number(arguments[1]);
			if (n != n) // shortcut for verifying if it's NaN
				n = 0;
			else if (n != 0 && n != Infinity && n != -Infinity)
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}
		
		if (n >= len)
			return -1;
		
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++)
		{
			if (k in t && t[k] === searchElement)
				return k;
		}
		return -1;
	};
	
	// lastIndexOf implementation from: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/lastIndexOf
	// (c) 2005 - 2013 Mozilla Developer Network and individual contributors
	Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/)
	{
		"use strict";
		
		if (this == null)
			throw new TypeError();
		
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0)
			return -1;
		
		var n = len;
		if (arguments.length > 1)
		{
			n = Number(arguments[1]);
			if (n != n)
				n = 0;
			else if (n != 0 && n != (1 / 0) && n != -(1 / 0))
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
		}
		
		var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
		
		for (; k >= 0; k--)
		{
			if (k in t && t[k] === searchElement)
				return k;
		}
		return -1;
	};
}

/***************************************************************
 * Global Events Object
 ***************************************************************/

var flexEvents = new function ()
{
	var _this = this;
	var _managers = [];
	var _missingParents = [];
	
	var _globalManager;
	
	var _setupCalled = false;
	var _configureCalled = false;

	/***************************************************************
	 * Configuration
	 ***************************************************************/
	
	//default config
	var _config =
	{
		arbitraryEvents: true,	// If true, any string can be passed as an event name. If false, eventList must be an array of strings, and each event name will be checked for its existence in the list.
		arbitraryInvoke: true,	// If false, events can only be invoked using the function returned by register. invoke and registerList methods will be disabled.
		eventList: null,		// An array of event names/
		strict: false,			// If true, only events which have been added to an object can be listened for or invoked.
		methods: { attach: "attach", detach: "detach", hasEvent: "hasEvent", invoke: "invoke", register: false, registerList: false, deregister: false, destroy: false },
		errorHandler: null,
		warningHandler: null,
		bubble: true
	};
	
	function mergeConfig (original, config)
	{
		if (!config)
			return original;
		
		var mod = {};
		
		for (var i in original)
		{
			if (i in config)
			{
				if (i === 'methods')
					mod[i] = mergeConfig(original[i], config[i]);
				else
					mod[i] = config[i];
			}
			else
			{
				mod[i] = original[i];
			}
		}
		
		return mod;
	}

	/***************************************************************
	 * Private Helper Functions
	 ***************************************************************/
	
	function compareObjects (a, b)
	{
		for (var i in a)
		{
			if (a[i] !== b[i])
				return false;
		}
		
		// this is not efficient to loop twice, but it's the only way I know which will support backward compatibility with all browsers.
		// might revisit this later.
		for (i in b)
		{
			if (a[i] !== b[i])
				return false;
		}
		
		return true;
	}

	/***************************************************************
	 * Public Methods
	 ***************************************************************/
	
	this.configure = function (config)
	{
		if (_setupCalled)
		{
			_globalManager.createError('The configure method cannot be called after setup.');
		}
		else
		{
			if (!_configureCalled && config && config.methods)
			{
				var name;
				for (var m in config.methods)
				{
					name = config.methods[m];
					switch (m)
					{
						case 'destroy':
							continue;
						case 'setup':
						case 'configure':
							if (name)
								_this[name] = _this[m];
							delete _this[m];
							break;
						default:
							if (m in _this)
								delete _this[m];
							if (name)
								_this[name] = _globalManager.eventMethods[m];
							break;
					}
				}
			}
			
			_config = mergeConfig(_config, config);
			_configureCalled = true;
		}
	};
	
	this.setup = function (obj, parent, config)
	{
		_setupCalled = true;
		return new EventsManager(obj, parent, config).eventMethods;
	};

	/***************************************************************
	 * EventsMethods Class
	 ***************************************************************/
	
	function EventsMethods (mgr)
	{
		var methods = mgr.getConfig('methods');
		var arbitraryInvoke = mgr.getConfig('arbitraryInvoke');
		
		for (var m in methods)
		{
			if (!arbitraryInvoke && (m === 'registerList' || m === 'invoke')) // if arbitrary invoke is not enabled, we don't need these methods.
				continue;
			
			this[m] = mgr[m].bind(mgr); // need to call bind, otherwise the correct context can be lost when reassigned.
			
			if (m === 'destroy')
				this[m] = createUndo(this[m]);
			
			if (methods[m])
				mgr.obj[methods[m]] = this[m]; // this makes the method public on the object
		}
		
		function createUndo (destroy)
		{
			return function ()
			{
				//undo all public functions created on the object.
				for (var m in methods)
				{
					if (!arbitraryInvoke && (m === 'registerList' || m === 'invoke')) // if arbitrary invoke is not enabled, we don't need these methods.
						continue;
					
					if (methods[m])
						delete mgr.obj[methods[m]];
				}
				
				return destroy();
			};
		}
	}

	/***************************************************************
	 * EventsManager Class
	 ***************************************************************/
	
	function EventsManager (obj, parent, config)
	{
		this.id = _managers.push(this) - 1;
		this.config = config;
		this.obj = obj;
		this.events = {};
		
		obj.__flexEvents = true;
		
		var i;
		
		//try to locate our own parent
		this.parentIndex = -1;
		if (parent)
		{
			for (i in _managers)
			{
				if (_managers[i].obj === parent)
				{
					this.parentIndex = i;
					break;
				}
			}
			
			if (this.parentIndex === -1)
			{
				this.createError('Event parent has not been setup for events.');
				_missingParents.push({ parent: parent, childMgr: this });
			}
		}
		
		// check to see if this is the missing parent for any object(s)
		var mgr, bubble;
		for (i = 0; i < _missingParents.length; i++)
		{
			if (_missingParents[i].parent === obj)
			{
				mgr = _missingParents[i].childMgr;
				mgr.parentIndex = this.id;
				
				// propagate existing events
				bubble = mgr.getConfig('bubble');
				for (var e in mgr.events)
				{
					if (mgr.events[e].explicit)
						this.registerInternal(e, false, mgr.id);
					
					for (var b in mgr.events[e].fromBubble)
					{
						this.registerInternal(e, false, mgr.events[e].fromBubble[b]);
					}
				}
				
				_missingParents.splice(i, 1);
				i--;
			}
		}
		
		this.eventMethods = new EventsMethods(this);
	}
	
	EventsManager.prototype.attach = function (event, options, callback)
	{
		if (!this.validateRegistered(event, true))
			return;
		
		if (arguments.length < 3)
		{
			callback = options;
			options = {};
		}
		
		this.events[event].listeners.push({ callback: callback, options: options }); // this doesn't check for duplicates, I'll leave that up to the user's implementation.
	};
	
	EventsManager.prototype.createError = function (text, important)
	{
		var handler = this.getConfig(important ? 'errorHandler' : 'warningHandler');
		var error = new Error(text);
		
		if (handler)
			handler(error);
		else if (important) // if it's important, but we don't have an error handler, then throw the error.
			throw error;
	};
	
	EventsManager.prototype.deregister = function (event)
	{
		this.deregisterInternal(event, this.id);
	};
	
	EventsManager.prototype.deregisterInternal = function (event, id)
	{
		if (this.validateRegistered(event) !== 2)
			return;
		
		if (id === this.id)
		{
			this.events[event].explicit = false;
			
			var mgr = this;
			while (mgr = mgr.getParentManager())
			{
				mgr.deregisterInternal(event, id);
			}
		}
		else
		{
			var dex = this.events[event].fromBubble.indexOf(id);
			
			if (dex !== -1)
				this.events[event].fromBubble.splice(dex, 1);
		}
		
		// if the event is not explicit, and not bubbling up from any children, then we can delete it entirely.
		if (!this.events[event].explicit && !this.events[event].fromBubble.length)
		{
			delete this.events[event];
		}
	};
	
	EventsManager.prototype.destroy = function ()
	{
		delete this.obj.__flexEvents;
		_managers[this.id] = null;
		
		this.obj = null;
		
		for (var i in this.events)
		{
			this.deregister(i);
			delete this.events[i];
		}
	};
	
	EventsManager.prototype.detach = function (event, options, callback)
	{
		if (this.validateRegistered(event) !== 2)
			return false;
		
		if (arguments.length < 3)
		{
			callback = options;
			options = null;
		}
		
		if (!callback) // if no callback was provided, detach all listeners.
		{
			this.events[event].listeners = [];
			return true;
		}
		
		var listeners = this.events[event].listeners;
		for (var i in listeners)
		{
			if (listeners[i].callback === callback)
			{
				if (options)
				{
					if (!compareObjects(options, listeners[i].options))
						continue;
				}
				
				// listener found, now detach
				listeners.splice(i, 1);
				return true;
			}
		}
		
		return false; // listener was not found
	};
	
	EventsManager.prototype.hasEvent = function (event)
	{
		return event in this.events;
	};
	
	EventsManager.prototype.getConfig = function (key)
	{
		if (key === 'methods')
		{
			return this.config && this.config.methods ? mergeConfig(_config.methods, this.config.methods) : _config.methods;
		}
		
		return this.config && key in this.config ? this.config[key] : _config[key];
	};
	
	EventsManager.prototype.getParentManager = function ()
	{
		if (this.parentIndex !== -1)
		{
			var mgr = _managers[this.parentIndex];
			
			if (mgr)
				return mgr;
			
			this.parentIndex = -1;
		}
		
		return this === _globalManager ? null : _globalManager; // if there's no parent, return the global parent. If we are the global parent, return null.
	};
	
	EventsManager.prototype.invoke = function (event)
	{
		if (!this.validateRegistered(event, true))
			return false;
		
		var args = Array.prototype.slice.call(arguments);
		new EventInvocation(this, event, args);
		
		return true;
	};
	
	EventsManager.prototype.register = function (event)
	{
		return this.registerInternal(event, true);
	};
	
	EventsManager.prototype.registerInternal = function (event, explicit, bubbleId)
	{
		// we don't need to validate an event name when registering it on a parent
		if (typeof bubbleId === 'undefined' && !this.validateEventName(event))
			return false;
		
		if (event in this.events)
		{
			this.events[event].explicit = explicit || this.events[event].explicit;
		}
		else
		{
			this.events[event] = 
			{
				listeners: [],
				invoke: this.invoke.bind(this, event),
				explicit: explicit,
				fromBubble: []
			};
		}
		
		if (bubbleId === undefined)
		{
			if (this.getConfig('bubble'))
			{
				var mgr = this;
				while (mgr = mgr.getParentManager())
				{
					mgr.registerInternal(event, false, this.id);
				}
			}
		}
		else
		{
			if (this.events[event].fromBubble.indexOf(bubbleId) === -1)
				this.events[event].fromBubble.push(bubbleId);
		}
		
		return this.events[event].invoke;
	};
	
	EventsManager.prototype.registerList = function ()
	{
		var arg;
		for (var i = 0; i < arguments.length; i++)
		{
			arg = arguments[i];
			
			switch (typeof arg)
			{
				case 'string':
					this.registerInternal(arg, true);
					break;
				case 'object':
					if (arg) // in case for some crazy reason someone sends null as an argument.
					{
						for (var x in arg)
							this.registerInternal(arg[x], true);
					}
					break;
			}
		}
	};
	
	EventsManager.prototype.validateEventName = function (event)
	{
		if (!this.getConfig('arbitraryEvents'))
		{
			// if arbitrary events are disabled, we need make sure this event is on the list
			var list = this.getConfig('eventList');
			if (!list || list.indexOf(event) === -1)
			{
				this.createError('Arbitrary Events are disabled. ' + event + ' is not on the event list.', true);
				return false;
			}
		}
		
		return true;
	};
	
	EventsManager.prototype.validateRegistered = function (event, autoRegister)
	{
		if (event in this.events)
			return 2;
		
		if (this.getConfig('strict'))
		{
			this.createError('Events are configured with strict enabled, and ' + event + ' is not a registered event on this object.', true);
			return 0;
		}
		
		if (autoRegister)
			return this.register(event) ? 1 : 0;
		
		return 1;
	};

	/***************************************************************
	 * EventInvocation Class
	 ***************************************************************/
	
	function EventInvocation (mgr, event, args)
	{
		var _this = this;
		
		var _mgr = mgr;
		var _listenerIndex = 0;
		
		var _stop = false; // for breaking immediately
		var _continue = true; // for breaking at next level
		var _pause = false;
		var _running;
		
		this.origin = mgr.obj;
		this.obj = mgr.obj;
		
		args[0] = this; // the zero index is initially the same string as the event argument, so we just replace that.
		
		this.stop = function (continueLevel)
		{
			_stop = true;
		};
		
		this.stopBubble = function ()
		{
			_continue = false;
		};
		
		this.pause = function ()
		{
			_pause = true;
		};
		
		this.resume = function ()
		{
			_pause = false;
			
			if (!_running) // if resume is called asynchronously, we need to call run in order to resume.
				run();
		};
		
		// The run function is designed so that it can return on a pause, then be called again on a resume and pick up where it left off.
		// Be cautious when making changes to this function.
		var run = function ()
		{
			_running = true;
			
			var listeners;
			var l;
			do
			{
				listeners = _mgr.events[event].listeners;
				
				if (listeners)
				{
					_this.obj = _mgr.obj;
					
					while (_listenerIndex < listeners.length)
					{
						l = listeners[_listenerIndex];
						
						//check listener options for originOnly and bubbleOnly
						if ((!l.options.originOnly || _this.obj === _this.origin) &&
							(!l.options.bubbleOnly || _this.obj !== _this.origin))
						{
							// actually call the listener's callback here
							_this.options = l.options;
							l.callback.apply(null, args);
						}
						
						if (l.options.once)
							listeners.splice(_listenerIndex, 1);
						else
							_listenerIndex++;
						
						if (_stop)
							return;
						
						if (_pause)
						{
							_running = false;
							return;
						}
					}
				}
				
				_listenerIndex = 0;
			}
			while (_continue && (_mgr = _mgr.getParentManager()));
		};
		
		run();
	}

	/***************************************************************
	 * Initialization
	 ***************************************************************/
	
	this.setup(this);
	_setupCalled = false;
	_globalManager = _managers[0];
	
}();

// Node.js support.
if (typeof module !== 'undefined' && module.exports)
	module.exports = flexEvents;
