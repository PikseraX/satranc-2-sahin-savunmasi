const upstream = require('@expo/metro-config/babel-transformer');

exports.transform = (input) => {
  if (input.filename.endsWith('.html')) {
    return upstream.transform({
      ...input,
      src: 'module.exports = ' + JSON.stringify(input.src) + ';',
    });
  }

  return upstream.transform(input);
};
