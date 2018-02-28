import fetch from 'isomorphic-fetch'

// client-side actions & action creators

export const AUTOGRAPH = 'AUTOGRAPH'
export function autograph() {
  return function(dispatch) {
    return fetch('/api/autograph', { credentials: 'same-origin' })
      .then(
        response => response.json(),
        error => dispatch(failure(error))
      ).then(
        data => {
          return dispatch(success(data))
        }
      ).catch(console.error)
  }
}

export const REFRESH = 'REFRESH'
export function refresh() {
  console.log('Refreshment: activated!')
  return function(dispatch) {
    return fetch('/api/refresh', { credentials: 'same-origin' })
      .then(
        response => response.json(),
        error => dispatch(failure(error))
      ).then(
        data => {
          console.log(`Refreshment response: ${JSON.stringify(data)}`)
          return dispatch(success(data))
        }
      ).catch(console.error)
  }
}

export const CASHOUT = 'CASHOUT'
export function cashout(addr) {
  console.log('Cashout: activated!')
  return function(dispatch) {
    return fetch(`/api/cashout?addr=${addr}`, { credentials: 'same-origin' })
      .then(
        response => response.json(),
        error => dispatch(failure(error))
      ).then(
        data => {
          console.log(`Cashout response: ${JSON.stringify(data)}`)
          return dispatch(success(data))
        }
      ).catch(console.error)
  }
}

export const SUBMIT = 'SUBMIT'
export function submit(move) {
  console.log(`Submitting move: ${move}`)
  // utilizes redux-thunk
  return function(dispatch) {
    return fetch(`/api/${move.toLowerCase()}`, { credentials: 'same-origin' })
      .then(
        response => response.json(),
        error => dispatch(failure(error))
      ).then(
        state => dispatch(success(state))
      ).catch(console.error)
  }
}

export const SUCCESS = 'SUCCESS'
export function success(state) {
  return ({
    type: SUCCESS,
    state,
  })
}

export const FAILURE = 'FAILURE'
export function failure(error) {
  return ({
    type: FAILURE,
    error,
  })
}
