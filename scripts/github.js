const boxConfig = $persistentStore.read("GitHub");
if (boxConfig) {config = JSON.parse(boxConfig);}

const username = $request.url.match(/https:\/\/(?:raw|gist)\.githubusercontent\.com\/([^\/]+)\//)[1];
if (username == config.username) {
  console.log(`ACCESSING PRIVATE REPO: ${$request.url}`);
  $done({ headers: {...$request.headers, Authorization: `token ${config.token}`} });
} else $done({});