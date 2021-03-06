'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sagaMiddlewareFactory;

var _utils = require('./utils');

var _proc = require('./proc');

var _proc2 = _interopRequireDefault(_proc);

var _channel = require('./channel');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function sagaMiddlewareFactory() {
  var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var runSagaDynamically = void 0;

  if (_utils.is.func(options)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Saga middleware no longer accept Generator functions. Use sagaMiddleware.run instead');
    } else {
      throw new Error('You passed a function to the Saga middleware. You are likely trying to start a        Saga by directly passing it to the middleware. This is no longer possible starting from 0.10.0.        To run a Saga, you must do it dynamically AFTER mounting the middleware into the store.\n        Example:\n          import createSagaMiddleware from \'redux-saga\'\n          ... other imports\n\n          const sagaMiddleware = createSagaMiddleware()\n          const store = createStore(reducer, applyMiddleware(sagaMiddleware))\n          sagaMiddleware.run(saga, ...args)\n      ');
    }
  }

  if (options.logger && !_utils.is.func(options.logger)) {
    throw new Error('`options.logger` passed to the Saga middleware is not a function!');
  }

  function sagaMiddleware(_ref) {
    var getState = _ref.getState;
    var dispatch = _ref.dispatch;

    runSagaDynamically = runSaga;
    var sagaEmitter = (0, _channel.emitter)();

    function runSaga(saga) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return (0, _proc2.default)(saga.apply(undefined, args), sagaEmitter.subscribe, dispatch, getState, options, 0, saga.name);
    }

    return function (next) {
      return function (action) {
        var result = next(action); // hit reducers
        sagaEmitter.emit(action);
        return result;
      };
    };
  }

  sagaMiddleware.run = function (saga) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    (0, _utils.check)(runSagaDynamically, _utils.is.notUndef, 'Before running a Saga, you must mount the Saga middleware on the Store using applyMiddleware');
    (0, _utils.check)(saga, _utils.is.func, 'sagaMiddleware.run(saga, ...args): saga argument must be a Generator function!');
    return runSagaDynamically.apply(undefined, [saga].concat(args));
  };

  return sagaMiddleware;
}