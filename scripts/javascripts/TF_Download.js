var body = JSON.parse($request.body)
body.storefrontId = '143380-1,29'
$done({body: JSON.stringify(app)})