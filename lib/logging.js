const term = require('terminal-kit').terminal

const logger = exports

logger.levels = ['error', 'warn', 'info', 'debug']
logger.logLevel = 'warn'

/**
 * Set the log level
 *
 * logger.setLevel('info')
 *
 */
logger.setLevel = function (level) {
  if (logger.levels.indexOf(level) === -1) {
    throw new Error(`Log level must be one of ${logger.levels}`)
  }
  logger.logLevel = level
}

/**
 * Main log function, takes a log level and messages
 *
 * logger.log('error', 'Error: something went wrong', error.toString())
 */
logger.log = function () {
  const level = arguments[0]
  let messages = Array.prototype.slice.call(arguments, 1)

  const levels = logger.levels
  if (levels.indexOf(level) <= levels.indexOf(logger.logLevel) ) {
    messages = messages.map( m => {
      if (typeof m !== 'string') {
        return JSON.stringify(m)
      }
      return m
    })

    let message = messages.join(' ')
    if (level === 'error' || level === 'warn') {
      message = level + ': ' + message
    }

    const output = {
      error: term.bold.red,
      warn: term.yellow,
      debug: term.dim.white,
      info: term.dim.white,
    }[level] || term

    output(message + '\n')
  }
}

/**
 * Shortcut log functions for each log level
 *
 * logger.debug('response returned', resp)
 */
logger.levels.forEach( (level) => {
  logger[level] = function () {
    const args = Array.prototype.slice.call(arguments, 0)
    args.unshift(level)
    logger.log.apply(logger, args)
  }
})
