import { exposeMongoLivedata } from "./mongo-livedata";
import { isInstalled } from "./utils";

const isFibersInstalled = isInstalled("fibers");

/**
 * @namespace MeteorX
 */
MeteorX = {};

MeteorX._readyCallbacks = [];
MeteorX._ready = false;
MeteorX._isFibersInstalled = isFibersInstalled;

MeteorX.onReady = function(cb) {
  if (MeteorX._ready) {
    return runWithAFiber(cb);
  }

  this._readyCallbacks.push(cb);
};

MeteorX.Server = Meteor.server.constructor;


exposeLivedata(MeteorX);

// before using any other MeteorX apis we need to hijack Mongo related code
// that'w what we are doing here.
Meteor.startup(function() {
  runWithAFiber(function() {
    exposeMongoLivedata(MeteorX);
  });

  MeteorX._readyCallbacks.forEach(function(fn) {
    runWithAFiber(fn);
  });
  MeteorX._ready = true;
});

function runWithAFiber(cb) {
  if (!isFibersInstalled) {
    cb();
    return;
  }

  const Fibers = Npm.require("fibers");

  if (Fibers.current) {
    cb();
  } else {
    new Fiber(cb).run();
  }
}
