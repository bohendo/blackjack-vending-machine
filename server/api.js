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
  return db.getState(req.id).then(state=>{

    // use our bj reducer to apply some move to our old bj state
    const newState = bj(state, { type: move })
    return db.updateState(req.id, newState).then(() => {
      // send the public part of this bj state after our update has been saved
      return res.json(newState.public)
    }).catch(die)

  }).catch(die)
}

////////////////////////////////////////
// Define Exported Object
const router = express.Router()

// Triggered the first time a player autographs our agreement
router.get('/autograph', (req, res, next) => {
  log(`New autograph received, initializing a BJ state for ${req.id.substring(0,10)}`)
  const newState = bj()
  return db.insertState(req.id, req.ag, newState).then(() => {
    return res.json(Object.assign(newState.public,
      { message: "Thanks for the autograph!", authenticated: true }
    ))
  }).catch(die)
})

router.get('/refresh', (req, res, next) => {
  // get fresh data from eth and db
  eth.dealerData().then(dealerData => {
    log(`Dealer balance: ${dealerData.dealerBal}`)
    db.getState(req.id).then(state => {

      // sync & save our bj state before sending it to the client
      const newState = bj(state, { type: 'SYNC' })
      db.updateState(req.id, newState).then(() => {
        log(`Refreshed eth & state data for ${req.id.substring(0,10)}`)
        res.json(Object.assign(state.public, dealerData))
      }).catch(die)

    }).catch(die)
  }).catch(die)
})

router.get('/cashout', (req, res, next) => {
  db.cashout(req.id).then((chips) => {
    // short circuit if this player doesn't have any chips
    if (chips === 0) { return res.json({ message: "Hey you don't have any chips" }) }
    eth.cashout(req.id, chips).then((receipt) => {

      // save this txhash message into this player's game state
      const txHash = receipt.transactionHash
      db.getState(req.id).then(state => {

        const newState = bj(state)
        state.public.message = `Cashout tx: ${txHash}`

        db.updateState(req.id, newState).then(() => {

          log(`${req.id.substring(0,10)} cashed out ${chips} chips & sent tx: ${txHash}`)
          return res.json(newState.public)

        }).catch(die)
      }).catch(die)

    }).catch(die)
  }).catch(die)
})

router.get('/deal',   (req, res, next) => { handleMove(req, res, 'DEAL') })
router.get('/hit',    (req, res, next) => { handleMove(req, res, 'HIT') })
router.get('/double', (req, res, next) => { handleMove(req, res, 'DOUBLE') })
router.get('/stand',  (req, res, next) => { handleMove(req, res, 'STAND') })
router.get('/split',  (req, res, next) => { handleMove(req, res, 'SPLIT') })

export default router
