import AWS from 'aws-sdk';
import crypto from 'crypto';

export const handler = async (event) => {
    const sqs = new AWS.SQS();
    const queueUrl = process.env['AWS_SQS_QUEUE_URL'];

    const params = {
        QueueUrl: queueUrl,
        MessageBody: event.body,
        MessageGroupId: 'default',  // FIFOキュー用にMessageGroupIdを追加
        MessageDeduplicationId: new Date().toISOString()  // メッセージの重複排除用ID
    };

    try {
        // X-Line-Signatureの検証
        const channelSecret = process.env['SECRET_KEY']; // Channel secret string
        const hmac = crypto.createHmac('sha256', channelSecret);
        hmac.update(event.body);
        const signature = hmac.digest('base64');

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
