var path = require('path')
  , fs = require('fs')

var through = require('through')

module.exports = json_stream

function json_stream(dir, _options, _extension) {
  var extension = _extension || '.json'
    , options = _options || {}
    , stream = through()
    , read

  if(options.limit === 0) return stream.queue(null)

  if(options.limit < 0) delete options.limit

  dir = path.normalize(dir)

  fs.readdir(dir, parse_files)

  return stream

  function parse_files(err, files) {
    if(options.reverse) files = files.reverse()

    files = files.sort().slice(0, options.limit)

    if(options.start || options.end) files = files.filter(filter_start_end)

    next()

    function stream_file(filename) {
      if(path.extname(filename) !== '.json') return next()

      if(options.values === false) {
        return fs.stat(path.join(dir, filename), stream_key)
      }

      fs.readFile(path.join(dir, filename), stream_key_value)

      function stream_key(err, stats) {
        if(err || !stats.isFile()) return next()

        stream.queue(just_name(filename))

        next()
      }

      function stream_key_value(err, data) {
        if(err) return next()

        var result
          , value

        try{
          value = JSON.parse('' + data)
        } catch(e) {
          next()
        }

        if(options.keys === false) {
          result = value
        } else {
          result = {
              key: just_name(filename)
            , value: value
          }
        }

        stream.queue(result)

        next()
      }
    }

    function next() {
      if(!files.length) return stream.queue(null)

      stream_file(files.shift())
    }
  }

  function filter_start_end(el) {
    var compare = path.basename(el, extension)

    if(options.start && options.start > compare) return false
    if(options.end && options.end < compare) return false

    return true
  }
}

function just_name(filename) {
  return path.basename(filename, path.extname(filename))
}
