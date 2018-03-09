import express from 'express'

import bj from './blackjack'
import db from './database'
import eth from './eth'

////////////////////////////////////////
// Internal Utilities

const log = (msg) => {
  if (true) console.log(`${new Date().toISOString()} [API] ${msg}`)
}

const die = (msg) => {
  console.error(`${new Date().toISOString()} [API] Fatal: ${msg}`)
  process.exit(1)
}

const handleMove = (req, res, move) => {
  log(`Handling ${move} for ${req.id.substring(0,10)}`)

  // use our bj reducer to apply some move to our old bj state
  const newState = bj(req.state, { type: move })
  return db.updateState(req.id, newState).then(() => {
    // send the public part of this bj state after our update has been saved
    return res.json(newState.public)
  }).catch(die)

}

////////////////////////////////////////
// Define Exported Object
const router = express.Router()

// Triggered the first time a player autographs our agreement
router.get('/autograph', (req, res, next) => {
  log(`New autograph received, player ${req.id.substring(0,10)} is ready to go`)
  return res.json({ message: "Thanks for the autograph!", authenticated: true })
})

router.get('/refresh', (req, res, next) => {
  // if our message contains a txHash, preserve it when refreshing
  var message
  if (req.state.public.message.match(/0x[0-9a-f]{65}/)) {
    message = req.state.public.message    
  } else {
    message = false
  }
  // sync & save our bj state before sending it to the client
  const newState = bj(req.state, { type: 'SYNC' })
  if (message) { newState.public.message = message }

  db.updateState(req.id, newState).then(() => {
    log(`Refreshed game state for ${req.id.substring(0,10)}`)
    res.json(newState.public)
  }).catch(die)
})

router.get('/cashout', (req, res, next) => {

  let message = "Hey you don't have any chips"
  if (req.state.public.chips === 0) {
    log(`${req.id.substring(0,10)} doesn't have any chips to cash out`)
    return res.json({ message })
  }

  eth.cashout(req.id, req.state.public.chips).then((receipt) => {
    let message

    message = "Oh no, the dealer's broke.. Try again later"
    if (receipt.chipsCashed === 0) {
      log(`WARNING Dealer's broke, ${req.id.substring(0,10)} couldn't cash out`)
      return res.json({ message })
    }

    // if everything went well, subtract some chips from the player's game state
    db.cashout(req.id, receipt).then((newState) => {
      return res.json(newState.public)
    }).catch(die)

  }).catch(die)

})

router.get('/deal',   (req, res, next) => { handleMove(req, res, 'DEAL') })
router.get('/hit',    (req, res, next) => { handleMove(req, res, 'HIT') })
router.get('/double', (req, res, next) => { handleMove(req, res, 'DOUBLE') })
router.get('/stand',  (req, res, next) => { handleMove(req, res, 'STAND') })
router.get('/split',  (req, res, next) => { handleMove(req, res, 'SPLIT') })

export default router
