var segmentsCache = {};
var bubbleCache = {};

exports.segmentsPattern = /[\.\[\]]/;

exports.clearCache = function clearCache() {
  segmentsCache = {};
  bubbleCache = {};
};

exports.resolve = function resolve(name, ns) {
  if (!name) return {};
  name = ns && !exports.endsWith(name, '.') ? name + '.' : name;
  if (segmentsCache[name]) return segmentsCache[name];

  var segments = name.split(exports.segmentsPattern);
  segmentsCache[name] = {
    namespace: segments.length > 1 ? segments.slice(0, segments.length - 1) : null,
    actionType: segments[segments.length - 1]
  };
  return segmentsCache[name];
};

exports.nested = function nested(name, state, ns) {
  var segments = exports.resolve(name, ns);
  if (!segments.namespace || name === '*') return state;

  var s = state;
  var found = segments.namespace.every(function (seg, i) {
    if (typeof s[seg] === 'undefined') return false;
    s = s[seg];
    return true;
  });
  return found ? s : null;
};

exports.nestedParent = function nestedParent(name, state, ns) {
  var segments = exports.resolve(name, ns);
  if (!segments.namespace) return {};

  var s = state, k = null;
  var found = segments.namespace.every(function (seg, i) {
    if (typeof s[seg] === 'undefined') return false;
    if (i < segments.namespace.length - 1) {
      s = s[seg];
    }
    k = seg;
    return true;
  });
  return found ? { state: s, key: k } : {};
};

exports.fill = function fill(name, state, ns) {
  var segments = exports.resolve(name, ns);
  if (!segments.namespace) return state;

  var s = state;
  segments.namespace.forEach(function (seg, i) {
    if (typeof s[seg] === 'undefined') s[seg] = {};
    s = s[seg];
  });
  return s;
};

exports.bubble = function bubble(name, state) {
  if (bubbleCache[name]) return bubbleCache[name];
  var names = [name];
  var ns = name;
  while (ns.search(exports.segmentsPattern) > 0) {
    ns = ns.substring(0, searchLast(ns, exports.segmentsPattern));
    names.push(ns);
  }
  if (name !== '*') names.push('*');
  bubbleCache[name] = names;
  return names;
};

function searchLast(str, regex) {
  var match = str.match(regex);
  return str.lastIndexOf(match[match.length - 1]);
}

exports.endsWith = function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};
