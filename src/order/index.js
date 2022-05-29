import {
  PutItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import ddbClient from './ddbClient';

exports.handler = async (event) => {
  console.log('requst event:', event);
  if (event.Records) {
    return await sqsInvocation(event);
  } else {
    return await apiGatewayInvocation(event);
  }
};

const sqsInvocation = async (event) => {
  console.log('sqsInvocation function, event: ', event);
  for (const record of event.Records) {
    const payload = JSON.parse(record.body);
    await createOrder(payload.detail);
  }
};

const createOrder = async (payload) => {
  console.log('createOrder function, payload: ', payload);
  try {
    payload.orderDate = new Date().toISOString();
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(payload || {}),
    };
    const result = await ddbClient.send(new PutItemCommand(params));
    console.log(result);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const apiGatewayInvocation = async (event) => {
  let data;
  try {
    switch (event.httpMethod) {
      case 'GET':
        if (event.pathParameters !== null) {
          data = await getOrder(
            event.pathParameters.userId,
            event.queryStringParameters.orderDate
          );
        } else {
          data = await getAllOrders();
        }
        break;
      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }
    console.log(data);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        data,
      }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to perform operation.',
        errorMsg: e.message,
        errorStack: e.stack,
      }),
    };
  }
};

const getOrder = async (userId, orderDate) => {
  console.log('getOrder: ', userId, orderDate);
  try {
    const params = {
      KeyConditionExpression: 'userId = :userId and orderDate = :orderDate',
      ExpressionAttributeValues: {
        ':userId': { S: userId },
        ':orderDate': { S: orderDate },
      },
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };
    const { Items } = await ddbClient.send(new QueryCommand(params));
    console.log(Items);
    return Items.map((item) => unmarshall(item));
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getAllOrders = async () => {
  console.log('getAllOrders');
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (e) {
    console.error(e);
    throw e;
  }
};
