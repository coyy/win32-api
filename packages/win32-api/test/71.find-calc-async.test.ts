import { spawn } from 'child_process'
import assert from 'node:assert/strict'

import { fileShortPath } from '@waiting/shared-core'
import { sleep } from 'zx'

import { user32FindWindowEx } from '../src/index.fun.js'
import { ucsBufferFrom, ucsBufferToString } from '../src/index.js'
import * as UP from '../src/index.user32.js'

import { calcLpszWindow } from './config.unittest.js'
import { user32, user32Sync } from './helper.js'


describe.skip(fileShortPath(import.meta.url), () => {

  describe('Should FindWindowExW() work', () => {
    it('find window hWnd via await', async () => {
      const child = spawn('calc.exe')

      console.log(new Date().toLocaleTimeString())
      await sleep(2000)
      console.log(new Date().toLocaleTimeString())

      const hWnd = await user32FindWindowEx(0, 0, null, calcLpszWindow)
      assert((typeof hWnd === 'string' && hWnd.length > 0) || hWnd > 0, 'found no calc window')
      child.kill()
    })

    it('find window hWnd via callback async', async () => {
      const child = spawn('calc.exe')

      console.log(new Date().toLocaleTimeString())
      await sleep(2000)
      console.log(new Date().toLocaleTimeString())

      await new Promise<void>((done) => {
        const buf = ucsBufferFrom(calcLpszWindow)
        user32Sync.FindWindowExW.async(0, 0, null, buf, (err, hWnd) => {
          if (err) {
            assert(false, err.message)
          }

          assert((typeof hWnd === 'string' && hWnd.length > 0) || hWnd > 0, 'found no calc window')
          child.kill()
          done()
        })
      })
    })


    it('change window title', async () => {
      const child = spawn('calc.exe')
      await sleep(2000)
      await findNSetWinTitleAsync()
    })

    it('change window title with partial loading', async () => {
      const child = spawn('calc.exe')
      await sleep(2000)
      await findNSetWinTitleAsyncPartial()
    })

  })
})


async function findNSetWinTitleAsync(): Promise<void> {
  const title = 'Node-Calculator'
  const len = title.length
  const hWnd = await user32.FindWindowExW(0, 0, null, ucsBufferFrom(calcLpszWindow))

  assert((typeof hWnd === 'string' && hWnd.length > 0) || hWnd > 0, 'found no calc window')
  const ret = await user32.SetWindowTextW(hWnd, ucsBufferFrom(title))
  assert(ret, 'SetWindowTextW() failed')

  const buf = Buffer.alloc(len * 2)
  await user32.GetWindowTextW(hWnd, buf, len + 1)
  const str = ucsBufferToString(buf)
  assert(str === title.trim(), `title should be changed to "${title}", bug got "${str}"`)
}


async function findNSetWinTitleAsyncPartial(): Promise<void> {
  const u32 = UP.load(['FindWindowExW', 'SetWindowTextW'])

  const title = 'Node-Calculator'
  const len = title.length
  const hWnd = await u32.FindWindowExW(0, 0, null, ucsBufferFrom(calcLpszWindow))

  assert((typeof hWnd === 'string' && hWnd.length > 0) || hWnd > 0, 'found no calc window')
  // Change title of the Calculator
  await u32.SetWindowTextW(hWnd, ucsBufferFrom(title))

  const buf = Buffer.alloc(len * 2)
  await u32.GetWindowTextW(hWnd, buf, len + 1)
  const str = ucsBufferToString(buf)
  assert(str === title, `title should be changed to ${title}, bug got ${str}`)
}

