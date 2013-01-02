var exec = require('child_process').exec;

function parseIdentify(input) {
  var lines = input.split("\n"),
    prop = {},
    props = [],
    prevIndent = 0,
    indents = [],
    currentLine, 
    comps, 
    indent;

  lines.shift(); //drop first line (Image: name.jpg)

  for (var i = 0; i < lines.length; i++) {
    currentLine = lines[i];
    if (currentLine.length > 0) {
      indent = currentLine.search(/\S/);
      comps = currentLine.split(': ');
      if (indent > prevIndent){
        indents.push(indent);
      }
    
      while (indent < prevIndent && props.length) {
        indents.pop();
        prop = props.pop();
        prevIndent = indents[indents.length - 1];
      }
    
      if (comps.length < 2) {
        props.push(prop);
        prop = prop[currentLine.split(':')[0].trim().toLowerCase().replace(/\s/g, "_").replace(/\./g, "-")] = {};
      } else {
        prop[comps[0].trim().toLowerCase().replace(/\s/g, "_").replace(/\./g, "-")] = comps[1].trim()
      }
    
      prevIndent = indent;
    }
  }
  
  return prop;
};

var convert = function(args, fn) {
  var cmd = 'convert ' + args.join(' ');
  
  exec(cmd, function(err, stdout, stderr) {
    fn(err, stdout, stderr)
  })
};

function identify (src, fn) {
  var cmd = 'identify -verbose ' + src;

  exec(cmd, function(err, stdout, stderr) {
    if (!err) {
      var result, geometry;
      
      result = parseIdentify(stdout);
      geometry = result['geometry'].split(/x/);
      
      result.format = result.format.match(/\S*/)[0];
      result.width = parseInt(geometry[0]);
      result.height = parseInt(geometry[1]);
      result.depth = parseInt(result.depth);
      if (result.quality !== undefined) {
        result.quality = parseInt(result.quality);
      }
      
      fn(err, result);
    } else {
      fn(err);
    }
  })
}

var strip = function(src, dest, fn) {
  var args = [src, '-strip', dest];
  convert(args, function(err, stdout, stderr) {
    fn(err, stdout, stderr);
  })
};

var resize = function(src, dest, width, height, fn) {
  var args = [src, '-resize', width + 'x' + height, dest];
  convert(args, function(err, stdout, stderr) {
    fn(err, stdout, stderr);
  });
};

function crop (src, dest, width, height, x, y, fn) {
  var args = [src, '-crop', width + 'x' + height + '+' + x + '+' + y, dest];
  convert(args, function(err, stdout, stderr) {
    fn(err, stdout, stderr);
  });
}

module.exports = {
  convert: convert,
  identify: identify,
  strip: strip,
  resize: resize,
  crop: crop
}
