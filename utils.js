var segmentsCache = {};
var meltdownCache = {};

exports.segmentsPattern = /[\.\[\]]/;

exports.resolve = function resolve(name) {
  if (!name) return {};
  if (segmentsCache[name]) return segmentsCache[name];

  var segments = name.split(exports.segmentsPattern);
  segmentsCache[name] = {
    namespace: segments.length > 1 ? segments.slice(0, segments.length - 1) : null,
    actionType: segments[segments.length - 1]
  };
  return segmentsCache[name];
};

exports.nested = function nested(name, state) {
  var segments = exports.resolve(name);
  if (!segments.namespace) return state;

  var s = state;
  var found = segments.namespace.every(function (seg, i) {
    if (!s[seg]) return false;
    s = s[seg];
  });
  return found ? s : null;
};

exports.fill = function fill(name, state) {
  var segments = exports.resolve(name);
  if (!segments.namespace) return state;

  var s = state;
  segments.namespace.forEach(function (seg, i) {
    s[seg] = s[seg] || {};
    s = s[seg];
  });
  return s;
};

exports.meltdown = function meltdown(name, state) {
  if (meltdownCache[name]) return meltdownCache[name];
  var names = [name];
  var ns = name;
  while (ns.search(exports.segmentsPattern) > 0) {
    ns = ns.substring(0, searchLast(ns, exports.segmentsPattern));
    names.push(ns);
  }
  meltdownCache[name] = names;
  return names;
};

function searchLast(str, regex) {
  var match = str.match(regex);
  return str.lastIndexOf(match[match.length - 1]);
}
