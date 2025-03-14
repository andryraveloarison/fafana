import { TuyaContext } from '@tuya/tuya-connector-nodejs';

const context = new TuyaContext({
    baseUrl: 'https://openapi.tuyaeu.com',
    accessKey: 'nenhvcwjfxmpdtqyhwnk',
    secretKey: '6c0c1ec2fda14a139760a82e504f62de',
});


const device_id = "vdevo162799080003567";
const devicedetail = await context.device.detail({
  device_id: device_id,
});
if(!devicedetail.success) {
  new Error();
}
console.log("Device details:",devicedetail);


export const getDetail = async (req, res) => {
    try {
        const device_id = req.body.device_id

        const deviceDetail = await context.device.detail({ device_id });

        // Vérifier si la requête a réussi
        if (!deviceDetail.success) {
            throw new Error('Failed to fetch device details');
        }

        // Retourner les détails sous forme de JSON
        res.status(200).json({
            success: true,
            data: deviceDetail.result,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'An unknown error occurred',
        })
    }
};