import sha256 from 'js-sha256'

const genSalt = () => {
  const result           = ''
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for ( var i = 0; i < 128; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export const getRandSalt = () => {
  return `0x${sha256(genSalt())}`
}