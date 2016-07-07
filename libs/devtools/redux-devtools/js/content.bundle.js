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
/******/ ({

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(16);


/***/ },

/***/ 14:
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

/***/ 16:
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

	var _syncOptions = __webpack_require__(14);

	var bg = void 0;

	if (!window.devToolsOptions) (0, _syncOptions.getOptionsFromBg)();

	function connect() {
	  // Connect to the background script
	  var name = 'tab';
	  if (window.devToolsExtensionID) {
	    bg = chrome.runtime.connect(window.devToolsExtensionID, { name: name });
	  } else {
	    bg = chrome.runtime.connect({ name: name });
	  }

	  // Relay background script messages to the page script
	  bg.onMessage.addListener(function (message) {
	    if (message.action) {
	      window.postMessage({
	        type: message.type,
	        payload: message.action,
	        state: message.state,
	        id: message.id,
	        source: '@devtools-extension'
	      }, '*');
	    } else if (message.options) {
	      (0, _syncOptions.injectOptions)(message.options);
	    } else {
	      window.postMessage({
	        type: message.type,
	        state: message.state,
	        id: message.id,
	        source: '@devtools-extension'
	      }, '*');
	    }
	  });
	}

	// Resend messages from the page to the background script
	window.addEventListener('message', function (event) {
	  if (!(0, _syncOptions.isAllowed)()) return;
	  if (!event || event.source !== window || _typeof(event.data) !== 'object') return;
	  var message = event.data;
	  if (message.source !== '@devtools-page') return;
	  if (message.type === 'DISCONNECT') {
	    if (bg) {
	      bg.disconnect();bg = undefined;
	    }
	    return;
	  }

	  try {
	    if (!bg) connect();
	    if (message.type === 'INIT_INSTANCE') bg.postMessage({ name: 'INIT_INSTANCE' });else bg.postMessage({ name: 'RELAY', message: message });
	  } catch (err) {
	    /* eslint-disable no-console */
	    if (false) console.error('Failed to send message', err);
	    /* eslint-enable no-console */
	  }
	}, false);

/***/ }

/******/ });