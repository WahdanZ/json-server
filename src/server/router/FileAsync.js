// Not using async/await on purpose to avoid adding regenerator-runtime
// to lowdb dependencies
const fs = require('graceful-fs')
const pify = require('pify')
const steno = require('steno')
const Base = require('lowdb/adapters/Base')
const bfj = require('bfj')

const readFile = pify(fs.readFile)
const writeFile = pify(steno.writeFile)

class FileAsync extends Base {
  async read() {
    // fs.exists is deprecated but not fs.existsSync
    if (fs.existsSync(this.source)) {
      // Read database
      return readFile(this.source, 'utf-8')
        .then((data) => {
          // Handle blank file
          const trimmed = data.trim()
          return trimmed ? this.deserialize(trimmed) : this.defaultValue
        })
        .catch((e) => {
          if (e instanceof SyntaxError) {
            e.message = `Malformed JSON in file: ${this.source}\n${e.message}`
          }
          throw e
        })
    } else {
      // Initialize

      return writeFile(this.source, JSON.stringify(this.defaultValue))
        .catch(async (e) => {
          return writeFile(
            this.source,
            await bfj.stringify(this.defaultValue, {
              replace: null,
              space: 2,
            })
          )
        })
        .then()
        .then(() => this.defaultValue)
    }
  }

  async write(data) {
    return writeFile(this.source, JSON.stringify(data)).catch(async (e) => {
      return writeFile(
        this.source,
        await bfj.stringify(data, {
          replace: null,
          space: 2,
        })
      )
    })
  }
}

module.exports = FileAsync
