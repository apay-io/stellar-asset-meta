import { parse } from '@iarna/toml';

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});

/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
  const assets = request.method === 'POST'
    ? (await request.json()).filter(v => v.asset_code && v.asset_issuer).map(v => `${v.asset_code}:${v.asset_issuer}`)
    : parseQueryParams(request.url).assets;

  let results = {};
  for (const asset of assets) {
    const [ code, issuer ] = asset.split(':');
    try {
      const horizonResponse = await fetch(`https://horizon.stellar.org/accounts/${issuer}`);
      if (horizonResponse.status !== 200) {
        results[asset] = {
          error: `Unable to load account ${issuer}`
        };
        continue;
      }
      const issuerData = await horizonResponse.json();
      if (!issuerData.home_domain) {
        results[asset] = {
          error: `No home domain on account ${issuer}`
        };
        continue;
      }
      const tomlResponse = await fetch(`https://${issuerData.home_domain}/.well-known/stellar.toml`);
      if (tomlResponse.status !== 200) {
        results[asset] = {
          error: `toml file is not available on ${issuerData.home_domain}`
        };
        continue;
      }
      const toml = parse(await tomlResponse.text());
      if (!toml || !toml.CURRENCIES) {
        results[asset] = {
          error: `unable to parse toml`
        };
        continue;
      }
      for (const currency of toml.CURRENCIES) {
        if (asset === `${currency.code}:${currency.issuer}`) {
          results[asset] = {
            status: currency.status || 'live',
            name: currency.name,
            image: currency.image,
            transferServer: toml.TRANSFER_SERVER,
          }
        }
      }
    } catch (e) {
      console.error(e.message);
      results[asset] = {
        'error': 'Something went wrong'
      };
    }
  }
  return new Response(JSON.stringify(results), {
    headers: { 'content-type': 'application/json' },
  })
}

const parseQueryParams = query => {
  const qPos = query.indexOf('?');
  const hPos = query.indexOf('#');
  return qPos > -1
    ? query.slice(qPos + 1, hPos > -1 ? hPos : undefined)
      .split('&')
      .reduce((params, param) => {
          const [key, value] = param.split('=');
          const decoded = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
          if (params[key]) {
            params[key].push(decoded)
          } else {
            params[key] = [decoded];
          }
          return params;
        }, {}
      )
    : {}
};
