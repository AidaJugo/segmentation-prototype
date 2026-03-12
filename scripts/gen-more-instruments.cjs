const fs = require('fs')
const path = require('path')

const instrumentsPath = path.join(__dirname, '../src/data/instruments.json')
const instruments = JSON.parse(fs.readFileSync(instrumentsPath, 'utf8'))

const TARGET = 1000
const toAdd = TARGET - instruments.length
if (toAdd <= 0) {
  console.log(`Already have ${instruments.length} instruments, target is ${TARGET}.`)
  process.exit(0)
}

function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(9999)

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}

function varyNumber(val, pct) {
  if (typeof val !== 'number') return val
  const factor = 1 + (rand() - 0.5) * 2 * pct
  return Math.round(val * factor * 100) / 100
}

const maxId = Math.max(...instruments.map(i => i.id))
const keys = Object.keys(instruments[0])

const stringValueSets = {}
for (const key of keys) {
  if (key === 'id') continue
  const sample = instruments[0][key]
  if (typeof sample === 'string' || (sample !== null && typeof sample !== 'number')) {
    const vals = [...new Set(instruments.map(i => i[key]).filter(v => v !== null && v !== undefined))]
    if (vals.length > 0) stringValueSets[key] = vals
  }
}

console.log(`Creating ${toAdd} new instruments (id ${maxId + 1} to ${maxId + toAdd})...`)

for (let n = 0; n < toAdd; n++) {
  const source = pick(instruments.slice(0, 200))
  const newInst = {}
  newInst.id = maxId + 1 + n

  for (const key of keys) {
    if (key === 'id') continue
    const val = source[key]
    if (val === null || val === undefined) {
      newInst[key] = null
    } else if (typeof val === 'number') {
      if (key === 'balance' || key === 'curr_book') {
        newInst[key] = Math.round(varyNumber(val, 0.4))
      } else if (key === 'fico_score') {
        newInst[key] = Math.max(300, Math.min(850, Math.round(val + (rand() - 0.5) * 100)))
      } else {
        newInst[key] = varyNumber(val, 0.3)
      }
    } else if (stringValueSets[key]) {
      newInst[key] = pick(stringValueSets[key])
    } else {
      newInst[key] = val
    }
  }

  instruments.push(newInst)
}

fs.writeFileSync(instrumentsPath, JSON.stringify(instruments, null, 2) + '\n')
console.log(`Done. Total instruments: ${instruments.length}`)
