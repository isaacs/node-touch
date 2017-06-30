'use strict'
const fs = require("fs")
const touch = require("../")
const t = require('tap')
const mutateFS = require('mutate-fs')

const _ = fn => er => {
  if (er)
    throw er
  fn()
}

const files = [
  'sync',
  'sync-ref',
  'async',
  'async-ref'
]

files.forEach(f => {
  try { fs.unlinkSync(f) } catch (e) {}
})

const dirs = [
  'dir-sync',
  'dir-async'
]

dirs.forEach(d => {
  try { fs.rmdirSync(d) } catch (e) {}
  try { fs.mkdirSync(d) } catch (e) {}
})

const now = Math.floor(Date.now() / 1000) * 1000
const then = now - 1000000000 // now - 1Msec

t.teardown(() => {
  files.forEach(f => {
    try { fs.unlinkSync(f) } catch (e) {}
  })
})

t.test('set both to now', t => {
  touch.sync("sync")
  touch("async", _(() => {
    const astat = fs.statSync("async")
    const sstat = fs.statSync("sync")
    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()

    t.equal(asm, asa)
    t.equal(ssm, ssa)
    t.equal(ssa, now)
    t.equal(asa, now)

    // ctime should always be now-ish
    t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 10000)
    t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 10000)
    t.end()
  }))
})

t.test('set both to now, using futimes', t => {
  const runTest = closeAfter => {
    t.test('closeAfter=' + closeAfter, t => {
      const sfd = fs.openSync('sync', 'w')

      if (closeAfter) {
        touch.ftouchSync(sfd, { closeAfter: true })
      } else {
        touch.ftouchSync(sfd)
        fs.closeSync(sfd)
      }

      const afd = fs.openSync('async', 'w')
      t.equal(afd, sfd)

      const then = _(() => {
        if (!closeAfter) {
          fs.closeSync(afd)
        }

        const astat = fs.statSync("async")
        const sstat = fs.statSync("sync")
        const asa = astat.atime.getTime()
        const ssa = sstat.atime.getTime()
        const asm = astat.mtime.getTime()
        const ssm = sstat.mtime.getTime()

        t.equal(asm, asa)
        t.equal(ssm, ssa)

        // atime should always be now-ish
        t.ok(Math.abs(Date.now() - sstat.atime.getTime()) < 1000)
        t.ok(Math.abs(Date.now() - astat.atime.getTime()) < 1000)

        // ctime should always be now-ish
        t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 1000)
        t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 1000)
      })

      if (closeAfter) {
        return touch.ftouch(afd, {closeAfter: true}).then(then)
      } else {
        return touch.ftouch(afd, then)
      }
    })
  }

  runTest(true)
  runTest(false)
  t.end()
})

t.test('set both to now - 1Msec', t => {
  // also use force, just for funsies
  touch.sync("sync", { time: then, force: true })
  touch("async", { time: then, force: true }, _(() => {
    const astat = fs.statSync("async")
    const sstat = fs.statSync("sync")
    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()

    t.notEqual(asm, now)
    t.equal(asa, asm)

    t.notEqual(ssm, now)
    t.equal(ssa, ssm)

    t.equal(ssa, then)
    t.equal(asa, then)

    t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 1000)
    t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 1000)
    t.end()
  }))
})

t.test('set both to now - 1Msec (dirs)', t => {
  // Touch dirs using a time in the past because they were just created.
  touch.sync("dir-sync", { time: then })
  touch("dir-async", { time: then }, _(() => {
    const astat = fs.statSync("dir-async")
    const sstat = fs.statSync("dir-sync")
    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()

    t.notEqual(asm, now)
    t.equal(asa, asm)

    t.notEqual(ssm, now)
    t.equal(ssa, ssm)

    t.equal(ssa, then)
    t.equal(asa, then)

    t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 1000)
    t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 1000)
    t.end()
  }))
})

t.test('set mtime to now', t => {
  touch.sync("sync", { time: now, mtime: true })
  touch("async", { time: now, mtime: true }, _(() => {
    const astat = fs.statSync("async")
    const sstat = fs.statSync("sync")
    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()

    t.notEqual(asa, asm)
    t.notEqual(ssa, ssm)

    t.equal(ssa, then)
    t.equal(asa, then)

    t.equal(ssm, now)
    t.equal(asm, now)

    t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 1000)
    t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 1000)
    t.end()
  }))
})

t.test('set mtime to now (dirs)', t => {
  touch.sync("dir-sync", { time: now, mtime: true })
  touch("dir-async", { time: now, mtime: true }, _(() => {
    const astat = fs.statSync("dir-async")
    const sstat = fs.statSync("dir-sync")
    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()

    t.notEqual(asa, asm)
    t.notEqual(ssa, ssm)

    t.equal(ssa, then)
    t.equal(asa, then)

    t.equal(ssm, now)
    t.equal(asm, now)

    t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 1000)
    t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 1000)
    t.end()
  }))
})

t.test('set atime to now', t => {
  touch.sync("sync", { time: now, atime: true })
  touch("async", { time: now, atime: true }, _(() => {
    const astat = fs.statSync("async")
    const sstat = fs.statSync("sync")
    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()

    t.equal(asm, now)
    t.equal(ssm, now)

    t.equal(asa, now)
    t.equal(ssa, now)

    t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 1000)
    t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 1000)
    t.end()
  }))
})

t.test('set atime to now (dirs)', t => {
  touch.sync("dir-sync", { time: now, atime: true })
  touch("dir-async", { time: now, atime: true }, _(() => {
    const astat = fs.statSync("dir-async")
    const sstat = fs.statSync("dir-sync")
    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()

    t.equal(asm, now)
    t.equal(ssm, now)

    t.equal(asa, now)
    t.equal(ssa, now)

    t.ok(Math.abs(Date.now() - sstat.ctime.getTime()) < 1000)
    t.ok(Math.abs(Date.now() - astat.ctime.getTime()) < 1000)
    t.end()
  }))
})

t.test('nocreate should not throw on ENOENT', t => {
  touch.sync('sync-noent', { nocreate: true })
  t.throws(() => fs.statSync('sync-noent'))
  return touch('async-noent', { nocreate: true }).then(() =>
    t.throws(() => fs.statSync('async-noent')))
})

t.test('use one file as ref for another, only mtime', t => {
  fs.writeFileSync('sync-ref', '')
  fs.writeFileSync('async-ref', '')
  fs.writeFileSync('sync', '')
  fs.writeFileSync('async', '')

  fs.utimesSync('sync-ref', then, then)
  fs.utimesSync('async-ref', then, then)
  fs.utimesSync('sync', now, now)
  fs.utimesSync('async', now, now)

  touch.sync('sync-ref', { ref: 'sync', mtime: true })
  touch('async-ref', { ref: 'async', mtime: true }, _(() => {
    const astat = fs.statSync("async")
    const sstat = fs.statSync("sync")
    const arstat = fs.statSync('async-ref')
    const srstat = fs.statSync('sync-ref')

    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const arsa = arstat.atime.getTime()
    const srsa = srstat.atime.getTime()

    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()
    const arsm = arstat.mtime.getTime()
    const srsm = srstat.mtime.getTime()

    const arsc = arstat.ctime.getTime()
    const srsc = srstat.ctime.getTime()

    t.equal(asm, arsm)
    t.equal(ssm, srsm)

    t.notEqual(asa, arsa)
    t.notEqual(ssa, srsa)

    t.ok(Math.abs(Date.now() - srsc) < 1000)
    t.ok(Math.abs(Date.now() - arsc) < 1000)
    t.end()
  }))
})

t.test('use one file as ref for another', t => {
  fs.writeFileSync('sync-ref', '')
  fs.writeFileSync('async-ref', '')
  fs.writeFileSync('sync', '')
  fs.writeFileSync('async', '')

  fs.utimesSync('sync-ref', then, then)
  fs.utimesSync('async-ref', then, then)
  fs.utimesSync('sync', now, now)
  fs.utimesSync('async', now, now)

  touch.sync('sync-ref', { ref: 'sync' })
  touch('async-ref', { ref: 'async' }, _(() => {
    const astat = fs.statSync("async")
    const sstat = fs.statSync("sync")
    const arstat = fs.statSync('async-ref')
    const srstat = fs.statSync('sync-ref')

    const asa = astat.atime.getTime()
    const ssa = sstat.atime.getTime()
    const arsa = arstat.atime.getTime()
    const srsa = srstat.atime.getTime()

    const asm = astat.mtime.getTime()
    const ssm = sstat.mtime.getTime()
    const arsm = arstat.mtime.getTime()
    const srsm = srstat.mtime.getTime()

    const arsc = arstat.ctime.getTime()
    const srsc = srstat.ctime.getTime()

    t.equal(asm, arsm)
    t.equal(ssm, srsm)

    t.equal(asa, arsa)
    t.equal(ssa, srsa)

    t.ok(Math.abs(Date.now() - srsc) < 1000)
    t.ok(Math.abs(Date.now() - arsc) < 1000)
    t.end()
  }))
})

t.test('fstat fail', t => {
  const poop = new Error('poop')
  const unmutate = mutateFS.fail('fstat', poop)
  const fd = fs.openSync('sync', 'r')

  t.teardown(() => {
    unmutate()
    fs.closeSync(fd)
  })

  t.throws(() => {
    touch.ftouchSync(fd, { time: now, atime: true })
  }, poop)

  touch.ftouch(fd, { time: now, atime: true }).catch(er => {
    t.equal(er, poop)
    t.end()
  })
})

t.test('futimes fail', t => {
  const poop = new Error('poop')
  const unmutate = mutateFS.fail('futimes', poop)
  const fd = fs.openSync('sync', 'r')

  t.teardown(() => {
    unmutate()
    fs.closeSync(fd)
  })

  t.throws(() => {
    touch.ftouchSync(fd)
  }, poop)

  touch.ftouch(fd, er => {
    t.equal(er, poop)
    t.end()
  })
})

t.test('futimes fail, close after', t => {
  const poop = new Error('poop')
  touch.sync('sync')
  const unmutate = mutateFS.fail('futimes', poop)
  const fd = fs.openSync('sync', 'r')
  const close = fs.close
  const closeSync = fs.closeSync

  let closes = 0
  let closeSyncs = 0
  fs.close = () => {
    closes ++
  }
  fs.closeSync = () => {
    closeSyncs ++
  }

  t.teardown(() => {
    unmutate()
    fs.close = close
    fs.closeSync = closeSync
    fs.closeSync(fd)
  })

  t.throws(() => {
    touch.ftouchSync(fd, { closeAfter: true })
  }, poop)

  touch.ftouch(fd, { closeAfter: true }, er => {
    t.equal(er, poop)
    t.end()
  })
})

t.test('ref stat fail', t => {
  const poop = new Error('poop')
  t.teardown(mutateFS.fail('stat', poop))

  t.throws(() => {
    touch.touchSync('sync', { ref: 'sync-ref' })
  }, poop)

  touch('async', { ref: 'async-ref' }, er => {
    t.equal(er, poop)
    t.end()
  })
})

t.test('open fail', t => {
  const poop = new Error('poop')
  t.teardown(mutateFS.fail('open', poop))
  t.throws(() => touch.sync('sync'))
  return touch('async').then(() => t.fail('should fail'), er =>
    t.equal(er, poop))
})
