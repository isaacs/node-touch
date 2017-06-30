'use strict'
const t = require('tap')
const bin = require.resolve('../bin/nodetouch.js')
const node = process.execPath
const spawn = require('child_process').spawn
const fs = require('fs')

const exec = args => new Promise(resolve => {
  const child = spawn(node, [bin].concat(args))
  const out = []
  child.stdout.on('data', c => out.push(c))
  const err = []
  child.stderr.on('data', c => err.push(c))
  child.on('close', (code, signal) =>
    resolve([code, signal, Buffer.concat(out).toString(),
            Buffer.concat(err).toString()]))
})

t.test('no args, print usage', t =>
  exec([]).then(res =>
    t.match(res, [0, null, /^usage:\ntouch/, ''])))

t.test('bad args, print usage and fail', t =>
  exec(['-aw3eawefase']).then(res =>
    t.match(res, [1, null, '', /^touch: illegal option -- -w\nusage:\ntouch/])))

t.test('bad time, print usage and fail', t =>
  exec(['-tasdf']).then(res =>
    t.match(res, [1, null, '',
      'touch: out of range or illegal time specification:' +
      ' [[CC]YY]MMDDhhmm[.SS]'
    ])))

t.test('no touching null', t =>
  exec(['/dev/null']).then(res =>
    t.match(res, [1, null, '', ''])))

t.test('nocreate, no problem', t => Promise.all([
  t.test('-c', t =>
    exec(['-c', 'flurple']).then(res =>
      t.match(res, [0, null, '', '']))),
  t.test('--nocreate', t =>
    exec(['--nocreate', 'flurple']).then(res =>
      t.match(res, [0, null, '', ''])))
]))

t.test('mtime only', t => {
  const file = 'asdf3f2a'
  const time = new Date(Date.UTC(1979, 6, 1, 17, 10, 0, 0)).toISOString()
  const n = '7907011710.00'
  const check = t => {
    const st = fs.statSync(file)
    t.equal(st.mtime.toISOString(), time)
    t.notEqual(st.atime.toISOString(), time)
    fs.unlinkSync(file)
  }

  return Promise.all([
    t.test('-m', t => exec(['--time=' + n, '-m', file]).then(res =>
      (t.match(res, [0, null, '', '']),
      check(t)))),
    t.test('--mtime', t => exec(['-t', n, '--mtime', file]).then(res =>
      (t.match(res, [0, null, '', '']),
      check(t))))
  ])
})

t.test('mtime and atime', t => {
  const file = 'asdf3f2a'
  const time = new Date(Date.UTC(1979, 6, 1, 17, 10, 0, 0)).toISOString()
  const n = '197907011710.00'
  const check = t => {
    const st = fs.statSync(file)
    t.equal(st.mtime.toISOString(), time)
    t.equal(st.atime.toISOString(), time)
    fs.unlinkSync(file)
  }

  return Promise.all([
    t.test('-m', t => exec(['--time=' + n, '-a', '--mtime', file]).then(res =>
      (t.match(res, [0, null, '', '']),
      check(t)))),
    t.test('--mtime', t => exec(['-t', n,'--atime', '-m', file]).then(res =>
      (t.match(res, [0, null, '', '']),
      check(t))))
  ])
})


t.test('atime only', t => {
  const file = 'asdf3f2a'
  const time = new Date(Date.UTC(2068, 6, 1, 17, 10, 0, 0)).toISOString()
  const n = '6807011710.00'
  const check = t => {
    const st = fs.statSync(file)
    t.equal(st.mtime.toISOString(), time)
    t.notEqual(st.atime.toISOString(), time)
    fs.unlinkSync(file)
  }

  return Promise.all([
    t.test('-m', t => exec(['--time=' + n, '-m', file]).then(res =>
      (t.match(res, [0, null, '', '']),
      check(t)))),
    t.test('--mtime', t => exec(['-t', n, '--mtime', file]).then(res =>
      (t.match(res, [0, null, '', '']),
      check(t))))
  ])
})

t.test('ref', t => {
  const file = 'j38ahseas8h3f'
  const ref = 'refernce-fileasdfja9hf38a'
  t.beforeEach(() => Promise.resolve((
    fs.writeFileSync(ref, 'asdf'),
    fs.utimesSync(ref, new Date('1979-07-01T17:10:00Z'),
                  new Date('2011-10-05T22:10:35Z'))
  )))
  t.afterEach(() => Promise.resolve((
    fs.unlinkSync(ref), fs.unlinkSync(file))))

  const check = t => {
    const st = fs.statSync(file)
    const atime = new Date('1979-07-01T17:10:00Z')
    const mtime = new Date('2011-10-05T22:10:35Z')
    t.equal(st.atime.toISOString(), atime.toISOString())
    t.equal(st.mtime.toISOString(), mtime.toISOString())
  }

  return Promise.all([
    t.test('-r<ref>', t => exec(['-r' + ref, file]).then(res =>
      (t.match(res, [0, null, '', '']),
       check(t)))),
    t.test('-r=<ref>', t => exec(['-r=' + ref, file]).then(res =>
      (t.match(res, [0, null, '', '']),
       check(t)))),
    t.test('-r <ref>', t => exec(['-r', ref, file]).then(res =>
      (t.match(res, [0, null, '', '']),
       check(t)))),
    t.test('--ref=<ref>', t => exec(['--ref=' + ref, file]).then(res =>
      (t.match(res, [0, null, '', '']),
       check(t)))),
    t.test('--ref <ref>', t => exec(['--ref', ref, file]).then(res =>
      (t.match(res, [0, null, '', '']),
       check(t))))
  ])
})
