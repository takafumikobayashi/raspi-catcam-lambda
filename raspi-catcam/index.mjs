import AWS from 'aws-sdk';
import CryptoJS from 'crypto-js';

export const handler = async (event) => {
    const sqs = new AWS.SQS();
    const queueUrl = 'https://sqs.us-east-1.amazonaws.com/001820037060/raspi-catcam.fifo';

    const params = {
        QueueUrl: queueUrl,
        MessageBody: event.body,
        MessageGroupId: 'default',  // FIFOキュー用にMessageGroupIdを追加
        MessageDeduplicationId: new Date().toISOString()  // メッセージの重複排除用ID
    };

    try {
        // X-Line-Signatureの検証
        const channelSecret = process.env['SECRET_KEY']; // Channel secret string
        const hash = CryptoJS.HmacSHA256(event.body, channelSecret);
        const signature = CryptoJS.enc.Base64.stringify(hash);

        if (signature !== event.headers['x-line-signature']){
            return {
                statusCode: 401,
                body: JSON.stringify('Error Request Unauthorized')
            };
        } else {
            await sqs.sendMessage(params).promise();
            return {
                statusCode: 200,
                body: JSON.stringify('Message received and sent to SQS')
            };
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify('Error sending message to SQS')
        };
    }
};
