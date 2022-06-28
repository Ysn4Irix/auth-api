/**
 * @author Ysn4Irix
 * @email ysn4irix@gmail.com
 * @create date 11-05-2021
 * @modify date 19-08-2021
 * @desc VPN & Proxy Detection using the VPNapi
 */

const axios = require("axios")

module.exports = async (ip_address) => {
  try {
    const vpnAPI = await axios.get(
      `https://vpnapi.io/api/${ip_address}?key=${process.env.VPNAPI_APIKEY}`
    )
    return vpnAPI.data
  } catch (error) {
    return error
  }
}
