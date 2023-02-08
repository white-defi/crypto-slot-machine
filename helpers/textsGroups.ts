export const textsGroups = [
  {
    title: `Main options`,
    items: [
      {
        code: `App_Title`,
        desc: `Application title`,
        value: `CryptoSlots Machine`,
      },
      {
        code: `App_Description`,
        desc: `Application desctiption`,
        value: `CryptoSlots Machine`,
      },
      {
        code: `App_Keywords`,
        desc: `Application keywords`,
        value: `CryptoSlots Machine`,
      },
      {
        code: `App_Footer`,
        desc: `Footer text`,
        multiline: true,
        markdown: true,
        value: `Powered by OnOut - [no-code tool to create CryptoSlots Machine](https://onout.org/cryptoslots/)`
      }
    ]
  },
  {
    title: `Index page`,
    items: [
      
    ],
  },
]

const prepareTextsGroups = () => {
  const _ret = {}
  Object.keys(textsGroups).forEach((k) => {
    Object.keys(textsGroups[k].items).forEach((kk) => {
      const _item = textsGroups[k].items[kk]
      _ret[_item.code] = _item
    })
  })
  
  return _ret;
}

export const TEXTS_GROUPS_ITEMS = prepareTextsGroups()
