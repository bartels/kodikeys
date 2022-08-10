const { terminal } = require('terminal-kit')
const log = require('./logging')

/**
 * Map key names from terminal-kit to names that Kodi recognizes.
 */
const KEY_MAP = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '-': 'minus',
  '+': 'plus',
  '=': 'equals',
  '.': 'period',
  ',': 'comma',
  ' ': 'space',
  '\'': 'quote',
  '"': 'doublequote',
  '`': 'leftquote',
  '~': 'tilde',
  '_': 'underbar',
  '/': 'forwardslash',
  '\\': 'backslash',
  ';': 'semicolon',
  ':': 'colon',
  '[': 'opensquarebracket',
  ']': 'closesquarebracket',
  'page_up': 'pageup',
  'page_down': 'pagedown',
}

/**
 * Normalizes a key name from terminal-kit so it can be passed to Kodi
 *
 * @param {string} keyname - A keyname returned by terminal-kit
 * @returns {string} A normalized keyname that can be passed to Kodi
 */
function normalizeKeyName (keyname) {
  keyname = keyname.toLowerCase()

  // Handle modifiers
  // TODO: ctrl & alt modifiers are not actually working.
  // I haven't figured out a way to send them properly to Kodi's event server
  const mods = ['ctrl', 'alt']
  mods.forEach(mod => {
    keyname = keyname.replace(mod+'_', mod+'__')
  })

  // ALl keys pressed , including modifiers. The last element will be the main key
  const keys = keyname.split('__')
  const terminalKey = keys.pop()
  const normalizeKey = KEY_MAP[terminalKey] ?? terminalKey
  return [...keys, normalizeKey].join('-')
}

/**
 * Send a key to the event client
 *
 * @param event_client  An instance of XBMCEventClient that we'll send keyboard input to
 * @param {string} key = The key to send to Kodi
 */
function sendKey (event_client, key) {
  log.info('sending key:', key)

  event_client.keyPress(key, (err, bytes) => {
    if (err.length) {
      log.error(err)
    }
  })
}

/**
 * Holds state for input capturing
 */
const state = {
  paused: false,
  textInput: null,
}

/**
 * Pauses keyboard capture
 */
function pauseCapture () {
  state.paused = true
  log.debug('pausing capture')
}

/**
 * Resumes keyboard capture if previously paused
 */
function resumeCapture () {
  state.paused = false
  log.debug('resuming capture')
}

/**
 * Call to end text entry and resume normal keyboard capture
 */
function endTextEntry () {
  if (state.textInput) {
    state.textInput.abort()
    state.textInput = null
    resumeCapture()
  }
}

/**
 *
 * Pauses normal capture and begins a text entry, which can be sent to Kodi
 * json-rpc server (e.g. for sending searches to Kodi)
 *
 * @returns A promises that resolves to the text that the user typed.
 */
function startTextEntry () {
  pauseCapture()

  terminal.bold.yellow('\nKodi is requesting text input\n')
  terminal.bold('Enter text to send: ')

  return new Promise((resolve, reject) => {
    state.textInput = terminal.inputField((error, input) => {
      terminal('\n')
      if (error) {
        log.error(error)
        reject(error)
      }
      else {
        resolve(input)
      }
      endTextEntry()
    })
  })
}

/**
 * Begin capturing keyboard input and sending key presses to Kodi event server
 *
 * @param event_client  - An instance of XBMCEventClient that we'll send keyboard input to
 *
 * @returns {Promise<void>} A promise that resolves once keyboard capture is ended (when Ctrl-C is pressed)
 */
function capture (event_client) {
  state.paused = false

  return new Promise((resolve, reject) => {
    // Start grabbing key presses
    terminal.grabInput(true)

    terminal.on('key', (keyname, matches, data) => {
      if (state.paused) {
        return
      }
      log.debug('keypress:', keyname, data)

      // Exit key
      if (keyname === 'CTRL_C') {
        terminal.grabInput(false)
        resolve()
      }
      else {
        sendKey(event_client, normalizeKeyName(keyname))
      }
    })
  })
}

const api = {
  capture,
  startTextEntry,
  endTextEntry,
}

module.exports = api
