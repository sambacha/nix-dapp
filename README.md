# Web3 DApp

> Architecture and Design 

## FSM based State Management Layer

NFT Gallery: https://xstate.js.org/viz/?gist=b8e9ec176bcdfb673d6e3d19d237803e 

Router: https://xstate.js.org/viz/?gist=b8e9ec176bcdfb673d6e3d19d237803e 

Send: https://xstate.js.org/viz/?gist=5158cd1138aaab449b556375906456ac 

##  Discrete Contract Components and Actions

- User
- Market (i.e. venue)

### User Actions
### getOrders
getOrders (address,uint256[])
TOKEN
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
ORDERINDICES


### getTrades
getTrades (uint256[])
TRADEINDEXES
i.e. 255, 255

### getTrade
getTrade (uint256)
TRADEINDEX
i.e. 255
### getRoyaltyView
getRoyaltyView (address,uint256,uint256)
TOKENADDRESS
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
TOKENID
i.e. 255
VALUE
i.e. 255

### getOrders
getOrders (address,uint256[])
TOKEN
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
ORDERINDICES
i.e. 255, 255


#### getOrder (address,uint256)
TOKEN
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
ORDERINDEX
i.e. 255


#### ownerOf (uint256)
TOKENID
i.e. 255


## Market Actions

#### addOrder (address,address,uint8,uint8,uint256[],uint256,uint256,uint256,uint256,address)
TOKEN
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
TAKER
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
BUYORSELL
i.e. 255
ANYORALL
i.e. 255
TOKENIDS



#### updateOrder (address,uint256,address,uint256[],uint256,uint256,int256,uint256,address)
TOKEN
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
ORDERINDEX
i.e. 255
TAKER
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
TOKENIDS
i.e. 255, 255
PRICE
i.e. 255
EXPIRY


#### updateOrderPriceAndExpiry (address,uint256,uint256,uint256,address)
TOKEN
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
ORDERINDEX
i.e. 255
PRICE
i.e. 255
EXPIRY
i.e. 255
INTEGRATOR
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0


#### executeOrders (address[],uint256[],uint256[][],int256,uint256,address)
TOKENLIST
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0, 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
ORDERINDEXES
i.e. 255, 255
TOKENIDSLIST


#### onERC721Received (address,address,uint256,bytes)
OPERATOR
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
FROM
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
TOKENID
i.e. 255
DATA


####  transferOwnership (address)
_NEWOWNER
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0



#### withdraw (address,uint256,uint256)
TOKEN
i.e. 0x261b45d85ccfeabb11f022eba346ee8d1cd488c0
TOKENS
i.e. 255
TOKENID
i.e. 255
SUBMIT


### License

GPL-2.0-Only