/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	module.exports = __webpack_require__(2);


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	// Electron: Not supported some chrome.* API

	window.isElectron = window.navigator && window.navigator.userAgent.indexOf('Electron') !== -1;

	// Background page only
	if (window.isElectron && location.pathname === '/_generated_background_page.html') {
	  chrome.runtime.onConnectExternal = {
	    addListener: function addListener() {}
	  };
	  chrome.runtime.onMessageExternal = {
	    addListener: function addListener() {}
	  };
	  chrome.notifications = {
	    onClicked: {
	      addListener: function addListener() {}
	    },
	    create: function create() {},
	    clear: function clear() {}
	  };
	}

	if (window.isElectron) {
	  chrome.storage.local = {
	    set: function set(obj, callback) {
	      Object.keys(obj).forEach(function (key) {
	        localStorage.setItem(key, obj[key]);
	      });
	      if (callback) {
	        callback();
	      }
	    },
	    get: function get(obj, callback) {
	      var result = {};
	      Object.keys(obj).forEach(function (key) {
	        result[key] = localStorage.getItem(key) || obj[key];
	      });
	      if (callback) {
	        callback(result);
	      }
	    }
	  };
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _createDevStore = __webpack_require__(3);

	var _createDevStore2 = _interopRequireDefault(_createDevStore);

	var _openWindow = __webpack_require__(4);

	var _openWindow2 = _interopRequireDefault(_openWindow);

	var _messaging = __webpack_require__(5);

	var _contextMenus = __webpack_require__(15);

	var _contextMenus2 = _interopRequireDefault(_contextMenus);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var store = (0, _createDevStore2.default)(_messaging.toContentScript);

	// Expose objects globally in order to use them from windows via chrome.runtime.getBackgroundPage
	window.store = store;
	window.store.instances = {};
	window.store.setInstance = function (instance) {
	  store.instance = instance;
	  if (instance && instance !== 'auto') store.liftedStore.setInstance(instance, true);
	};

	chrome.commands.onCommand.addListener(function (shortcut) {
	  (0, _openWindow2.default)(shortcut);
	});

	chrome.runtime.onInstalled.addListener(function () {
	  (0, _contextMenus2.default)();
	});

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.default = createDevStore;
	function createDevStore(onDispatch) {
	  var initialState = {
	    actionsById: {},
	    computedStates: [],
	    currentStateIndex: -1,
	    monitorState: {},
	    nextActionId: 0,
	    skippedActionIds: [],
	    stagedActionIds: []
	  };
	  var currentState = [];
	  var listeners = [];
	  var instance = void 0;

	  function getState(id) {
	    if (id) return currentState[id] || initialState;
	    if (instance) return currentState[instance] || initialState;
	    return initialState;
	  }

	  function getInitialState() {
	    return initialState;
	  }

	  function getInstance() {
	    return instance;
	  }

	  function update() {
	    listeners.forEach(function (listener) {
	      return listener();
	    });
	  }

	  function setState(state, id, onChanged) {
	    var isNew = !currentState[id];
	    if (isNew && onChanged) onChanged();
	    currentState[id] = state;
	    update();
	  }

	  function setInstance(id, toUpdate) {
	    instance = id;
	    if (toUpdate && instance && instance !== 'auto') update();
	  }

	  function deleteInstance(id) {
	    delete currentState[id];
	    instance = Object.keys(currentState)[0];
	    update();
	  }

	  function clear() {
	    currentState = [];
	  }

	  function dispatch(action) {
	    if (action.type === 'JUMP_TO_STATE') {
	      var state = getState();
	      onDispatch('DISPATCH', action, instance, state.computedStates[action.index].state);
	      setState(_extends({}, state, { currentStateIndex: action.index }), instance);
	    } else if (action.type[0] !== '@') onDispatch('DISPATCH', action, instance);
	    return action;
	  }

	  function dispatchAction(action) {
	    if (action && action.type) onDispatch('ACTION', action, instance);
	    return action;
	  }

	  function importState(state) {
	    onDispatch('IMPORT', undefined, instance, state);
	  }

	  function subscribe(listener) {
	    listeners.push(listener);

	    return function unsubscribe() {
	      var index = listeners.indexOf(listener);
	      listeners.splice(index, 1);
	    };
	  }

	  return {
	    dispatch: dispatchAction,
	    getState: getState,
	    subscribe: subscribe,
	    clear: clear,
	    liftedStore: {
	      dispatch: dispatch,
	      getInstance: getInstance,
	      getInitialState: getInitialState,
	      getState: getState,
	      setState: setState,
	      setInstance: setInstance,
	      deleteInstance: deleteInstance,
	      subscribe: subscribe,
	      importState: importState
	    }
	  };
	}
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.default = openDevToolsWindow;
	var windows = {};
	var lastPosition = null;

	function openDevToolsWindow(position) {
	  function popWindow(action, url, customOptions) {
	    function focusIfExist(callback) {
	      if (!windows[position]) {
	        callback();
	        lastPosition = position;
	      } else {
	        var _params = { focused: true };
	        if (lastPosition !== position && position !== 'devtools-panel') _params = _extends({}, _params, customOptions);
	        chrome.windows.update(windows[position], _params, function () {
	          lastPosition = null;
	          if (chrome.runtime.lastError) callback();
	        });
	      }
	    }

	    focusIfExist(function () {
	      var options = _extends({
	        type: 'popup'
	      }, customOptions);
	      if (action === 'open') {
	        options.url = chrome.extension.getURL(url + '#' + position.substr(position.indexOf('-') + 1));
	        chrome.windows.create(options, function (win) {
	          windows[position] = win.id;
	        });
	      }
	    });
	  }

	  var params = { left: 0, top: 0, width: 350, height: window.screen.availHeight };
	  var url = 'window.html';
	  switch (position) {
	    case 'devtools-right':
	      params.left = window.screen.availWidth - params.width;
	      break;
	    case 'devtools-bottom':
	      params.height = 300;
	      params.top = window.screen.availHeight - params.height;
	      params.width = window.screen.availWidth;
	      break;
	    case 'devtools-panel':
	      params.type = 'panel';
	      break;
	    case 'devtools-remote':
	      params = { width: 850, height: 600 };
	      url = 'remote.html';
	      break;
	  }
	  popWindow('open', url, params);
	}
	module.exports = exports['default'];

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	exports.toContentScript = toContentScript;

	var _updateState = __webpack_require__(6);

	var _updateState2 = _interopRequireDefault(_updateState);

	var _syncOptions = __webpack_require__(14);

	var _syncOptions2 = _interopRequireDefault(_syncOptions);

	var _openWindow = __webpack_require__(4);

	var _openWindow2 = _interopRequireDefault(_openWindow);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var panelConnections = {};
	var tabConnections = {};
	var monitorConnections = {};
	var instancesConn = {};
	var catchedErrors = {};
	var monitors = 0;
	var isMonitored = false;

	window.syncOptions = (0, _syncOptions2.default)(toAllTabs); // Used in the options page

	var naMessage = { type: 'NA' };

	function handleInstancesChanged(instance, name) {
	  window.store.instances[instance] = name || instance;
	}

	function updateMonitors() {
	  Object.keys(monitorConnections).forEach(function (id) {
	    monitorConnections[id].postMessage({ type: 'UPDATE' });
	  });
	}

	// Receive message from content script
	function messaging(request, sender, sendResponse) {
	  var tabId = sender.tab ? sender.tab.id : sender.id;
	  if (tabId) {
	    var _ret = function () {
	      if (request.type === 'GET_OPTIONS') {
	        window.syncOptions.get(function (options) {
	          sendResponse({ options: options });
	        });
	        return {
	          v: true
	        };
	      }
	      if (request.type === 'OPEN') {
	        var position = 'devtools-left';
	        if (['remote', 'panel', 'left', 'right', 'bottom'].indexOf(request.position) !== -1) position = 'devtools-' + request.position;
	        (0, _openWindow2.default)(position);
	        return {
	          v: true
	        };
	      }
	      if (request.type === 'ERROR') {
	        chrome.notifications.create('app-error', {
	          type: 'basic',
	          title: 'An error occurred in the app',
	          message: request.message,
	          iconUrl: 'img/logo/48x48.png',
	          isClickable: false
	        });
	        return {
	          v: true
	        };
	      }

	      if (!instancesConn[request.id]) instancesConn[request.id] = tabId;
	      var payload = (0, _updateState2.default)(window.store, request, handleInstancesChanged, window.store.instance);
	      if (!payload) return {
	          v: true
	        };

	      // Relay the message to the devTools panel
	      if (tabId in panelConnections) {
	        panelConnections[tabId].postMessage(request);
	      }

	      updateMonitors();

	      // Notify when errors occur in the app
	      window.syncOptions.get(function (options) {
	        if (!options.notifyErrors) return;
	        var computedState = payload.computedStates[payload.currentStateIndex];
	        if (!computedState) return;
	        var error = computedState.error;
	        if (error === 'Interrupted by an error up the chain') return;
	        if (error) {
	          chrome.notifications.create('redux-error', {
	            type: 'basic',
	            title: 'An error occurred in the reducer',
	            message: error,
	            iconUrl: 'img/logo/48x48.png',
	            isClickable: true
	          });
	          if (typeof window.store.id === 'number') {
	            // chrome.pageAction.setIcon({tabId: window.store.id, path: 'img/logo/error.png'});
	            catchedErrors.tab = window.store.id;
	          }
	        } else if (catchedErrors.last && typeof window.store.id === 'number' && catchedErrors.tab === window.store.id) {
	          chrome.pageAction.setIcon({ tabId: window.store.id, path: 'img/logo/38x38.png' });
	        }
	        catchedErrors.last = error;
	      });
	    }();

	    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	  }
	  return true;
	}

	function getId(port) {
	  return port.sender.tab ? port.sender.tab.id : port.sender.id;
	}

	function initInstance(port, id) {
	  if (typeof id === 'number') chrome.pageAction.show(id);
	  if (isMonitored) port.postMessage({ type: 'START' });
	}

	function onConnect(port) {
	  var connections = void 0;
	  var id = void 0;
	  var listener = void 0;
	  var disconnect = void 0;

	  if (port.name === 'tab') {
	    connections = tabConnections;id = getId(port);
	    listener = function listener(msg) {
	      if (msg.name === 'INIT_INSTANCE') initInstance(port, id);else if (msg.name === 'RELAY') messaging(msg.message, port.sender);
	    };
	    disconnect = function disconnect() {
	      port.onMessage.removeListener(listener);
	      if (panelConnections[id]) panelConnections[id].postMessage(naMessage);
	      delete tabConnections[id];
	      Object.keys(instancesConn).forEach(function (instance) {
	        if (instancesConn[instance] === id) {
	          window.store.liftedStore.deleteInstance(instance);
	          delete window.store.instances[instance];
	          delete instancesConn[instance];
	        }
	      });
	      updateMonitors();
	    };
	  } else if (port.name === 'monitor') {
	    connections = monitorConnections;id = getId(port);
	    monitors++;
	    monitorInstances(true);
	    disconnect = function disconnect() {
	      monitors--;
	      if (Object.getOwnPropertyNames(panelConnections).length === 0) {
	        monitorInstances(false);
	      }
	    };
	  } else {
	    connections = panelConnections;id = port.name;
	    monitorInstances(true);
	    if (id !== window.store.id) port.postMessage(naMessage);
	    disconnect = function disconnect() {
	      monitorInstances(false);
	    };
	  }

	  connections[id] = port;
	  if (listener) port.onMessage.addListener(listener);

	  port.onDisconnect.addListener(function () {
	    disconnect();
	    delete connections[id];
	  });
	}

	chrome.runtime.onConnect.addListener(onConnect);
	chrome.runtime.onConnectExternal.addListener(onConnect);
	chrome.runtime.onMessage.addListener(messaging);
	chrome.runtime.onMessageExternal.addListener(messaging);

	chrome.notifications.onClicked.addListener(function (id) {
	  chrome.notifications.clear(id);
	  if (id === 'redux-error') (0, _openWindow2.default)('devtools-right');
	});

	function toContentScript(type, action, id, state) {
	  var message = { type: type, action: action, state: state, id: id };
	  if (id in panelConnections) {
	    panelConnections[id].postMessage(message);
	  }
	  if (instancesConn[id] in tabConnections) {
	    tabConnections[instancesConn[id]].postMessage(message);
	  }
	}

	function toAllTabs(msg) {
	  Object.keys(tabConnections).forEach(function (id) {
	    tabConnections[id].postMessage(msg);
	  });
	}

	function monitorInstances(shouldMonitor) {
	  if (!shouldMonitor && monitors !== 0 || isMonitored === shouldMonitor) return;
	  toAllTabs({ type: shouldMonitor ? 'START' : 'STOP' });
	  if (!shouldMonitor) window.store.clear();
	  isMonitored = shouldMonitor;
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

	exports.default = updateState;

	var _parseJSON = __webpack_require__(7);

	var _parseJSON2 = _interopRequireDefault(_parseJSON);

	var _commitExcessActions = __webpack_require__(13);

	var _commitExcessActions2 = _interopRequireDefault(_commitExcessActions);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function recompute(previousLiftedState, storeState, action) {
	  var nextActionId = arguments.length <= 3 || arguments[3] === undefined ? 1 : arguments[3];
	  var isExcess = arguments[4];

	  var actionId = nextActionId - 1;
	  var liftedState = _extends({}, previousLiftedState);
	  liftedState.stagedActionIds = [].concat(_toConsumableArray(liftedState.stagedActionIds), [actionId]);
	  liftedState.actionsById = _extends({}, liftedState.actionsById);
	  if (action.type === 'PERFORM_ACTION') {
	    liftedState.actionsById[actionId] = action;
	  } else {
	    liftedState.actionsById[actionId] = {
	      action: action.action || action,
	      timestamp: action.timestamp,
	      type: 'PERFORM_ACTION'
	    };
	  }
	  liftedState.nextActionId = nextActionId;
	  liftedState.computedStates = [].concat(_toConsumableArray(liftedState.computedStates), [{ state: storeState }]);
	  liftedState.currentStateIndex++;

	  if (isExcess) (0, _commitExcessActions2.default)(liftedState);

	  return liftedState;
	}

	function updateState(store, request, onInstancesChanged, instance, sync) {
	  var payload = (0, _parseJSON2.default)(request.payload);
	  if (typeof payload === 'undefined') return null;

	  var newState = void 0;
	  var action = {};
	  if (request.action) action = (0, _parseJSON2.default)(request.action) || {};

	  if (!instance || instance === 'auto') store.liftedStore.setInstance(request.id);

	  switch (request.type) {
	    case 'INIT':
	      newState = recompute(store.liftedStore.getInitialState(), payload, { action: { type: '@@INIT' }, timestamp: action.timestamp });
	      break;
	    case 'ACTION':
	      var liftedState = store.liftedStore.getState(request.id);
	      newState = recompute(liftedState, payload, action, request.nextActionId || liftedState.nextActionId + 1, request.isExcess);
	      break;
	    case 'STATE':
	      newState = payload;
	      break;
	    default:
	      return null;
	  }

	  store.liftedStore.setState(newState, request.id, function () {
	    if (onInstancesChanged) onInstancesChanged(request.id, request.name);
	  });

	  if (sync && request.id === instance) sync(newState, instance);

	  return newState;
	}
	module.exports = exports['default'];

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = parseJSON;

	var _jsan = __webpack_require__(8);

	function parseJSON(data) {
	  if (typeof data !== 'string') return data;
	  try {
	    return (0, _jsan.parse)(data);
	  } catch (e) {
	    if (false) console.error(data + 'is not a valid JSON', e);
	    return undefined;
	  }
	}
	module.exports = exports['default'];

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(9);


/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	var cycle = __webpack_require__(10);

	exports.stringify = function stringify(value, replacer, space, _options) {

	  if (arguments.length < 4) {
	    try {
	      if (arguments.length === 1) {
	        return JSON.stringify(value);
	      } else {
	        return JSON.stringify.apply(JSON, arguments);
	      }
	    } catch (e) {}
	  }

	  var options = _options || false;
	  if (typeof options === 'boolean') {
	    options = {
	      'date': options,
	      'function': options,
	      'regex': options,
	      'undefined': options,
	      'error': options
	    }
	  }

	  var decycled = cycle.decycle(value, options, replacer);
	  if (arguments.length === 1) {
	    return JSON.stringify(decycled);
	  } else {
	    return JSON.stringify(decycled, replacer, space);
	  }

	}

	exports.parse = function parse(text, reviver) {
	  var needsRetrocycle = /"\$jsan"/.test(text);
	  var parsed;
	  if (arguments.length === 1) {
	    parsed = JSON.parse(text);
	  } else {
	    parsed = JSON.parse(text, reviver);
	  }
	  if (needsRetrocycle) {
	    parsed = cycle.retrocycle(parsed);
	  }
	  return parsed;
	}


/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var pathGetter = __webpack_require__(11);
	var utils = __webpack_require__(12);

	// Based on https://github.com/douglascrockford/JSON-js/blob/master/cycle.js

	exports.decycle = function decycle(object, options, replacer) {
	  'use strict';

	  var objects = [],   // Keep a reference to each unique object or array
	      paths = [];     // Keep the path to each unique object or array

	  return (function derez(_value, path, key) {

	    // The derez recurses through the object, producing the deep copy.

	    var i,          // The loop counter
	      name,       // Property name
	      nu;         // The new object or array

	    // typeof null === 'object', so go on if this value is really an object but not
	    // one of the weird builtin objects.

	    var value = replacer ? replacer(key || '', _value) : _value;

	    if (options.date && value instanceof Date) {
	      return {$jsan: 'd' + value.getTime()};
	    }
	    if (options.regex && value instanceof RegExp) {
	      return {$jsan: 'r' + utils.getRegexFlags(value) + ',' + value.source};
	    }
	    if (options['function'] && typeof value === 'function') {
	      return {$jsan: 'f' + utils.stringifyFunction(value, options['function'])}
	    }
	    if (options['undefined'] && value === undefined) {
	      return {$jsan: 'u'}
	    }
	    if (options['error'] && value instanceof Error) {
	      return {$jsan: 'e' + value.message}
	    }

	    if (value && value.toJSON) {
	      return value.toJSON();
	    }

	    if (typeof value === 'object' && value !== null &&
	      !(value instanceof Boolean) &&
	      !(value instanceof Date)    &&
	      !(value instanceof Number)  &&
	      !(value instanceof RegExp)  &&
	      !(value instanceof String)  &&
	      !(value instanceof Error)) {

	        // If the value is an object or array, look to see if we have already
	        // encountered it. If so, return a $ref/path object. This is a hard way,
	        // linear search that will get slower as the number of unique objects grows.

	      for (i = 0; i < objects.length; i += 1) {
	          if (objects[i] === value) {
	              return {$jsan: paths[i]};
	          }
	      }

	      // Otherwise, accumulate the unique value and its path.

	      objects.push(value);
	      paths.push(path);

	      // If it is an array, replicate the array.

	      if (Object.prototype.toString.apply(value) === '[object Array]') {
	          nu = [];
	          for (i = 0; i < value.length; i += 1) {
	              nu[i] = derez(value[i], path + '[' + i + ']', i);
	          }
	      } else {

	        // If it is an object, replicate the object.

	        nu = {};
	        for (name in value) {
	          if (Object.prototype.hasOwnProperty.call(value, name)) {
	            var nextPath = /^\w+$/.test(name) ?
	              '.' + name :
	              '[' + JSON.stringify(name) + ']';
	            nu[name] = name === '$jsan' ? [derez(value[name], path + nextPath)] : derez(value[name], path + nextPath, name);
	          }
	        }
	      }
	      return nu;
	    }
	    return value;
	  }(object, '$'));
	};


	exports.retrocycle = function retrocycle($) {
	  'use strict';


	  (function rez(value) {

	    // The rez function walks recursively through the object looking for $jsan
	    // properties. When it finds one that has a value that is a path, then it
	    // replaces the $jsan object with a reference to the value that is found by
	    // the path.

	    var i, item, name, path;

	    if (value && typeof value === 'object') {
	      if (Object.prototype.toString.apply(value) === '[object Array]') {
	        for (i = 0; i < value.length; i += 1) {
	          item = value[i];
	          if (item && typeof item === 'object') {
	            if (item.$jsan) {
	              value[i] = utils.restore(item.$jsan, $);
	            } else {
	              rez(item);
	            }
	          }
	        }
	      } else {
	        for (name in value) {
	          if (name === '$jsan') {
	            value[name] = value[name][0];
	          }
	          if (typeof value[name] === 'object') {
	            item = value[name];
	            if (item && typeof item === 'object') {
	              if (item.$jsan) {
	                value[name] = utils.restore(item.$jsan, $);
	              } else {
	                rez(item);
	              }
	            }
	          }
	        }
	      }
	    }
	  }($));
	  return $;
	};


/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = pathGetter;

	function pathGetter(obj, path) {
	  if (path !== '$') {
	    var paths = getPaths(path);
	    for (var i = 0; i < paths.length; i++) {
	      path = paths[i].toString().replace(/\\"/g, '"');
	      obj = obj[path];
	    }
	  }
	  return obj;
	}

	function getPaths(pathString) {
	  var regex = /(?:\.(\w+))|(?:\[(\d+)\])|(?:\["((?:[^\\"]|\\.)*)"\])/g;
	  var matches = [];
	  var match;
	  while (match = regex.exec(pathString)) {
	    matches.push( match[1] || match[2] || match[3] );
	  }
	  return matches;
	}


/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var pathGetter = __webpack_require__(11);

	exports.getRegexFlags = function getRegexFlags(regex) {
	  var flags = '';
	  if (regex.ignoreCase) flags += 'i';
	  if (regex.global) flags += 'g';
	  if (regex.multiline) flags += 'm';
	  return flags;
	};

	exports.stringifyFunction = function stringifyFunction(fn, customToString) {
	  if (typeof customToString === 'function') {
	    return customToString(fn);
	  }
	  var str = fn.toString();
	  var match = str.match(/^[^{]*{|^[^=]*=>/);
	  var start = match ? match[0] : '<function> ';
	  var end = str[str.length - 1] === '}' ? '}' : '';
	  return start.replace(/\r\n|\n/g, ' ').replace(/\s+/g, ' ') + ' /* ... */ ' + end;
	};

	exports.restore = function restore(obj, root) {
	  var type = obj[0];
	  var rest = obj.slice(1);
	  switch(type) {
	    case '$':
	      return pathGetter(root, obj);
	    case 'r':
	      var comma = rest.indexOf(',');
	      var flags = rest.slice(0, comma);
	      var source = rest.slice(comma + 1);
	      return RegExp(source, flags);
	    case 'd':
	      return new Date(+rest);
	    case 'f':
	      var fn = function() { throw new Error("can't run jsan parsed function") };
	      fn.toString = function() { return rest; };
	      return fn;
	    case 'u':
	      return undefined;
	    case 'e':
	      var error = new Error(rest);
	      error.stack = 'Stack is unavailable for jsan parsed errors';
	      return error;
	    default:
	      console.warn('unknown type', obj);
	      return obj;
	  }
	}


/***/ },
/* 13 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = commitExcessActions;

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	// Based on https://github.com/gaearon/redux-devtools/pull/241

	function commitExcessActions(liftedState) {
	  var n = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];

	  // Auto-commits n-number of excess actions.
	  var excess = n;
	  var idsToDelete = liftedState.stagedActionIds.slice(1, excess + 1);

	  for (var i = 0; i < idsToDelete.length; i++) {
	    if (liftedState.computedStates[i + 1].error) {
	      // Stop if error is found. Commit actions up to error.
	      excess = i;
	      idsToDelete = liftedState.stagedActionIds.slice(1, excess + 1);
	      break;
	    } else {
	      delete liftedState.actionsById[idsToDelete[i]];
	    }
	  }

	  liftedState.skippedActionIds = liftedState.skippedActionIds.filter(function (id) {
	    return idsToDelete.indexOf(id) === -1;
	  });
	  liftedState.stagedActionIds = [0].concat(_toConsumableArray(liftedState.stagedActionIds.slice(excess + 1)));
	  liftedState.committedState = liftedState.computedStates[excess].state;
	  liftedState.computedStates = liftedState.computedStates.slice(excess);
	  liftedState.currentStateIndex = liftedState.currentStateIndex > excess ? liftedState.currentStateIndex - excess : 0;
	}
	module.exports = exports['default'];

/***/ },
/* 14 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = syncOptions;
	var options = void 0;

	var save = function save(toAllTabs) {
	  return function (key, value) {
	    var obj = {};
	    obj[key] = value;
	    chrome.storage.sync.set(obj);
	    options[key] = value;
	    toAllTabs({ options: options });
	  };
	};

	var get = function get(callback) {
	  if (options) callback(options);else {
	    chrome.storage.sync.get({
	      maxAge: 50,
	      filter: false,
	      whitelist: '',
	      blacklist: '',
	      serialize: true,
	      notifyErrors: true,
	      inject: true,
	      urls: '^https?://localhost|0\\.0\\.0\\.0:\\d+\n^https?://.+\\.github\\.io'
	    }, function (items) {
	      options = items;
	      callback(items);
	    });
	  }
	};

	var toReg = function toReg(str) {
	  return str !== '' ? str.split('\n').join('|') : null;
	};

	var injectOptions = exports.injectOptions = function injectOptions(newOptions) {
	  if (!newOptions) return;
	  if (newOptions.filter) {
	    newOptions.whitelist = toReg(newOptions.whitelist);
	    newOptions.blacklist = toReg(newOptions.blacklist);
	  }

	  options = newOptions;
	  var s = document.createElement('script');
	  s.type = 'text/javascript';
	  s.appendChild(document.createTextNode('window.devToolsOptions = Object.assign(window.devToolsOptions||{},' + JSON.stringify(options) + ');'));
	  (document.head || document.documentElement).appendChild(s);
	  s.parentNode.removeChild(s);
	};

	var getOptionsFromBg = exports.getOptionsFromBg = function getOptionsFromBg() {
	  chrome.runtime.sendMessage({ type: 'GET_OPTIONS' }, function (response) {
	    if (response && response.options) injectOptions(response.options);
	  });
	};

	var isAllowed = exports.isAllowed = function isAllowed() {
	  var localOptions = arguments.length <= 0 || arguments[0] === undefined ? options : arguments[0];
	  return !localOptions || localOptions.inject || !localOptions.urls || location.href.match(toReg(localOptions.urls));
	};

	function syncOptions(toAllTabs) {
	  return {
	    save: save(toAllTabs),
	    get: get
	  };
	}

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.default = createMenu;

	var _openWindow = __webpack_require__(4);

	var _openWindow2 = _interopRequireDefault(_openWindow);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function createMenu() {
	  var menus = [{ id: 'devtools-left', title: 'To left' }, { id: 'devtools-right', title: 'To right' }, { id: 'devtools-bottom', title: 'To bottom' }, { id: 'devtools-panel', title: 'Open in a chrome panel (enable in Chrome settings)' }, { id: 'devtools-remote', title: 'Open Remote DevTools' }];

	  var shortcuts = {};
	  chrome.commands.getAll(function (commands) {
	    commands.forEach(function (_ref) {
	      var name = _ref.name;
	      var shortcut = _ref.shortcut;

	      shortcuts[name] = shortcut;
	    });
	  });

	  menus.forEach(function (_ref2) {
	    var id = _ref2.id;
	    var title = _ref2.title;

	    chrome.contextMenus.create({
	      id: id,
	      title: title + (shortcuts[id] ? ' (' + shortcuts[id] + ')' : ''),
	      contexts: ['all']
	    });
	  });
	}

	if (chrome.contextMenus) {
	  chrome.contextMenus.onClicked.addListener(function (_ref3) {
	    var menuItemId = _ref3.menuItemId;

	    (0, _openWindow2.default)(menuItemId);
	  });
	}
	module.exports = exports['default'];

/***/ }
/******/ ]);