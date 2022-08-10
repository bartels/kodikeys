'use strict'

const fs = require('fs')
const path = require('path')
const xec = require('xbmc-event-client')
const kodiws = require('kodi-ws')
const { terminal } = require('terminal-kit')
const keyboard = require('./lib/keyboard')
const log = require('./lib/logging')

const kodikeys = {
  defaults: {
    port: 9777,
    rpc_port: 9090,
    log_level: 'warn',
  },

  start (opt) {
    opt = Object.assign({}, this.defaults, opt)

    log.setLevel(opt.log_level)

    // Promise resolves when user closes the connection
    return new Promise((resolve, reject) => {

      // Event client setup
      const event_client = new xec.XBMCEventClient('kodikeys', {
        host: opt.host,
        port: opt.port,
        iconbuffer: fs.readFileSync(path.join(__dirname, '/lib/node.png')),
        icontype: xec.ICON_PNG,
      })

      // Connect to kodi event server
      event_client.connect((errors, bytes) => {
        if (errors.length) {
          const msg = `Connection failed to host ${opt.host}, port ${opt.port}`
          log.error(msg)
          log.debug(errors[0].toString())
          reject({ msg, errors })
          return
        }

        // Connect to kodi json-rpc
        kodiws(opt.host, opt.rpc_port)
          .then(connection => {
            log.info(`connected to json-rpc on ${opt.host}, port ${opt.rpc_port}`)

            // Start keyboard capture
            keyboard.capture(event_client).then(disconnect)

            // Listen for notifications
            // Input requested by kodi
            connection.notification('Input.OnInputRequested', (resp) => {
              keyboard.startTextEntry()
                .then(text => {
                  if (text) {
                    terminal('sending: ').bold(text)
                    terminal('\n')
                    connection.Input.SendText(text)
                  }
                  else {
                    log.debug('No text entered')
                  }
                })
            })

            // Input finished
            connection.notification('Input.OnInputFinished', (resp) => {
              log.info('input accepted')
              keyboard.endTextEntry()
            })

            // Quit notification
            connection.notification('System.OnQuit', (resp) => {
              terminal.yellow(`Kodi is quitting\n`)
              disconnect()
            })

            // Sleep notification
            connection.notification('System.OnSleep', (resp) => {
              terminal.yellow('Kodi is being put into sleep mode...\n')
            })

            // Wake notification
            connection.notification('System.OnWake', (resp) => {
              terminal.green('Kodi has woken up from sleep mode\n')
            })
          })
          .catch(error => {
            log.error(`Failed to connect to JSON-RPC on ${opt.host} port ${opt.rpc_port}`)
            log.debug(error.toString())
            log.warn('Some functions, such as sending remote input, will not work')

            // Start keyboard capture
            keyboard.capture(event_client).then(disconnect)
          })

        // ping to keep connection  alive
        setInterval(event_client.ping.bind(event_client), 55 * 1000)

        terminal.bold(`connected to Kodi on ${opt.host}, ctrl-c to exit\n`)
        log.info(`connected to EventServer on ${opt.host}, port ${opt.port}`)
      })

      // Disconnect from kodi and return to caller
      function disconnect () {
        event_client.disconnect(resolve)
        setTimeout(resolve, 250)
      }
    })
  },
}

module.exports = kodikeys
