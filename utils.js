exports.resolve = function resolve(name) {
  if (!name) return [];
  return name.split(/[\.\[\]]/);
};

exports.nested = function nested(name, state) {
  var segments = exports.resolve(name);
  // fast
  if (segments.length === 1) return { key: name, state: state };
  var s = state, property = name;
  // slower
  segments.every(function (seg, i) {
    if (!s[seg] || i === segments.length) return false;
    s = s[seg];
    property = seg;
  });
  return { key: property, state: s };
};

exports.fill = function fill(name, state) {
  var segments = exports.resolve(name);
  // fast
  if (segments.length === 1) return { key: name, state: state };
  var s = state, property = name;
  // slower
  segments.forEach(function (seg, i) {
    s[seg] = s[seg] || {};
    if (i < segments.length) {
      s = s[seg];
      property = seg;
    }
  });
  return { key: property, state: s };
};

exports.meltdown = function meltdown(name, state) {
  var segments = exports.resolve(name);
  var names = [];
  while (segments.length > 0) {
    names.push(segments.join('.'));
    segments.pop();
  }
  return names;
};
