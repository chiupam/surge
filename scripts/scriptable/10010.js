// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: magic;

const $ = importModule("Env");

const title = '联通5G'
const preview = 'small' // 预览大小 可选:small,medium,large
const spacing = 5 // 间隙大小
const Cookie = await getdata("CUCC_Cookie")
const Mobile = await getdata("CUCC_Mobile")
if (Cookie && Mobile) await render()

async function render() {
  const res = await getinfo()
  if (config.runsInWidget) {
    let widget = await createWidget(res)
    Script.setWidget(widget)
    Script.complete()
  } else {
    await createWidget(res)
  }
}

async function createWidget(res) {
  if (res.code == "Y") {
    const traffic = res.data.dataList[0]
    const flow = res.data.dataList[1]
    const voice = res.data.dataList[2]
    const credit = res.data.dataList[3]

    const opts = {
      title,
      texts: {
        traffic: `[${traffic.remainTitle}] ${traffic.number}${traffic.unit}`,  // 剩余流量
        flow: `[${flow.remainTitle}] ${flow.number}${flow.unit}`,  // 剩余话费
        voice: `[${voice.remainTitle}] ${voice.number}${voice.unit}`,  // 剩余语音
        credit: `[${credit.remainTitle}] ${credit.number}${credit.unit}`,  // 可用积分
        updateTime: 'true',
        battery: 'true'
      },
      preview,
      spacing
    }
    let widget = await $.createWidget(opts)
    return widget
  }
}

async function getinfo() {
  const url = {
    url: `https://m.client.10010.com/mobileService/home/queryUserInfoSeven.htm?version=iphone_c@7.0403&desmobiel=${Mobile}&showType=3`,
    headers: {Cookie: Cookie},
  }
  const res = await $.get(url)
  return res
}

async function getdata(key) {
  const url = `http://boxjs.net/query/data/${key}`;
  const boxdata = await $.get({ url })
  return boxdata.val
}