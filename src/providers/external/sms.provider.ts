import { Injectable } from '@nestjs/common';
import axios from 'axios';


@Injectable()
export class SmsProvider {

    private readonly access_token: string = "nCIGkdpDWt0Hr7hp5gIlGQSsCKee7lkN";

    async sendSms(phoneNumber: string, message: string) {
        //phoneNumber 0906675349 
        // convert +84
        phoneNumber = phoneNumber.replace(/^0/, '+84');
        const url = 'https://api.speedsms.vn/index.php/sms/send';

        const params = {
            to: phoneNumber,
            content: message,
            sms_type: 2,
            sender: "71bf2cf554c9168d"
        };

        // Tạo mã xác thực Basic Auth
        const auth = Buffer.from(`${this.access_token}:x`).toString('base64');

        try {
            const response = await axios.post(url, params, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                }
            });

            const data = response.data;
            if (data.status === 'success') {
                console.log("Send SMS success");
            } else {
                console.log("Send SMS failed:", data);
            }
        } catch (error) {
            console.error("Send SMS failed:", error.response ? error.response.data : error.message);
        }
    }
}