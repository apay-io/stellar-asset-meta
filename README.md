# Stellar Asset Meta

This is the code behind simple but useful API endpoint
https://stellar-asset-meta.apay.workers.dev

It provides a way to load metadata about multiple Stellar assets using just one HTTP request.

## Problem

For example, this is useful when you have a list of assets or user balances and you want to display icons for those assets.

Normally you would 
- query Horizon server for each issuer account to obtain issuer's home domain
- query stellar.toml file for each home domain and parse it
- extract asset information from the toml file

Imagine user has
- BTC issued by GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF
- ETH issued by GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5
- LTC issued by GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P

Your frontend must send a total of 6 HTTP requests and have toml parser library ready to extract the data.

## Solution

```
GET https://stellar-asset-meta.apay.workers.dev?assets=BTC:GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF&assets=ETH:GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5&assets=LTC:GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P
``` 
or
```
POST https://stellar-asset-meta.apay.workers.dev
[
	{
		"asset_code": "BTC",
		"asset_issuer": "GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF"
	},
	{
		"asset_code": "ETH",
		"asset_issuer": "GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5"
	},
	{
		"asset_code": "LTC",
		"asset_issuer": "GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P"
	}
]
```

Parameters of POST request are fully compatible with horizon response when loading an account, so you can directly do
```
const accountData = await horizon.loadAccount(userAccount);
const metaResponse = await fetch('https://stellar-asset-meta.apay.workers.dev', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.strongify(accountData.balances),
});
const meta = await metaResponse.json();
```


Successful response looks like that
```
{
    "BTC:GAUTUYY2THLF7SGITDFMXJVYH3LHDSMGEAKSBU267M2K7A3W543CKUEF": {
        "status": "live",
        "name": "Bitcoin",
        "image": "https://apay.io/public/logo/btc.svg",
        "transferServer": "https://api.apay.io/api"
    },
    "ETH:GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5": {
        "status": "live",
        "name": "Ethereum",
        "image": "https://stellarport.io/assets/issues/eth.png",
        "transferServer": "https://a3s.api.stellarport.io/v3/GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5"
    },
    "LTC:GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P": {
        "status": "live",
        "name": "Litecoin",
        "image": "https://interstellar.exchange/app/assets/images/coins/LTC.png",
        "transferServer": "https://cryptoanchor.io/stellar/"
    }
}
```

## Running your own
If you don't want to use existing endpoint and want to launch your own instead

- Follow cloudflare instructions to [install](https://developers.cloudflare.com/workers/tooling/wrangler/install/) and [configure](https://developers.cloudflare.com/workers/tooling/wrangler/configuration) wrangler cli tool
- `cp wrangler.toml.example wrangler.toml` and paste values from your own cloudflare account for account_id and zone_id parameters
- `wrangler publish`

That's it, you're done

However it's beneficial to use the same endpoint as others, because it caches responses and able to serve metadata faster when more people using it
